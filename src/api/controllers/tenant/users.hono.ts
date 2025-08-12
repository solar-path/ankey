import { requireTenantAuth } from '@/api/middleware'
import { PlanLimitsService } from '@/api/plan-limits.service'
import { TenantAuthService } from '@/api/auth.settings'
import { createTenantConnection } from '@/api/database.settings'
import * as tenantSchema from '@/api/db/schemas/tenant.drizzle'
import { eq } from 'drizzle-orm'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

const inviteUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  role: z.string().optional(),
  companyId: z.string().uuid().optional(),
})

const updateUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  role: z.string().optional(),
})

export const tenantUsersRoutes = new Hono()
  .use('*', requireTenantAuth)

  // Get all users in workspace
  .get('/', async c => {
    try {
      const tenantDatabase = c.get('tenantDatabase')
      const db = createTenantConnection(tenantDatabase)

      const users = await db.query.users.findMany({
        with: {
          userRoles: {
            with: {
              role: true,
            },
          },
          companies: {
            with: {
              company: true,
            },
          },
        },
      })

      return c.json({ success: true, data: users })
    } catch (error) {
      console.error('Error fetching users:', error)
      return c.json({ success: false, error: 'Failed to fetch users' }, 500)
    }
  })

  // Invite new user (with plan limit validation)
  .post('/invite', zValidator('json', inviteUserSchema), async c => {
    try {
      const data = c.req.valid('json')
      const tenant = c.get('tenant')
      const currentUser = c.get('user')
      const tenantDatabase = c.get('tenantDatabase')

      // Check plan limits
      const limitsService = new PlanLimitsService()
      const canAdd = await limitsService.canAddUser(tenant.id)

      if (!canAdd.allowed) {
        return c.json(
          {
            success: false,
            error: canAdd.reason,
          },
          403
        )
      }

      // Create user invitation
      const authService = new TenantAuthService(tenantDatabase)
      const db = createTenantConnection(tenantDatabase)

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(tenantSchema.users.email, data.email),
      })

      if (existingUser) {
        return c.json(
          {
            success: false,
            error: 'User with this email already exists',
          },
          400
        )
      }

      // Generate invite token
      const inviteToken = crypto.randomUUID()
      const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      // Create invited user
      const [newUser] = await db
        .insert(tenantSchema.users)
        .values({
          email: data.email,
          fullName: data.fullName,
          invitedBy: currentUser.id,
          inviteToken,
          inviteExpiresAt,
          isActive: false, // Inactive until they accept invitation
          emailVerified: false,
        })
        .returning()

      // If companyId provided, add user to company
      if (data.companyId) {
        await db.insert(tenantSchema.userCompanies).values({
          userId: newUser.id,
          companyId: data.companyId,
          role: data.role || 'member',
        })
      }

      // TODO: Send invitation email
      console.log(`Invitation token for ${data.email}: ${inviteToken}`)

      return c.json(
        {
          success: true,
          data: {
            userId: newUser.id,
            inviteToken, // In production, don't return this
          },
        },
        201
      )
    } catch (error) {
      console.error('Error inviting user:', error)
      return c.json({ success: false, error: 'Failed to invite user' }, 500)
    }
  })

  // Get user by ID
  .get('/:id', async c => {
    try {
      const userId = c.req.param('id')
      const tenantDatabase = c.get('tenantDatabase')
      const db = createTenantConnection(tenantDatabase)

      const user = await db.query.users.findFirst({
        where: eq(tenantSchema.users.id, userId),
        with: {
          userRoles: {
            with: {
              role: true,
            },
          },
          companies: {
            with: {
              company: true,
            },
          },
        },
      })

      if (!user) {
        return c.json({ success: false, error: 'User not found' }, 404)
      }

      return c.json({ success: true, data: user })
    } catch (error) {
      console.error('Error fetching user:', error)
      return c.json({ success: false, error: 'Failed to fetch user' }, 500)
    }
  })

  // Update user
  .put('/:id', zValidator('json', updateUserSchema), async c => {
    try {
      const userId = c.req.param('id')
      const data = c.req.valid('json')
      const tenantDatabase = c.get('tenantDatabase')
      const db = createTenantConnection(tenantDatabase)

      const [updatedUser] = await db
        .update(tenantSchema.users)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(tenantSchema.users.id, userId))
        .returning()

      if (!updatedUser) {
        return c.json({ success: false, error: 'User not found' }, 404)
      }

      return c.json({ success: true, data: updatedUser })
    } catch (error) {
      console.error('Error updating user:', error)
      return c.json({ success: false, error: 'Failed to update user' }, 500)
    }
  })

  // Delete user (soft delete - just deactivate)
  .delete('/:id', async c => {
    try {
      const userId = c.req.param('id')
      const tenantDatabase = c.get('tenantDatabase')
      const currentUser = c.get('user')

      // Prevent self-deletion
      if (userId === currentUser.id) {
        return c.json({ success: false, error: 'Cannot delete your own account' }, 400)
      }

      const db = createTenantConnection(tenantDatabase)

      const [updatedUser] = await db
        .update(tenantSchema.users)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(tenantSchema.users.id, userId))
        .returning()

      if (!updatedUser) {
        return c.json({ success: false, error: 'User not found' }, 404)
      }

      return c.json({ success: true, message: 'User deactivated successfully' })
    } catch (error) {
      console.error('Error deleting user:', error)
      return c.json({ success: false, error: 'Failed to delete user' }, 500)
    }
  })

  // Get plan usage for users
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
          users: {
            current: limits.currentUsers,
            max: limits.maxUsers,
            remaining: limits.remainingUsers,
            canAdd: limits.canAddUsers,
          },
        },
      })
    } catch (error) {
      console.error('Error fetching usage limits:', error)
      return c.json({ success: false, error: 'Failed to fetch usage limits' }, 500)
    }
  })
