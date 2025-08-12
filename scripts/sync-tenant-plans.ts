import { createCoreConnection, createTenantConnection } from '../src/api/database.settings'
import { tenants, tenantSubscriptions, pricingPlans } from '../src/api/db/schemas/core.drizzle'
import { tenantSubscription, planLimits } from '../src/api/db/schemas/tenant.drizzle'
import { eq, and, notInArray } from 'drizzle-orm'

async function syncTenantPlans() {
  console.log('🔄 Starting tenant plan synchronization...')

  const coreDb = createCoreConnection()

  // Get all active tenants (excluding services)
  const activeTenants = await coreDb
    .select()
    .from(tenants)
    .where(
      and(
        eq(tenants.isActive, true),
        // Only real tenants, not services
        notInArray(tenants.subdomain, ['shop', 'hunt', 'edu', 'swap'])
      )
    )

  for (const tenant of activeTenants) {
    try {
      console.log(`📊 Syncing plan data for tenant: ${tenant.name} (${tenant.subdomain})`)

      // Get tenant's subscription from core
      const [subscription] = await coreDb
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
          planName: pricingPlans.name,
          planFeatures: pricingPlans.features,
          maxUsers: pricingPlans.maxUsers,
        })
        .from(tenantSubscriptions)
        .leftJoin(pricingPlans, eq(tenantSubscriptions.planId, pricingPlans.id))
        .where(eq(tenantSubscriptions.tenantId, tenant.id))
        .limit(1)

      if (!subscription) {
        console.log(`   ⚠️  No subscription found for tenant ${tenant.name}`)
        continue
      }

      // Connect to tenant database
      const tenantDb = createTenantConnection(tenant.database)

      // Check if tenant subscription record exists
      const [existingTenantSub] = await tenantDb.select().from(tenantSubscription).limit(1)

      const subscriptionData = {
        tenantId: subscription.tenantId,
        planId: subscription.planId,
        planName: subscription.planName || 'Unknown Plan',
        planFeatures:
          typeof subscription.planFeatures === 'string'
            ? JSON.parse(subscription.planFeatures)
            : subscription.planFeatures,
        status: subscription.status,
        userCount: Number(subscription.userCount),
        maxUsers: subscription.maxUsers,
        pricePerUser: subscription.pricePerUser,
        totalMonthlyPrice: subscription.totalMonthlyPrice,
        billingCycle: subscription.billingCycle,
        trialEndsAt: subscription.trialEndsAt,
        nextBillingDate: subscription.nextBillingDate,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      }

      if (existingTenantSub) {
        // Update existing record
        await tenantDb
          .update(tenantSubscription)
          .set(subscriptionData)
          .where(eq(tenantSubscription.id, existingTenantSub.id))

        console.log(`   ✅ Updated existing tenant subscription`)
      } else {
        // Insert new record
        await tenantDb.insert(tenantSubscription).values(subscriptionData)

        console.log(`   ✅ Created new tenant subscription record`)
      }

      // Update or create plan limits
      const limits = [
        {
          limitType: 'users',
          limitValue: subscription.maxUsers,
          currentUsage: Number(subscription.userCount),
        },
        {
          limitType: 'storage',
          limitValue: null, // Unlimited for now
          currentUsage: 0,
        },
        {
          limitType: 'api_requests',
          limitValue: null, // Unlimited for now
          currentUsage: 0,
        },
      ]

      for (const limit of limits) {
        const [existingLimit] = await tenantDb
          .select()
          .from(planLimits)
          .where(eq(planLimits.limitType, limit.limitType))
          .limit(1)

        const limitData = {
          ...limit,
          isExceeded: limit.limitValue ? limit.currentUsage > limit.limitValue : false,
          lastChecked: new Date(),
          updatedAt: new Date(),
        }

        if (existingLimit) {
          await tenantDb
            .update(planLimits)
            .set(limitData)
            .where(eq(planLimits.id, existingLimit.id))
        } else {
          await tenantDb.insert(planLimits).values(limitData)
        }
      }

      console.log(`   ✅ Synced plan limits for ${tenant.name}`)
    } catch (error: any) {
      console.error(`❌ Failed to sync plan data for tenant ${tenant.name}:`, error.message)
    }
  }

  console.log('✅ Tenant plan synchronization completed')
}

// Run sync
syncTenantPlans().catch(console.error)
