import { drizzle } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'
import { pricingPlans, pricingDiscounts } from '../src/api/db/schemas/core.drizzle'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'ali',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'ankey_core',
  })

  await client.connect()

  const db = drizzle(client)

  console.log('Seeding pricing plans...')

  // Insert sample pricing plans
  const plans = await db
    .insert(pricingPlans)
    .values([
      {
        name: 'Starter',
        description: 'Perfect for small teams getting started',
        pricePerUserPerMonth: 25,
        minUsers: 1,
        maxUsers: 10,
        features: JSON.stringify([
          'Up to 10 users',
          'Core business modules',
          'Email support',
          'Basic reporting',
          'Data export (CSV)',
          'Standard integrations',
        ]),
        trialDays: 7,
        trialMaxUsers: 5,
        displayOrder: 1,
        isActive: true,
      },
      {
        name: 'Professional',
        description: 'Advanced features for growing businesses',
        pricePerUserPerMonth: 50,
        minUsers: 5,
        maxUsers: 50,
        features: JSON.stringify([
          'Up to 50 users',
          'All business modules',
          'Priority email & chat support',
          'Advanced reporting & analytics',
          'All export formats',
          'API access',
          'Custom integrations',
          'Role-based access control',
          'Audit logs',
        ]),
        trialDays: 14,
        trialMaxUsers: 10,
        displayOrder: 2,
        badge: 'Most Popular',
        isActive: true,
      },
      {
        name: 'Enterprise',
        description: 'Full-scale solution for large organizations',
        pricePerUserPerMonth: 100,
        minUsers: 25,
        maxUsers: null, // unlimited
        features: JSON.stringify([
          'Unlimited users',
          'All modules + custom development',
          '24/7 dedicated support',
          'Custom analytics & dashboards',
          'White-label options',
          'Advanced security features',
          'Custom SLA',
          'On-premise deployment options',
          'Training & onboarding',
          'Multi-tenant architecture',
        ]),
        trialDays: 30,
        trialMaxUsers: 25,
        displayOrder: 3,
        badge: 'Enterprise',
        isActive: true,
      },
    ])
    .returning()

  console.log(`Created ${plans.length} pricing plans`)

  // Add some sample discounts
  const discounts = await db
    .insert(pricingDiscounts)
    .values([
      {
        planId: plans[1].id, // Professional plan
        name: 'Early Bird Special',
        discountPercent: 20,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-03-31'),
        promoCode: 'EARLY2025',
        minMonths: 6,
        isActive: true,
      },
      {
        planId: plans[0].id, // Starter plan
        name: 'New Year Promotion',
        discountPercent: 15,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-02-28'),
        promoCode: 'NEWYEAR15',
        minMonths: 3,
        isActive: true,
      },
    ])
    .returning()

  console.log(`Created ${discounts.length} discount offers`)

  console.log('Pricing data seeded successfully!')

  await client.end()
}

main().catch(err => {
  console.error('Seeding failed!')
  console.error(err)
  process.exit(1)
})
