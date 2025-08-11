import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { and, desc, eq, gte, lte, count, notInArray } from 'drizzle-orm'
import { Hono } from 'hono'
import { createCoreConnection, createTenantConnection, checkDatabaseExists } from '../../database.settings'
import { pricingDiscounts, pricingPlans, tenantSubscriptions, tenants } from '../../db/schemas/core.drizzle'
import * as tenantSchema from '../../db/schemas/tenant.drizzle'
import { requireCoreAuth, optionalCoreAuth } from '@/api/middleware'

// Define schemas based on database structure
const createPricingPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  pricePerUserPerMonth: z.number().min(0),
  minUsers: z.number().optional(),
  maxUsers: z.number().optional(),
  features: z.string(), // JSON string of features array
  trialDays: z.number().optional(),
  trialMaxUsers: z.number().optional(),
  displayOrder: z.number().default(0),
  badge: z.string().optional(),
  isActive: z.boolean().default(true),
})

const updatePricingPlanSchema = createPricingPlanSchema.partial()

const createDiscountSchema = z.object({
  planId: z.string().uuid(),
  name: z.string().min(1),
  discountPercent: z.number().min(0).max(100),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  promoCode: z.string().optional(),
  minMonths: z.number().optional(),
  isActive: z.boolean().default(true),
})

const updateDiscountSchema = createDiscountSchema.partial()

const createSubscriptionSchema = z.object({
  tenantId: z.string().uuid(),
  planId: z.string().uuid(),
  status: z.string(),
  userCount: z.number().min(0),
  pricePerUser: z.number().min(0),
  totalMonthlyPrice: z.number().min(0),
  billingCycle: z.string(),
  trialEndsAt: z.coerce.date().optional(),
  nextBillingDate: z.coerce.date().optional(),
})

const _updateSubscriptionSchema = createSubscriptionSchema.partial() // Reserved for future use

// PRICING PLANS CRUD

