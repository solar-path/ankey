#!/usr/bin/env bun

import { config } from 'dotenv'
import { eq } from 'drizzle-orm'
import { createCoreConnection } from '../src/api/database.settings'
import * as coreSchema from '../src/api/db/schemas/core.drizzle'
import { TenantService } from '../src/api/tenant.settings'

// Load environment variables from .env file
config()

async function seedCore() {
  console.log('🌱 Starting comprehensive core database seeding...')
  console.log('   This will seed: Admin user, Reserved tenants, Pricing plans, RBAC system\n')

  try {
    const tenantService = new TenantService()
    const db = createCoreConnection()

    // ========================================
    // 1. CREATE CORE ADMIN USER
    // ========================================
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

    // ========================================
    // 2. CREATE RESERVED TENANT WORKSPACES
    // ========================================
    console.log('\n🏢 Setting up reserved tenant workspaces...')
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

    // ========================================
    // 3. SEED PRICING PLANS
    // ========================================
    console.log('\n💰 Seeding pricing plans...')

    // Check if pricing plans already exist
    const existingPlans = await db.select().from(coreSchema.pricingPlans).limit(1)

    if (existingPlans.length === 0) {
      // Insert sample pricing plans
      const plans = await db
        .insert(coreSchema.pricingPlans)
        .values([
          {
            name: 'Micro',
            description: 'Just starting out, full of vision and ideas, building the foundation. Number of employees 1 to 5 full-time. Revenues 0 to 3 Million SR',
            pricePerUserPerMonth: 25,
            minUsers: 1,
            maxUsers: 5,
            features: JSON.stringify([
              '1 to 5 users',
              'Core business modules',
              'Email support',
              'Basic reporting',
              'Data export (CSV)',
              'Standard integrations',
            ]),
            trialDays: 7,
            trialMaxUsers: 3,
            displayOrder: 1,
            badge: 'Dreamers',
            isActive: true,
          },
          {
            name: 'Small',
            description: 'Actively making things happen, turning ideas into reality. Number of employees 6 to 49 full-time. Revenues 3 to 40 Million SR',
            pricePerUserPerMonth: 50,
            minUsers: 6,
            maxUsers: 49,
            features: JSON.stringify([
              '6 to 49 users',
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
            trialMaxUsers: 15,
            displayOrder: 2,
            badge: 'Doers',
            isActive: true,
          },
          {
            name: 'Medium',
            description: 'Expanding operations, building teams, systems, and sustainable growth. Number of employees 50 to 249 full-time. Revenues 40 to 200 Million SR',
            pricePerUserPerMonth: 75,
            minUsers: 50,
            maxUsers: 249,
            features: JSON.stringify([
              '50 to 249 users',
              'All modules + custom integrations',
              '24/7 priority support',
              'Advanced analytics & dashboards',
              'White-label options',
              'Advanced security features',
              'Custom workflows',
              'API access with higher limits',
              'Training & onboarding support',
            ]),
            trialDays: 21,
            trialMaxUsers: 50,
            displayOrder: 3,
            badge: 'Builders',
            isActive: true,
          },
          {
            name: 'Large',
            description: 'Industry influencers, setting trends, shaping the market. Number of employees 250 or more full-time. Revenues more than 200 Million SR',
            pricePerUserPerMonth: 100,
            minUsers: 250,
            maxUsers: null, // unlimited
            features: JSON.stringify([
              'Unlimited users',
              'All modules + custom development',
              '24/7 dedicated support team',
              'Custom analytics & dashboards',
              'Full white-label options',
              'Enterprise security features',
              'Custom SLA agreements',
              'On-premise deployment options',
              'Dedicated account manager',
              'Multi-tenant architecture',
            ]),
            trialDays: 30,
            trialMaxUsers: 100,
            displayOrder: 4,
            badge: 'Leaders',
            isActive: true,
          },
        ])
        .returning()

      console.log(`   ✅ Created ${plans.length} pricing plans`)

      // Add some sample discounts
      const discounts = await db
        .insert(coreSchema.pricingDiscounts)
        .values([
          {
            planId: plans[1].id, // Small plan
            name: 'Early Bird Special',
            discountPercent: 20,
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-03-31'),
            promoCode: 'EARLY2025',
            minMonths: 6,
            isActive: true,
          },
          {
            planId: plans[0].id, // Micro plan
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

      console.log(`   ✅ Created ${discounts.length} discount offers`)
    } else {
      console.log('   ℹ️  Pricing plans already exist, skipping...')
    }

    // ========================================
    // 4. SEED RBAC SYSTEM
    // ========================================
    console.log('\n🔧 Seeding Core RBAC System...')

    // Check if permissions already exist
    const existingPermissions = await db.select().from(coreSchema.corePermissions).limit(1)

    if (existingPermissions.length === 0) {
      console.log('   📋 Creating core permissions...')

      // Define core permissions
      const permissions = [
        { name: 'users.create', resource: 'users', action: 'create', description: 'Create new user' },
        { name: 'users.read', resource: 'users', action: 'read', description: 'View users' },
        { name: 'users.update', resource: 'users', action: 'update', description: 'Update user' },
        { name: 'users.delete', resource: 'users', action: 'delete', description: 'Delete user' },
        { name: 'tenants.create', resource: 'tenants', action: 'create', description: 'Create new tenant' },
        { name: 'tenants.read', resource: 'tenants', action: 'read', description: 'View tenants' },
        { name: 'tenants.update', resource: 'tenants', action: 'update', description: 'Update tenant' },
        { name: 'tenants.delete', resource: 'tenants', action: 'delete', description: 'Delete tenant' },
        { name: 'roles.create', resource: 'roles', action: 'create', description: 'Create new role' },
        { name: 'roles.read', resource: 'roles', action: 'read', description: 'View roles' },
        { name: 'roles.update', resource: 'roles', action: 'update', description: 'Update role' },
        { name: 'roles.delete', resource: 'roles', action: 'delete', description: 'Delete role' },
        { name: 'permissions.create', resource: 'permissions', action: 'create', description: 'Create permission' },
        { name: 'permissions.read', resource: 'permissions', action: 'read', description: 'View permissions' },
        { name: 'permissions.update', resource: 'permissions', action: 'update', description: 'Update permission' },
        { name: 'permissions.delete', resource: 'permissions', action: 'delete', description: 'Delete permission' },
        { name: 'permissions.sync', resource: 'permissions', action: 'sync', description: 'Sync permissions' },
        { name: 'settings.read', resource: 'settings', action: 'read', description: 'View system settings' },
        { name: 'settings.update', resource: 'settings', action: 'update', description: 'Update system settings' },
        { name: 'pricing.read', resource: 'pricing', action: 'read', description: 'View pricing plans' },
        { name: 'pricing.update', resource: 'pricing', action: 'update', description: 'Update pricing plans' },
        { name: 'audit.read', resource: 'audit', action: 'read', description: 'View audit logs' },
        { name: 'export.create', resource: 'export', action: 'create', description: 'Export data' },
        { name: 'import.create', resource: 'import', action: 'create', description: 'Import data' },
      ]

      // Insert permissions
      const insertedPermissions = await db.insert(coreSchema.corePermissions).values(permissions).returning()
      console.log(`   ✅ Created ${insertedPermissions.length} permissions`)

      // Create core roles
      console.log('   👑 Creating core roles...')

      const roles = [
        { name: 'Super Admin', description: 'Full system access - all permissions', isSystem: true },
        { name: 'Admin', description: 'Administrative access to most system features', isSystem: true },
        { name: 'Tenant Manager', description: 'Manage tenants and their settings', isSystem: true },
        { name: 'Auditor', description: 'Read-only access to audit logs and reports', isSystem: true },
      ]

      const insertedRoles = await db.insert(coreSchema.coreRoles).values(roles).returning()
      console.log(`   ✅ Created ${insertedRoles.length} roles`)

      // Assign permissions to roles
      console.log('   🔗 Assigning permissions to roles...')

      const superAdminRole = insertedRoles.find(r => r.name === 'Super Admin')!
      const adminRole = insertedRoles.find(r => r.name === 'Admin')!
      const tenantManagerRole = insertedRoles.find(r => r.name === 'Tenant Manager')!
      const auditorRole = insertedRoles.find(r => r.name === 'Auditor')!

      // Super Admin gets all permissions
      const superAdminPermissions = insertedPermissions.map(p => ({
        roleId: superAdminRole.id,
        permissionId: p.id,
      }))

      // Admin gets most permissions except critical system ones
      const adminPermissionNames = [
        'users.read', 'users.create', 'users.update',
        'tenants.read', 'tenants.create', 'tenants.update',
        'roles.read', 'permissions.read',
        'settings.read', 'settings.update',
        'pricing.read', 'pricing.update',
        'audit.read', 'export.create', 'import.create',
      ]
      const adminPermissions = insertedPermissions
        .filter(p => adminPermissionNames.includes(p.name))
        .map(p => ({ roleId: adminRole.id, permissionId: p.id }))

      // Tenant Manager gets tenant-related permissions
      const tenantManagerPermissionNames = [
        'tenants.read', 'tenants.create', 'tenants.update',
        'users.read', 'settings.read', 'audit.read', 'export.create',
      ]
      const tenantManagerPermissions = insertedPermissions
        .filter(p => tenantManagerPermissionNames.includes(p.name))
        .map(p => ({ roleId: tenantManagerRole.id, permissionId: p.id }))

      // Auditor gets read-only permissions
      const auditorPermissionNames = [
        'users.read', 'tenants.read', 'roles.read', 'permissions.read',
        'settings.read', 'pricing.read', 'audit.read', 'export.create',
      ]
      const auditorPermissions = insertedPermissions
        .filter(p => auditorPermissionNames.includes(p.name))
        .map(p => ({ roleId: auditorRole.id, permissionId: p.id }))

      // Insert all role-permission assignments
      const allRolePermissions = [
        ...superAdminPermissions,
        ...adminPermissions,
        ...tenantManagerPermissions,
        ...auditorPermissions,
      ]

      await db.insert(coreSchema.coreRolePermissions).values(allRolePermissions)
      console.log(`   ✅ Assigned permissions to roles`)

      // Assign Super Admin role to the first core user (if exists)
      console.log('   👤 Looking for core admin user to assign Super Admin role...')

      const firstUser = await db
        .select()
        .from(coreSchema.coreUsers)
        .limit(1)

      if (firstUser.length > 0) {
        // Check if user already has the role
        const existingUserRole = await db
          .select()
          .from(coreSchema.coreUserRoles)
          .where(eq(coreSchema.coreUserRoles.userId, firstUser[0].id))
          .limit(1)

        if (existingUserRole.length === 0) {
          await db.insert(coreSchema.coreUserRoles).values({
            userId: firstUser[0].id,
            roleId: superAdminRole.id,
            assignedBy: firstUser[0].id, // Self-assigned for initial setup
          })
          console.log(`   ✅ Assigned Super Admin role to user: ${firstUser[0].email}`)
        } else {
          console.log(`   ℹ️  User ${firstUser[0].email} already has a role assigned`)
        }
      } else {
        console.log('   ⚠️  No core users found - Super Admin role will need to be assigned manually')
      }
    } else {
      console.log('   ℹ️  RBAC system already exists, skipping...')
    }

    // ========================================
    // COMPLETION SUMMARY
    // ========================================
    console.log('\n🎉 Core database seeding completed successfully!')
    console.log('\n📋 Summary:')
    console.log('   👤 Core Admin: itgroup.luck@gmail.com / M1r@nd@32')
    console.log('   🏢 Reserved Tenants: shop, hunt, edu, swap')
    console.log('   💰 Pricing Plans: Micro (Dreamers), Small (Doers), Medium (Builders), Large (Leaders)')
    console.log('   🔧 RBAC Roles: Super Admin, Admin, Tenant Manager, Auditor')
    console.log('   🔐 Permissions: 24 core permissions assigned')
    console.log('')
    console.log('⚠️  Important: Change the default password after first login!')
    console.log('🚀 Your core system is ready to use!')

  } catch (error) {
    console.error('\n❌ Core database seeding failed:', error)
    process.exit(1)
  }
}

// Run comprehensive core seeding
seedCore().catch(console.error)
