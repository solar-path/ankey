#!/usr/bin/env tsx

import { createCoreConnection } from '../src/api/database.settings'
import * as coreSchema from '../src/api/db/schemas/core.drizzle'
import { eq, and } from 'drizzle-orm'

async function backfillSubscriptions() {
  try {
    console.log('Starting subscription backfill...')
    const db = createCoreConnection()

    // Get all tenants that don't have subscriptions
    const tenants = await db
      .select()
      .from(coreSchema.tenants)
      .where(eq(coreSchema.tenants.isActive, true))

    console.log(`Found ${tenants.length} tenants`)

    // Get first active pricing plan or create default
    let plans = await db
      .select()
      .from(coreSchema.pricingPlans)
      .where(eq(coreSchema.pricingPlans.isActive, true))
      .orderBy(coreSchema.pricingPlans.displayOrder)
      .limit(1)

    let defaultPlan = plans[0]

    // If no plans exist, create a default trial plan
    if (!defaultPlan) {
      console.log('No pricing plans found, creating default trial plan...')
      const [newPlan] = await db
        .insert(coreSchema.pricingPlans)
        .values({
          name: 'Trial Plan',
          description: 'Free trial plan for new workspaces',
          pricePerUserPerMonth: 0,
          minUsers: 1,
          maxUsers: 5,
          features: JSON.stringify(['Core features included', 'Email support', 'Basic integrations']),
          trialDays: 7,
          trialMaxUsers: 5,
          isActive: true,
          displayOrder: 0,
        })
        .returning()
      
      defaultPlan = newPlan
      console.log('Created default plan:', defaultPlan.name)
    } else {
      console.log('Using existing plan:', defaultPlan.name)
    }

    // Create subscriptions for tenants that don't have them
    for (const tenant of tenants) {
      // Check if subscription already exists
      const existingSubscription = await db
        .select()
        .from(coreSchema.tenantSubscriptions)
        .where(eq(coreSchema.tenantSubscriptions.tenantId, tenant.id))
        .limit(1)

      if (existingSubscription.length > 0) {
        console.log(`Tenant ${tenant.name} already has a subscription`)
        continue
      }

      // Calculate trial end date
      const trialDays = defaultPlan.trialDays || 7
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)

      // Create subscription record
      await db
        .insert(coreSchema.tenantSubscriptions)
        .values({
          tenantId: tenant.id,
          planId: defaultPlan.id,
          status: 'trial',
          userCount: tenant.userCount || 1,
          pricePerUser: defaultPlan.pricePerUserPerMonth,
          totalMonthlyPrice: 0, // Free during trial
          billingCycle: 'monthly',
          trialEndsAt,
          nextBillingDate: trialEndsAt, // Billing starts after trial ends
        })

      console.log(`Created trial subscription for tenant: ${tenant.name}`)
    }

    console.log('Subscription backfill completed successfully!')
  } catch (error) {
    console.error('Error during backfill:', error)
    process.exit(1)
  }
}

// Run the backfill
backfillSubscriptions()