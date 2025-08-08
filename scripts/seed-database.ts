#!/usr/bin/env tsx

import { config } from 'dotenv'
import { eq } from 'drizzle-orm'
import { createCoreConnection } from '../src/api/database.settings'
import * as coreSchema from '../src/api/db/schemas/core.drizzle'
import { TenantService } from '../src/api/tenant.settings'

// Load environment variables from .env file
config()

async function seedDatabase() {
  console.log('🌱 Starting database seeding...')

  try {
    const tenantService = new TenantService()
    const db = createCoreConnection()

    // 1. Create core admin user
    console.log('👤 Creating core admin user...')
    const adminResult = await tenantService.createCoreAdmin({
      email: 'itgroup.luck@gmail.com',
      password: 'M1r@nd@32',
      fullName: 'Core Administrator',
    })

    if (adminResult.success) {
      console.log('✅ Core admin user created successfully!')
    } else if (adminResult.error?.includes('already exists')) {
      console.log('ℹ️  Core admin user already exists, skipping...')
    } else {
      console.error('❌ Failed to create core admin:', adminResult.error)
      process.exit(1)
    }

    // 2. Create reserved tenant databases if they don't exist
    console.log('🏢 Setting up reserved tenant workspaces...')
    const reservedTenants = [
      { name: 'Shop Portal', subdomain: 'shop', email: 'shop@ankey.com' },
      { name: 'Hunt Portal', subdomain: 'hunt', email: 'hunt@ankey.com' },
      { name: 'Education Portal', subdomain: 'edu', email: 'edu@ankey.com' },
      { name: 'Swap Portal', subdomain: 'swap', email: 'swap@ankey.com' },
    ]

    for (const tenant of reservedTenants) {
      try {
        const existing = await db
          .select()
          .from(coreSchema.tenants)
          .where(eq(coreSchema.tenants.subdomain, tenant.subdomain))
          .limit(1)

        if (existing.length === 0) {
          await db.insert(coreSchema.tenants).values({
            name: tenant.name,
            subdomain: tenant.subdomain,
            database: `ankey_${tenant.subdomain}`,
            billingEmail: tenant.email,
            isActive: true,
            userCount: 0,
            monthlyRate: 0, // Free for reserved tenants
          })
          console.log(`   ✅ Created reserved tenant: ${tenant.name}`)
        } else {
          console.log(`   ℹ️  Reserved tenant already exists: ${tenant.name}`)
        }
      } catch (error) {
        console.log(`   ⚠️  Could not create reserved tenant ${tenant.name}:`, error)
      }
    }

    console.log('')
    console.log('🎉 Database seeding completed successfully!')
    console.log('')
    console.log('📋 Summary:')
    console.log('   👤 Core Admin: itgroup.luck@gmail.com / M1r@nd@32')
    console.log('   🏢 Reserved Tenants: shop, hunt, edu, swap')
    console.log('')
    console.log('⚠️  Important: Change the default password after first login!')
  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    process.exit(1)
  }
}

// Run seeding
seedDatabase().catch(console.error)
