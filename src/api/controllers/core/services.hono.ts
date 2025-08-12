import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { and, desc, eq, count } from 'drizzle-orm'
import { Hono } from 'hono'
import { createCoreConnection } from '../../database.settings'
import { services, serviceSubscriptions, serviceUsage } from '../../db/schemas/services.drizzle'
import { requireCoreAuth, optionalCoreAuth } from '@/api/middleware'

// Define schemas for service operations
const createServiceSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  baseUrl: z.string().url(),
  maxUsers: z.number().min(0).optional(),
  isActive: z.boolean().default(true),
})

const updateServiceSchema = createServiceSchema.partial()

const createServiceSubscriptionSchema = z.object({
  serviceId: z.string().uuid(),
  tenantId: z.string().uuid(),
  tenantName: z.string().optional(),
  status: z.string().default('active'),
  userCount: z.number().min(0).default(0),
  pricePerUser: z.string().default('0.00'), // decimal field in database
  totalMonthlyPrice: z.string().default('0.00'), // decimal field in database
  billingCycle: z.string().default('monthly'),
})

export const servicesRouter = new Hono()
  // Public routes for service discovery
  .get('/', optionalCoreAuth, async c => {
    try {
      const activeServices = await createCoreConnection()
        .select()
        .from(services)
        .where(eq(services.isActive, true))
        .orderBy(services.name)

      return c.json({ services: activeServices })
    } catch (_error) {
      return c.json({ error: 'Failed to fetch services' }, 500)
    }
  })

  // Get single service
  .get('/:id', async c => {
    try {
      const serviceId = c.req.param('id')
      const [service] = await createCoreConnection()
        .select()
        .from(services)
        .where(eq(services.id, serviceId))

      if (!service) {
        return c.json({ error: 'Service not found' }, 404)
      }

      return c.json({ service })
    } catch (_error) {
      return c.json({ error: 'Failed to fetch service' }, 500)
    }
  })

  // Get service by slug
  .get('/slug/:slug', async c => {
    try {
      const slug = c.req.param('slug')
      const [service] = await createCoreConnection()
        .select()
        .from(services)
        .where(and(eq(services.slug, slug), eq(services.isActive, true)))

      if (!service) {
        return c.json({ error: 'Service not found' }, 404)
      }

      return c.json({ service })
    } catch (_error) {
      return c.json({ error: 'Failed to fetch service' }, 500)
    }
  })

  // Create service - Admin only
  .post('/', requireCoreAuth, zValidator('json', createServiceSchema), async c => {
    try {
      const serviceData = c.req.valid('json')

      const [newService] = await createCoreConnection()
        .insert(services)
        .values(serviceData)
        .returning()

      return c.json({ service: newService }, 201)
    } catch (_error) {
      return c.json({ error: 'Failed to create service' }, 500)
    }
  })

  // Update service - Admin only
  .put('/:id', requireCoreAuth, zValidator('json', updateServiceSchema), async c => {
    try {
      const serviceId = c.req.param('id')
      const updateData = c.req.valid('json')

      const [updatedService] = await createCoreConnection()
        .update(services)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(services.id, serviceId))
        .returning()

      if (!updatedService) {
        return c.json({ error: 'Service not found' }, 404)
      }

      return c.json({ service: updatedService })
    } catch (_error) {
      return c.json({ error: 'Failed to update service' }, 500)
    }
  })

  // Deactivate service - Admin only
  .delete('/:id', requireCoreAuth, async c => {
    try {
      const serviceId = c.req.param('id')

      const [deactivatedService] = await createCoreConnection()
        .update(services)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(services.id, serviceId))
        .returning()

      if (!deactivatedService) {
        return c.json({ error: 'Service not found' }, 404)
      }

      return c.json({ message: 'Service deactivated successfully' })
    } catch (_error) {
      return c.json({ error: 'Failed to deactivate service' }, 500)
    }
  })

  // SERVICE SUBSCRIPTIONS MANAGEMENT

  // Get all service subscriptions
  .get('/:serviceId/subscriptions', async c => {
    try {
      const serviceId = c.req.param('serviceId')

      const subscriptions = await createCoreConnection()
        .select({
          id: serviceSubscriptions.id,
          serviceId: serviceSubscriptions.serviceId,
          tenantId: serviceSubscriptions.tenantId,
          tenantName: serviceSubscriptions.tenantName,
          status: serviceSubscriptions.status,
          userCount: serviceSubscriptions.userCount,
          pricePerUser: serviceSubscriptions.pricePerUser,
          totalMonthlyPrice: serviceSubscriptions.totalMonthlyPrice,
          billingCycle: serviceSubscriptions.billingCycle,
          trialEndsAt: serviceSubscriptions.trialEndsAt,
          nextBillingDate: serviceSubscriptions.nextBillingDate,
          createdAt: serviceSubscriptions.createdAt,
          serviceName: services.name,
        })
        .from(serviceSubscriptions)
        .leftJoin(services, eq(serviceSubscriptions.serviceId, services.id))
        .where(eq(serviceSubscriptions.serviceId, serviceId))
        .orderBy(desc(serviceSubscriptions.createdAt))

      return c.json({ subscriptions })
    } catch (_error) {
      return c.json({ error: 'Failed to fetch service subscriptions' }, 500)
    }
  })

  // Create service subscription
  .post(
    '/:serviceId/subscriptions',
    zValidator('json', createServiceSubscriptionSchema),
    async c => {
      try {
        const subscriptionData = c.req.valid('json')

        const [newSubscription] = await createCoreConnection()
          .insert(serviceSubscriptions)
          .values(subscriptionData)
          .returning()

        return c.json({ subscription: newSubscription }, 201)
      } catch (_error) {
        return c.json({ error: 'Failed to create service subscription' }, 500)
      }
    }
  )

  // Get service usage statistics
  .get('/:serviceId/usage', async c => {
    try {
      const serviceId = c.req.param('serviceId')

      // Get usage for last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const usage = await createCoreConnection()
        .select()
        .from(serviceUsage)
        .where(
          and(
            eq(serviceUsage.serviceId, serviceId),
            eq(serviceUsage.usageDate, thirtyDaysAgo) // This would need proper date comparison
          )
        )
        .orderBy(desc(serviceUsage.usageDate))

      // Get total stats
      const [stats] = await createCoreConnection()
        .select({
          totalSubscriptions: count(serviceSubscriptions.id),
          totalActiveUsers: serviceSubscriptions.userCount,
        })
        .from(serviceSubscriptions)
        .where(
          and(
            eq(serviceSubscriptions.serviceId, serviceId),
            eq(serviceSubscriptions.status, 'active')
          )
        )

      return c.json({ usage, stats })
    } catch (_error) {
      return c.json({ error: 'Failed to fetch service usage' }, 500)
    }
  })

  // Get service dashboard stats
  .get('/stats/dashboard', async c => {
    try {
      // Get service counts
      const [serviceStats] = await createCoreConnection()
        .select({
          totalServices: count(services.id),
          activeServices: count(services.id),
        })
        .from(services)
        .where(eq(services.isActive, true))

      // Get subscription stats
      const [subscriptionStats] = await createCoreConnection()
        .select({
          totalSubscriptions: count(serviceSubscriptions.id),
          activeSubscriptions: count(serviceSubscriptions.id),
        })
        .from(serviceSubscriptions)
        .where(eq(serviceSubscriptions.status, 'active'))

      return c.json({
        services: serviceStats,
        subscriptions: subscriptionStats,
      })
    } catch (_error) {
      return c.json({ error: 'Failed to fetch service dashboard stats' }, 500)
    }
  })
