import { requireTenantAuth } from '@/api/middleware'
import { PlanLimitsService } from '@/api/plan-limits.service'
import { createTenantConnection } from '@/api/database.settings'
import * as tenantSchema from '@/api/db/schemas/tenant.drizzle'
import { eq, and } from 'drizzle-orm'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

const createCompanySchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  description: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  industry: z.string().optional(),
  size: z.enum(['small', 'medium', 'large', 'enterprise']).optional(),
  website: z.string().url().optional(),
  parentCompanyId: z.string().uuid().optional(),
})

const updateCompanySchema = createCompanySchema.partial()

const addUserToCompanySchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'member', 'viewer']).default('member'),
  isPrimary: z.boolean().default(false),
})

export const tenantCompaniesRoutes = new Hono()
  .use('*', requireTenantAuth)

  // Get all companies in workspace
  .get('/', async c => {
    try {
      const tenantDatabase = c.get('tenantDatabase')
      const db = createTenantConnection(tenantDatabase)

      const companies = await db.query.companies.findMany({
        with: {
          users: {
            with: {
              user: true,
            },
          },
          createdByUser: true,
        },
      })

      return c.json({ success: true, data: companies })
    } catch (error) {
      console.error('Error fetching companies:', error)
      return c.json({ success: false, error: 'Failed to fetch companies' }, 500)
    }
  })

  // Create new company (with plan limit validation)
  .post('/', zValidator('json', createCompanySchema), async c => {
    try {
      const data = c.req.valid('json')
      const tenant = c.get('tenant')
      const currentUser = c.get('user')
      const tenantDatabase = c.get('tenantDatabase')

      // Check plan limits
      const limitsService = new PlanLimitsService()
      const canAdd = await limitsService.canAddCompany(tenant.id)

      if (!canAdd.allowed) {
        return c.json(
          {
            success: false,
            error: canAdd.reason,
          },
          403
        )
      }

      const db = createTenantConnection(tenantDatabase)

      // Check if company code already exists
      if (data.code) {
        const existingCompany = await db.query.companies.findFirst({
          where: eq(tenantSchema.companies.code, data.code),
        })

        if (existingCompany) {
          return c.json(
            {
              success: false,
              error: 'Company with this code already exists',
            },
            400
          )
        }
      }

      // Create company
      const [newCompany] = await db
        .insert(tenantSchema.companies)
        .values({
          ...data,
          createdBy: currentUser.id,
        })
        .returning()

      // Add creator as company owner
      await db.insert(tenantSchema.userCompanies).values({
        userId: currentUser.id,
        companyId: newCompany.id,
        role: 'owner',
        isPrimary: true,
      })

      return c.json(
        {
          success: true,
          data: newCompany,
        },
        201
      )
    } catch (error) {
      console.error('Error creating company:', error)
      return c.json({ success: false, error: 'Failed to create company' }, 500)
    }
  })

  // Get company by ID
  .get('/:id', async c => {
    try {
      const companyId = c.req.param('id')
      const tenantDatabase = c.get('tenantDatabase')
      const db = createTenantConnection(tenantDatabase)

      const company = await db.query.companies.findFirst({
        where: eq(tenantSchema.companies.id, companyId),
        with: {
          users: {
            with: {
              user: true,
            },
          },
          parentCompany: true,
          createdByUser: true,
        },
      })

      if (!company) {
        return c.json({ success: false, error: 'Company not found' }, 404)
      }

      return c.json({ success: true, data: company })
    } catch (error) {
      console.error('Error fetching company:', error)
      return c.json({ success: false, error: 'Failed to fetch company' }, 500)
    }
  })

  // Update company
  .put('/:id', zValidator('json', updateCompanySchema), async c => {
    try {
      const companyId = c.req.param('id')
      const data = c.req.valid('json')
      const tenantDatabase = c.get('tenantDatabase')
      const db = createTenantConnection(tenantDatabase)

      // Check if company code already exists (if updating code)
      if (data.code) {
        const existingCompany = await db.query.companies.findFirst({
          where: and(
            eq(tenantSchema.companies.code, data.code),
            eq(tenantSchema.companies.id, companyId).not()
          ),
        })

        if (existingCompany) {
          return c.json(
            {
              success: false,
              error: 'Company with this code already exists',
            },
            400
          )
        }
      }

      const [updatedCompany] = await db
        .update(tenantSchema.companies)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(tenantSchema.companies.id, companyId))
        .returning()

      if (!updatedCompany) {
        return c.json({ success: false, error: 'Company not found' }, 404)
      }

      return c.json({ success: true, data: updatedCompany })
    } catch (error) {
      console.error('Error updating company:', error)
      return c.json({ success: false, error: 'Failed to update company' }, 500)
    }
  })

  // Delete company (soft delete)
  .delete('/:id', async c => {
    try {
      const companyId = c.req.param('id')
      const tenantDatabase = c.get('tenantDatabase')
      const db = createTenantConnection(tenantDatabase)

      const [updatedCompany] = await db
        .update(tenantSchema.companies)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(tenantSchema.companies.id, companyId))
        .returning()

      if (!updatedCompany) {
        return c.json({ success: false, error: 'Company not found' }, 404)
      }

      return c.json({ success: true, message: 'Company deactivated successfully' })
    } catch (error) {
      console.error('Error deleting company:', error)
      return c.json({ success: false, error: 'Failed to delete company' }, 500)
    }
  })

  // Add user to company
  .post('/:id/users', zValidator('json', addUserToCompanySchema), async c => {
    try {
      const companyId = c.req.param('id')
      const data = c.req.valid('json')
      const tenantDatabase = c.get('tenantDatabase')
      const db = createTenantConnection(tenantDatabase)

      // Check if user is already in company
      const existingRelation = await db.query.userCompanies.findFirst({
        where: and(
          eq(tenantSchema.userCompanies.userId, data.userId),
          eq(tenantSchema.userCompanies.companyId, companyId)
        ),
      })

      if (existingRelation) {
        return c.json(
          {
            success: false,
            error: 'User is already in this company',
          },
          400
        )
      }

      // If setting as primary, unset other primary companies for this user
      if (data.isPrimary) {
        await db
          .update(tenantSchema.userCompanies)
          .set({ isPrimary: false })
          .where(eq(tenantSchema.userCompanies.userId, data.userId))
      }

      // Add user to company
      const [newRelation] = await db
        .insert(tenantSchema.userCompanies)
        .values({
          userId: data.userId,
          companyId,
          role: data.role,
          isPrimary: data.isPrimary,
        })
        .returning()

      return c.json({ success: true, data: newRelation }, 201)
    } catch (error) {
      console.error('Error adding user to company:', error)
      return c.json({ success: false, error: 'Failed to add user to company' }, 500)
    }
  })

  // Remove user from company
  .delete('/:id/users/:userId', async c => {
    try {
      const companyId = c.req.param('id')
      const userId = c.req.param('userId')
      const tenantDatabase = c.get('tenantDatabase')
      const db = createTenantConnection(tenantDatabase)

      const result = await db
        .delete(tenantSchema.userCompanies)
        .where(
          and(
            eq(tenantSchema.userCompanies.userId, userId),
            eq(tenantSchema.userCompanies.companyId, companyId)
          )
        )
        .returning()

      if (result.length === 0) {
        return c.json({ success: false, error: 'User not found in company' }, 404)
      }

      return c.json({ success: true, message: 'User removed from company' })
    } catch (error) {
      console.error('Error removing user from company:', error)
      return c.json({ success: false, error: 'Failed to remove user from company' }, 500)
    }
  })

  // Get company usage limits
  .get('/usage/limits', async c => {
    try {
      const tenant = c.get('tenant')
      const limitsService = new PlanLimitsService()

      const limits = await limitsService.getTenantPlanLimits(tenant.id)

      if (!limits) {
        return c.json(
          {
            success: false,
            error: 'Unable to fetch plan limits',
          },
          500
        )
      }

      return c.json({
        success: true,
        data: {
          companies: {
            current: limits.currentCompanies,
            max: limits.maxCompanies,
            remaining: limits.remainingCompanies,
            canAdd: limits.canAddCompanies,
          },
        },
      })
    } catch (error) {
      console.error('Error fetching usage limits:', error)
      return c.json({ success: false, error: 'Failed to fetch usage limits' }, 500)
    }
  })