// Get all pricing plans
export const pricingRouter = new Hono()
  // Public routes for pricing display
  .get('/plans', optionalCoreAuth, async c => {
    try {
      // Get database connection
      const plans = await createCoreConnection()
        .select()
        .from(pricingPlans)
        .where(eq(pricingPlans.isActive, true))
        .orderBy(pricingPlans.displayOrder, desc(pricingPlans.createdAt))

      return c.json({ plans })
    } catch (_error) {
      return c.json({ error: 'Failed to fetch pricing plans' }, 500)
    }
  })

  // Get single pricing plan
  .get('/plans/:id', async c => {
    try {
      // Get database connection
      const planId = c.req.param('id')
      const [plan] = await createCoreConnection()
        .select()
        .from(pricingPlans)
        .where(eq(pricingPlans.id, planId))

      if (!plan) {
        return c.json({ error: 'Pricing plan not found' }, 404)
      }

      return c.json({ plan })
    } catch (_error) {
      return c.json({ error: 'Failed to fetch pricing plan' }, 500)
    }
  })

  // Create pricing plan - Admin only
  .post('/plans', requireCoreAuth, zValidator('json', createPricingPlanSchema), async c => {
    try {
      const planData = c.req.valid('json')

      const [newPlan] = await createCoreConnection()
        .insert(pricingPlans)
        .values(planData)
        .returning()

      return c.json({ plan: newPlan }, 201)
    } catch (_error) {
      return c.json({ error: 'Failed to create pricing plan' }, 500)
    }
  })

  // Update pricing plan - Admin only
  .put('/plans/:id', requireCoreAuth, zValidator('json', updatePricingPlanSchema), async c => {
    try {
      const planId = c.req.param('id')
      const updateData = c.req.valid('json')

      const [updatedPlan] = await createCoreConnection()
        .update(pricingPlans)
        .set(updateData)
        .where(eq(pricingPlans.id, planId))
        .returning()

      if (!updatedPlan) {
        return c.json({ error: 'Pricing plan not found' }, 404)
      }

      return c.json({ plan: updatedPlan })
    } catch (_error) {
      return c.json({ error: 'Failed to update pricing plan' }, 500)
    }
  })

  // Delete pricing plan (soft delete by setting isActive = false) - Admin only
  .delete('/plans/:id', requireCoreAuth, async c => {
    try {
      const planId = c.req.param('id')

      const [deletedPlan] = await createCoreConnection()
        .update(pricingPlans)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(pricingPlans.id, planId))
        .returning()

      if (!deletedPlan) {
        return c.json({ error: 'Pricing plan not found' }, 404)
      }

      return c.json({ message: 'Pricing plan deleted successfully' })
    } catch (_error) {
      return c.json({ error: 'Failed to delete pricing plan' }, 500)
    }
  })

  // PRICING DISCOUNTS CRUD

  // Get all discounts
  .get('/discounts', async c => {
    try {
      const discounts = await createCoreConnection()
        .select()
        .from(pricingDiscounts)
        .where(eq(pricingDiscounts.isActive, true))
        .orderBy(desc(pricingDiscounts.createdAt))

      return c.json({ discounts })
    } catch (_error) {
      return c.json({ error: 'Failed to fetch discounts' }, 500)
    }
  })

  // Get all discounts for a plan
  .get('/plans/:planId/discounts', async c => {
    try {
      const planId = c.req.param('planId')
      const discounts = await createCoreConnection()
        .select()
        .from(pricingDiscounts)
        .where(and(eq(pricingDiscounts.planId, planId), eq(pricingDiscounts.isActive, true)))
        .orderBy(desc(pricingDiscounts.createdAt))

      return c.json({ discounts })
    } catch (_error) {
      return c.json({ error: 'Failed to fetch discounts' }, 500)
    }
  })

  // Get active discounts for a plan (current date within range)
  .get('/plans/:planId/discounts/active', async c => {
    try {
      const planId = c.req.param('planId')
      const now = new Date()

      const activeDiscounts = await createCoreConnection()
        .select()
        .from(pricingDiscounts)
        .where(
          and(
            eq(pricingDiscounts.planId, planId),
            eq(pricingDiscounts.isActive, true),
            lte(pricingDiscounts.startDate, now),
            gte(pricingDiscounts.endDate, now)
          )
        )
        .orderBy(desc(pricingDiscounts.discountPercent))

      return c.json({ discounts: activeDiscounts })
    } catch (_error) {
      return c.json({ error: 'Failed to fetch active discounts' }, 500)
    }
  })

  // Create discount - Admin only
  .post('/discounts', requireCoreAuth, zValidator('json', createDiscountSchema), async c => {
    try {
      const discountData = c.req.valid('json')

      const [newDiscount] = await createCoreConnection()
        .insert(pricingDiscounts)
        .values(discountData)
        .returning()

      return c.json({ discount: newDiscount }, 201)
    } catch (_error) {
      return c.json({ error: 'Failed to create discount' }, 500)
    }
  })

  // Update discount
  .put('/discounts/:id', zValidator('json', updateDiscountSchema), async c => {
    try {
      const discountId = c.req.param('id')
      const updateData = c.req.valid('json')

      const [updatedDiscount] = await createCoreConnection()
        .update(pricingDiscounts)
        .set(updateData)
        .where(eq(pricingDiscounts.id, discountId))
        .returning()

      if (!updatedDiscount) {
        return c.json({ error: 'Discount not found' }, 404)
      }

      return c.json({ discount: updatedDiscount })
    } catch (_error) {
      return c.json({ error: 'Failed to update discount' }, 500)
    }
  })

  // Delete discount (soft delete)
  .delete('/discounts/:id', async c => {
    try {
      const discountId = c.req.param('id')

      const [deletedDiscount] = await createCoreConnection()
        .update(pricingDiscounts)
        .set({ isActive: false })
        .where(eq(pricingDiscounts.id, discountId))
        .returning()

      if (!deletedDiscount) {
        return c.json({ error: 'Discount not found' }, 404)
      }

      return c.json({ message: 'Discount deleted successfully' })
    } catch (_error) {
      return c.json({ error: 'Failed to delete discount' }, 500)
    }
  })

  // TENANT SUBSCRIPTIONS CRUD

  // Get all subscriptions (exclude services: shop, hunt, edu, swap)
  .get('/subscriptions', async c => {
    try {
      const subscriptions = await createCoreConnection()
        .select({
          id: tenantSubscriptions.id,
          tenantId: tenantSubscriptions.tenantId,
          tenantName: tenants.name,
          tenantSubdomain: tenants.subdomain,
          planId: tenantSubscriptions.planId,
          status: tenantSubscriptions.status,
          userCount: tenantSubscriptions.userCount,
          pricePerUser: tenantSubscriptions.pricePerUser,
          totalMonthlyPrice: tenantSubscriptions.totalMonthlyPrice,
          billingCycle: tenantSubscriptions.billingCycle,
          trialEndsAt: tenantSubscriptions.trialEndsAt,
          nextBillingDate: tenantSubscriptions.nextBillingDate,
          createdAt: tenantSubscriptions.createdAt,
          planName: pricingPlans.name,
        })
        .from(tenantSubscriptions)
        .leftJoin(pricingPlans, eq(tenantSubscriptions.planId, pricingPlans.id))
        .leftJoin(tenants, eq(tenantSubscriptions.tenantId, tenants.id))
        .where(and(
          // Exclude service tenants - only show actual customer tenants
          notInArray(tenants.subdomain, ['shop', 'hunt', 'edu', 'swap']),
          // Only show active tenants
          eq(tenants.isActive, true)
        ))
        .orderBy(desc(tenantSubscriptions.createdAt))

      return c.json({ subscriptions })
    } catch (_error) {
      return c.json({ error: 'Failed to fetch subscriptions' }, 500)
    }
  })

  // Get subscription by tenant ID
  .get('/subscriptions/tenant/:tenantId', async c => {
    try {
      const tenantId = c.req.param('tenantId')

      const [subscription] = await createCoreConnection()
        .select({
          id: tenantSubscriptions.id,
          tenantId: tenantSubscriptions.tenantId,
          planId: tenantSubscriptions.planId,
          discountId: tenantSubscriptions.discountId,
          status: tenantSubscriptions.status,
          userCount: tenantSubscriptions.userCount,
          pricePerUser: tenantSubscriptions.pricePerUser,
          totalMonthlyPrice: tenantSubscriptions.totalMonthlyPrice,
          billingCycle: tenantSubscriptions.billingCycle,
          trialEndsAt: tenantSubscriptions.trialEndsAt,
          nextBillingDate: tenantSubscriptions.nextBillingDate,
          createdAt: tenantSubscriptions.createdAt,
          planName: pricingPlans.name,
          planFeatures: pricingPlans.features,
          discountPercent: pricingDiscounts.discountPercent,
          discountName: pricingDiscounts.name,
        })
        .from(tenantSubscriptions)
        .leftJoin(pricingPlans, eq(tenantSubscriptions.planId, pricingPlans.id))
        .leftJoin(pricingDiscounts, eq(tenantSubscriptions.discountId, pricingDiscounts.id))
        .where(eq(tenantSubscriptions.tenantId, tenantId))

      if (!subscription) {
        return c.json({ error: 'Subscription not found' }, 404)
      }

      return c.json({ subscription })
    } catch (_error) {
      return c.json({ error: 'Failed to fetch subscription' }, 500)
    }
  })

  // Create subscription
  .post('/subscriptions', async c => {
    try {
      const subscriptionData = await c.req.json()

      const [newSubscription] = await createCoreConnection()
        .insert(tenantSubscriptions)
        .values({
          ...subscriptionData,
          updatedAt: new Date(),
        })
        .returning()

      return c.json({ subscription: newSubscription }, 201)
    } catch (_error) {
      return c.json({ error: 'Failed to create subscription' }, 500)
    }
  })

  // Update subscription
  .put('/subscriptions/:id', async c => {
    try {
      const subscriptionId = c.req.param('id')
      const updateData = await c.req.json()

      const [updatedSubscription] = await createCoreConnection()
        .update(tenantSubscriptions)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(tenantSubscriptions.id, subscriptionId))
        .returning()

      if (!updatedSubscription) {
        return c.json({ error: 'Subscription not found' }, 404)
      }

      return c.json({ subscription: updatedSubscription })
    } catch (_error) {
      return c.json({ error: 'Failed to update subscription' }, 500)
    }
  })

  // Cancel subscription
  .post('/subscriptions/:id/cancel', async c => {
    try {
      const subscriptionId = c.req.param('id')

      const [cancelledSubscription] = await createCoreConnection()
        .update(tenantSubscriptions)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tenantSubscriptions.id, subscriptionId))
        .returning()

      if (!cancelledSubscription) {
        return c.json({ error: 'Subscription not found' }, 404)
      }

      return c.json({ subscription: cancelledSubscription })
    } catch (_error) {
      return c.json({ error: 'Failed to cancel subscription' }, 500)
    }
  })

  // Sync subscription data from tenant databases
  .post('/subscriptions/sync', async c => {
    try {
      const db = createCoreConnection()
      
      // Get all tenants that were active (to detect databases that went missing)
      // This includes both active and recently inactive tenants with subscriptions
      const tenantsToCheck = await db
        .select()
        .from(tenants)
        .where(
          notInArray(tenants.subdomain, ['shop', 'hunt', 'edu', 'swap'])
        )
      
      let syncedCount = 0
      let createdSubscriptions = 0
      let errors = 0
      
      console.log(`🔄 Starting sync for ${tenantsToCheck.length} tenants...`)
      
      for (const tenant of tenantsToCheck) {
        try {
          console.log(`📊 Syncing tenant: ${tenant.name} (${tenant.subdomain})`)
          
          // First check if database exists
          let actualUserCount = 0
          const databaseExists = await checkDatabaseExists(tenant.database)
          
          if (!databaseExists) {
            console.log(`   ⚠️  Database ${tenant.database} does not exist`)
            actualUserCount = 0 // Set to 0 for missing databases
          } else {
            try {
              const tenantDb = createTenantConnection(tenant.database)
              
              // Get actual user count
              const userCountResult = await tenantDb
                .select({ count: count() })
                .from(tenantSchema.users)
                .where(eq(tenantSchema.users.isActive, true))
              
              actualUserCount = Number(userCountResult[0]?.count || 0)
              console.log(`   Users: ${tenant.userCount || 0} → ${actualUserCount}`)
            } catch (dbError: any) {
              console.error(`   ❌ Database error for ${tenant.database}:`, dbError.message || dbError)
              // Don't throw, just continue with 0 users
              actualUserCount = 0
            }
          }
          
          // Update tenant record if user count has changed and database exists
          if (databaseExists && tenant.userCount !== actualUserCount) {
            await db
              .update(tenants)
              .set({ 
                userCount: actualUserCount,
                updatedAt: new Date()
              })
              .where(eq(tenants.id, tenant.id))
            
            console.log(`   ✅ Updated tenant user count`)
          }
          
          // Check if subscription exists for this tenant
          const existingSubscription = await db
            .select()
            .from(tenantSubscriptions)
            .where(eq(tenantSubscriptions.tenantId, tenant.id))
            .limit(1)
          
          if (existingSubscription.length === 0) {
            // Create missing subscription
            console.log(`   🚀 Creating missing subscription for ${tenant.name}`)
            
            // Get default plan (first active plan)
            const defaultPlan = await db
              .select()
              .from(pricingPlans)
              .where(eq(pricingPlans.isActive, true))
              .orderBy(pricingPlans.displayOrder)
              .limit(1)
            
            if (defaultPlan.length > 0) {
              const plan = defaultPlan[0]
              const trialEndsAt = new Date()
              trialEndsAt.setDate(trialEndsAt.getDate() + (plan.trialDays || 7))
              
              await db
                .insert(tenantSubscriptions)
                .values({
                  tenantId: tenant.id,
                  planId: plan.id,
                  status: databaseExists ? 'trial' : 'inactive', // Mark as inactive if database doesn't exist
                  userCount: actualUserCount,
                  pricePerUser: plan.pricePerUserPerMonth,
                  totalMonthlyPrice: actualUserCount * plan.pricePerUserPerMonth,
                  billingCycle: 'monthly',
                  trialEndsAt,
                  nextBillingDate: trialEndsAt,
                })
              
              createdSubscriptions++
              console.log(`   ✅ Created subscription (${plan.name} plan${!databaseExists ? ' - marked as inactive due to missing database' : ''})`)
            } else {
              console.log(`   ⚠️  No active plans found, skipping subscription creation`)
            }
          } else {
            // Update existing subscription if user count changed and database exists
            const subscription = existingSubscription[0]
            if (databaseExists && subscription.userCount !== actualUserCount) {
              const newTotal = actualUserCount * subscription.pricePerUser
              
              await db
                .update(tenantSubscriptions)
                .set({
                  userCount: actualUserCount,
                  totalMonthlyPrice: newTotal,
                  updatedAt: new Date()
                })
                .where(eq(tenantSubscriptions.id, subscription.id))
              
              syncedCount++
              console.log(`   ✅ Updated subscription billing: $${subscription.totalMonthlyPrice} → $${newTotal}`)
            } else if (!databaseExists) {
              // Mark subscription as inactive if database doesn't exist
              console.log(`   ⚠️  Database missing - marking subscription as inactive`)
              
              await db
                .update(tenantSubscriptions)
                .set({
                  status: 'inactive',
                  updatedAt: new Date()
                })
                .where(eq(tenantSubscriptions.id, subscription.id))
              
              // Also mark tenant as inactive
              await db
                .update(tenants)
                .set({
                  isActive: false,
                  updatedAt: new Date()
                })
                .where(eq(tenants.id, tenant.id))
              
              console.log(`   ✅ Marked tenant and subscription as inactive due to missing database`)
              syncedCount++
            }
          }
          
        } catch (tenantError) {
          console.error(`❌ Error syncing tenant ${tenant.name}:`, tenantError)
          errors++
          // Continue with other tenants
        }
      }
      
      const message = [
        syncedCount > 0 ? `${syncedCount} subscriptions updated` : null,
        createdSubscriptions > 0 ? `${createdSubscriptions} subscriptions created` : null,
        errors > 0 ? `${errors} errors` : null
      ].filter(Boolean).join(', ')
      
      console.log(`✅ Sync complete: ${message}`)
      
      return c.json({ 
        success: true, 
        synced: syncedCount,
        created: createdSubscriptions,
        errors,
        message: message || 'No changes needed'
      })
    } catch (error) {
      console.error('❌ Sync subscriptions error:', error)
      return c.json({ error: 'Failed to sync subscription data' }, 500)
    }
  })

  // Calculate pricing for a given plan and user count
  .post('/calculate', async c => {
    try {
      const { planId, userCount, discountCode, billingCycle } = await c.req.json()

      // Get plan details
      const [plan] = await createCoreConnection()
        .select()
        .from(pricingPlans)
        .where(and(eq(pricingPlans.id, planId), eq(pricingPlans.isActive, true)))

      if (!plan) {
        return c.json({ error: 'Plan not found' }, 404)
      }

      // Check user count limits
      if (plan.minUsers && userCount < plan.minUsers) {
        return c.json({ error: `Minimum ${plan.minUsers} users required` }, 400)
      }
      if (plan.maxUsers && userCount > plan.maxUsers) {
        return c.json({ error: `Maximum ${plan.maxUsers} users allowed` }, 400)
      }

      let basePrice = plan.pricePerUserPerMonth * userCount
      let discountPercent = 0
      let discountAmount = 0
      let appliedDiscount = null

      // Apply yearly discount
      if (billingCycle === 'yearly') {
        discountPercent = 15 // 15% discount for yearly billing
        discountAmount = Math.round(basePrice * 12 * 0.15)
        basePrice = Math.round(basePrice * 12 * 0.85)
      }

      // Check for promo code discount
      if (discountCode) {
        const now = new Date()
        const [discount] = await createCoreConnection()
          .select()
          .from(pricingDiscounts)
          .where(
            and(
              eq(pricingDiscounts.planId, planId),
              eq(pricingDiscounts.promoCode, discountCode),
              eq(pricingDiscounts.isActive, true),
              lte(pricingDiscounts.startDate, now),
              gte(pricingDiscounts.endDate, now)
            )
          )

        if (discount) {
          const promoDiscountAmount = Math.round((basePrice * discount.discountPercent) / 100)
          if (promoDiscountAmount > discountAmount) {
            discountPercent = discount.discountPercent
            discountAmount = promoDiscountAmount
            basePrice = basePrice - promoDiscountAmount
            appliedDiscount = discount
          }
        }
      }

      const finalPrice = billingCycle === 'yearly' ? basePrice : basePrice
      const periodicPrice = billingCycle === 'yearly' ? finalPrice / 12 : finalPrice

      return c.json({
        planId,
        planName: plan.name,
        userCount,
        billingCycle,
        pricePerUser: plan.pricePerUserPerMonth,
        basePrice: plan.pricePerUserPerMonth * userCount,
        discountPercent,
        discountAmount,
        finalPrice,
        periodicPrice: Math.round(periodicPrice * 100) / 100,
        appliedDiscount,
        trialDays: plan.trialDays,
      })
    } catch (_error) {
      return c.json({ error: 'Failed to calculate pricing' }, 500)
    }
  })
