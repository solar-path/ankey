#!/usr/bin/env bun

import { createCoreConnection } from '../src/api/database.settings'
import {
  coreRoles,
  corePermissions,
  coreRolePermissions,
  coreUserRoles,
} from '../src/api/db/schemas/core.drizzle'

const db = createCoreConnection()

console.log('🔧 Seeding Core RBAC System...')

async function seedCoreRBAC() {
  try {
    console.log('📋 Creating core permissions...')

    // Define core permissions
    const permissions = [
      { name: 'users.create', resource: 'users', action: 'create', description: 'Create new user' },
      { name: 'users.read', resource: 'users', action: 'read', description: 'View users' },
      { name: 'users.update', resource: 'users', action: 'update', description: 'Update user' },
      { name: 'users.delete', resource: 'users', action: 'delete', description: 'Delete user' },
      {
        name: 'tenants.create',
        resource: 'tenants',
        action: 'create',
        description: 'Create new tenant',
      },
      { name: 'tenants.read', resource: 'tenants', action: 'read', description: 'View tenants' },
      {
        name: 'tenants.update',
        resource: 'tenants',
        action: 'update',
        description: 'Update tenant',
      },
      {
        name: 'tenants.delete',
        resource: 'tenants',
        action: 'delete',
        description: 'Delete tenant',
      },
      { name: 'roles.create', resource: 'roles', action: 'create', description: 'Create new role' },
      { name: 'roles.read', resource: 'roles', action: 'read', description: 'View roles' },
      { name: 'roles.update', resource: 'roles', action: 'update', description: 'Update role' },
      { name: 'roles.delete', resource: 'roles', action: 'delete', description: 'Delete role' },
      {
        name: 'permissions.create',
        resource: 'permissions',
        action: 'create',
        description: 'Create permission',
      },
      {
        name: 'permissions.read',
        resource: 'permissions',
        action: 'read',
        description: 'View permissions',
      },
      {
        name: 'permissions.update',
        resource: 'permissions',
        action: 'update',
        description: 'Update permission',
      },
      {
        name: 'permissions.delete',
        resource: 'permissions',
        action: 'delete',
        description: 'Delete permission',
      },
      {
        name: 'permissions.sync',
        resource: 'permissions',
        action: 'sync',
        description: 'Sync permissions',
      },
      {
        name: 'settings.read',
        resource: 'settings',
        action: 'read',
        description: 'View system settings',
      },
      {
        name: 'settings.update',
        resource: 'settings',
        action: 'update',
        description: 'Update system settings',
      },
      {
        name: 'pricing.read',
        resource: 'pricing',
        action: 'read',
        description: 'View pricing plans',
      },
      {
        name: 'pricing.update',
        resource: 'pricing',
        action: 'update',
        description: 'Update pricing plans',
      },
      { name: 'audit.read', resource: 'audit', action: 'read', description: 'View audit logs' },
      { name: 'export.create', resource: 'export', action: 'create', description: 'Export data' },
      { name: 'import.create', resource: 'import', action: 'create', description: 'Import data' },
    ]

    // Insert permissions
    const insertedPermissions = await db.insert(corePermissions).values(permissions).returning()
    console.log(`✅ Created ${insertedPermissions.length} permissions`)

    // Create core roles
    console.log('👑 Creating core roles...')

    const roles = [
      {
        name: 'Super Admin',
        description: 'Full system access - all permissions',
        isSystem: true,
      },
      {
        name: 'Admin',
        description: 'Administrative access to most system features',
        isSystem: true,
      },
      {
        name: 'Tenant Manager',
        description: 'Manage tenants and their settings',
        isSystem: true,
      },
      {
        name: 'Auditor',
        description: 'Read-only access to audit logs and reports',
        isSystem: true,
      },
    ]

    const insertedRoles = await db.insert(coreRoles).values(roles).returning()
    console.log(`✅ Created ${insertedRoles.length} roles`)

    // Assign permissions to roles
    console.log('🔗 Assigning permissions to roles...')

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
      'users.read',
      'users.create',
      'users.update',
      'tenants.read',
      'tenants.create',
      'tenants.update',
      'roles.read',
      'permissions.read',
      'settings.read',
      'settings.update',
      'pricing.read',
      'pricing.update',
      'audit.read',
      'export.create',
      'import.create',
    ]
    const adminPermissions = insertedPermissions
      .filter(p => adminPermissionNames.includes(p.name))
      .map(p => ({
        roleId: adminRole.id,
        permissionId: p.id,
      }))

    // Tenant Manager gets tenant-related permissions
    const tenantManagerPermissionNames = [
      'tenants.read',
      'tenants.create',
      'tenants.update',
      'users.read',
      'settings.read',
      'audit.read',
      'export.create',
    ]
    const tenantManagerPermissions = insertedPermissions
      .filter(p => tenantManagerPermissionNames.includes(p.name))
      .map(p => ({
        roleId: tenantManagerRole.id,
        permissionId: p.id,
      }))

    // Auditor gets read-only permissions
    const auditorPermissionNames = [
      'users.read',
      'tenants.read',
      'roles.read',
      'permissions.read',
      'settings.read',
      'pricing.read',
      'audit.read',
      'export.create',
    ]
    const auditorPermissions = insertedPermissions
      .filter(p => auditorPermissionNames.includes(p.name))
      .map(p => ({
        roleId: auditorRole.id,
        permissionId: p.id,
      }))

    // Insert all role-permission assignments
    const allRolePermissions = [
      ...superAdminPermissions,
      ...adminPermissions,
      ...tenantManagerPermissions,
      ...auditorPermissions,
    ]

    await db.insert(coreRolePermissions).values(allRolePermissions)
    console.log(`✅ Assigned permissions to roles`)

    // Assign Super Admin role to the first core user (if exists)
    console.log('👤 Looking for first core user to assign Super Admin role...')

    const firstUser = await db.query.coreUsers.findFirst()
    if (firstUser) {
      await db.insert(coreUserRoles).values({
        userId: firstUser.id,
        roleId: superAdminRole.id,
        assignedBy: firstUser.id, // Self-assigned for initial setup
      })
      console.log(`✅ Assigned Super Admin role to user: ${firstUser.email}`)
    } else {
      console.log('⚠️  No core users found - Super Admin role will need to be assigned manually')
    }

    console.log('🎉 Core RBAC system seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding core RBAC:', error)
    throw error
  }
}

// Run the seeding
seedCoreRBAC()
  .then(() => {
    console.log('✨ Core RBAC seeding completed!')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Core RBAC seeding failed:', error)
    process.exit(1)
  })
