import { Hono } from 'hono'
import { createCoreConnection } from '../../database.settings'
import { pricingPlans, pricingDiscounts, tenantSubscriptions } from '../../db/schemas/core.drizzle'
import { eq, desc, and, gte, lte } from 'drizzle-orm'
// import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const pricingRouter = new Hono()

// PRICING PLANS CRUD

// Get all pricing plans
pricingRouter.get('/plans', async c => {
  try {
    // Get database connection
    const plans = await createCoreConnection()
      .select()
      .from(pricingPlans)
      .where(eq(pricingPlans.isActive, true))
      .orderBy(pricingPlans.displayOrder, desc(pricingPlans.createdAt))

    return c.json({ plans })
  } catch (error) {
    return c.json({ error: 'Failed to fetch pricing plans' }, 500)
  }
})

// Get single pricing plan
pricingRouter.get('/plans/:id', async c => {
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
  } catch (error) {
    return c.json({ error: 'Failed to fetch pricing plan' }, 500)
  }
})

// Create pricing plan
pricingRouter.post('/plans', async c => {
  try {
    const planData = await c.req.json()

    const [newPlan] = await createCoreConnection()
      .insert(pricingPlans)
      .values({
        ...planData,
        updatedAt: new Date(),
      })
      .returning()

    return c.json({ plan: newPlan }, 201)
  } catch (error) {
    return c.json({ error: 'Failed to create pricing plan' }, 500)
  }
})

// Update pricing plan
pricingRouter.put('/plans/:id', async c => {
  try {
    const planId = c.req.param('id')
    const updateData = await c.req.json()

    const [updatedPlan] = await createCoreConnection()
      .update(pricingPlans)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(pricingPlans.id, planId))
      .returning()

    if (!updatedPlan) {
      return c.json({ error: 'Pricing plan not found' }, 404)
    }

    return c.json({ plan: updatedPlan })
  } catch (error) {
    return c.json({ error: 'Failed to update pricing plan' }, 500)
  }
})

// Delete pricing plan (soft delete by setting isActive = false)
pricingRouter.delete('/plans/:id', async c => {
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
  } catch (error) {
    return c.json({ error: 'Failed to delete pricing plan' }, 500)
  }
})

// PRICING DISCOUNTS CRUD

// Get all discounts for a plan
pricingRouter.get('/plans/:planId/discounts', async c => {
  try {
    const planId = c.req.param('planId')
    const discounts = await createCoreConnection()
      .select()
      .from(pricingDiscounts)
      .where(and(eq(pricingDiscounts.planId, planId), eq(pricingDiscounts.isActive, true)))
      .orderBy(desc(pricingDiscounts.createdAt))

    return c.json({ discounts })
  } catch (error) {
    return c.json({ error: 'Failed to fetch discounts' }, 500)
  }
})

// Get active discounts for a plan (current date within range)
pricingRouter.get('/plans/:planId/discounts/active', async c => {
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
  } catch (error) {
    return c.json({ error: 'Failed to fetch active discounts' }, 500)
  }
})

// Create discount
pricingRouter.post('/discounts', async c => {
  try {
    const discountData = await c.req.json()

    const [newDiscount] = await createCoreConnection()
      .insert(pricingDiscounts)
      .values(discountData)
      .returning()

    return c.json({ discount: newDiscount }, 201)
  } catch (error) {
    return c.json({ error: 'Failed to create discount' }, 500)
  }
})

// Update discount
pricingRouter.put(
  '/discounts/:id',

  async c => {
    try {
      const discountId = c.req.param('id')
      const updateData = await c.req.json()

      const [updatedDiscount] = await createCoreConnection()
        .update(pricingDiscounts)
        .set(updateData)
        .where(eq(pricingDiscounts.id, discountId))
        .returning()

      if (!updatedDiscount) {
        return c.json({ error: 'Discount not found' }, 404)
      }

      return c.json({ discount: updatedDiscount })
    } catch (error) {
      return c.json({ error: 'Failed to update discount' }, 500)
    }
  }
)

// Delete discount (soft delete)
pricingRouter.delete('/discounts/:id', async c => {
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
  } catch (error) {
    return c.json({ error: 'Failed to delete discount' }, 500)
  }
})

// TENANT SUBSCRIPTIONS CRUD

// Get all subscriptions
pricingRouter.get('/subscriptions', async c => {
  try {
    const subscriptions = await createCoreConnection()
      .select({
        id: tenantSubscriptions.id,
        tenantId: tenantSubscriptions.tenantId,
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
      .orderBy(desc(tenantSubscriptions.createdAt))

    return c.json({ subscriptions })
  } catch (error) {
    return c.json({ error: 'Failed to fetch subscriptions' }, 500)
  }
})

// Get subscription by tenant ID
pricingRouter.get('/subscriptions/tenant/:tenantId', async c => {
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
  } catch (error) {
    return c.json({ error: 'Failed to fetch subscription' }, 500)
  }
})

// Create subscription
pricingRouter.post('/subscriptions', async c => {
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
  } catch (error) {
    return c.json({ error: 'Failed to create subscription' }, 500)
  }
})

// Update subscription
pricingRouter.put('/subscriptions/:id', async c => {
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
  } catch (error) {
    return c.json({ error: 'Failed to update subscription' }, 500)
  }
})

// Cancel subscription
pricingRouter.post('/subscriptions/:id/cancel', async c => {
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
  } catch (error) {
    return c.json({ error: 'Failed to cancel subscription' }, 500)
  }
})

// Calculate pricing for a given plan and user count
pricingRouter.post('/calculate', async c => {
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
  } catch (error) {
    return c.json({ error: 'Failed to calculate pricing' }, 500)
  }
})

export { pricingRouter }
