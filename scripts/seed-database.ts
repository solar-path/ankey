#!/usr/bin/env tsx

import { TenantService } from '../src/api/tenant.settings';
import { RBACService } from '../src/api/rbac.settings';
import { createCoreConnection } from '../src/api/database.settings';
import * as coreSchema from '../src/api/db/schemas/core.drizzle';
import { eq, and } from 'drizzle-orm';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    const tenantService = new TenantService();
    const db = createCoreConnection();
    
    // 1. Create core admin user
    console.log('👤 Creating core admin user...');
    const adminResult = await tenantService.createCoreAdmin({
      email: 'itgroup.luck@gmail.com',
      password: 'Mir@nd@32',
      fullName: 'Core Administrator',
    });

    if (adminResult.success) {
      console.log('✅ Core admin user created successfully!');
    } else if (adminResult.error?.includes('already exists')) {
      console.log('ℹ️  Core admin user already exists, skipping...');
    } else {
      console.error('❌ Failed to create core admin:', adminResult.error);
      process.exit(1);
    }

    // 2. Create default core permissions for tenant management
    console.log('🔐 Creating core permissions...');
    
    const corePermissions = [
      { resource: 'tenants', action: 'create', description: 'Create new tenants' },
      { resource: 'tenants', action: 'read', description: 'View tenants' },
      { resource: 'tenants', action: 'update', description: 'Update tenant details' },
      { resource: 'tenants', action: 'delete', description: 'Delete tenants' },
      { resource: 'tenants', action: 'billing', description: 'View tenant billing' },
      { resource: 'core', action: 'admin', description: 'Core administration access' },
    ];

    for (const perm of corePermissions) {
      try {
        // Check if permission exists
        const existing = await db.query.corePermissions.findFirst({
          where: eq(coreSchema.corePermissions.name, `${perm.resource}:${perm.action}`),
        });

        if (!existing) {
          await db.insert(coreSchema.corePermissions).values({
            name: `${perm.resource}:${perm.action}`,
            resource: perm.resource,
            action: perm.action,
            description: perm.description,
          });
          console.log(`   ✅ Created permission: ${perm.resource}:${perm.action}`);
        } else {
          console.log(`   ℹ️  Permission already exists: ${perm.resource}:${perm.action}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not create permission ${perm.resource}:${perm.action}:`, error);
      }
    }

    // 3. Create super admin role
    console.log('👑 Creating super admin role...');
    try {
      const existingRole = await db.query.coreRoles.findFirst({
        where: eq(coreSchema.coreRoles.name, 'Super Admin'),
      });

      let superAdminRoleId: string;
      
      if (!existingRole) {
        const [role] = await db.insert(coreSchema.coreRoles).values({
          name: 'Super Admin',
          description: 'Full system administration access',
        }).returning();
        superAdminRoleId = role.id;
        console.log('   ✅ Super Admin role created');
      } else {
        superAdminRoleId = existingRole.id;
        console.log('   ℹ️  Super Admin role already exists');
      }

      // 4. Assign all permissions to super admin role
      console.log('🔗 Assigning permissions to Super Admin role...');
      const allPermissions = await db.query.corePermissions.findMany();
      
      for (const permission of allPermissions) {
        try {
          // Check if role-permission exists
          const existing = await db.query.coreRolePermissions.findFirst({
            where: and(
              eq(coreSchema.coreRolePermissions.roleId, superAdminRoleId),
              eq(coreSchema.coreRolePermissions.permissionId, permission.id)
            ),
          });

          if (!existing) {
            await db.insert(coreSchema.coreRolePermissions).values({
              roleId: superAdminRoleId,
              permissionId: permission.id,
            });
            console.log(`   ✅ Assigned permission: ${permission.name}`);
          }
        } catch (error) {
          console.log(`   ⚠️  Could not assign permission ${permission.name}:`, error);
        }
      }

      // 5. Assign super admin role to core admin user
      console.log('👤 Assigning Super Admin role to core admin...');
      const coreAdmin = await db.query.coreUsers.findFirst({
        where: eq(coreSchema.coreUsers.email, 'itgroup.luck@gmail.com'),
      });

      if (coreAdmin) {
        try {
          const existingUserRole = await db.query.coreUserRoles.findFirst({
            where: and(
              eq(coreSchema.coreUserRoles.userId, coreAdmin.id),
              eq(coreSchema.coreUserRoles.roleId, superAdminRoleId)
            ),
          });

          if (!existingUserRole) {
            await db.insert(coreSchema.coreUserRoles).values({
              userId: coreAdmin.id,
              roleId: superAdminRoleId,
            });
            console.log('   ✅ Super Admin role assigned to core admin');
          } else {
            console.log('   ℹ️  Super Admin role already assigned to core admin');
          }
        } catch (error) {
          console.log('   ⚠️  Could not assign role to core admin:', error);
        }
      }

    } catch (error) {
      console.error('❌ Error creating super admin role:', error);
    }

    // 6. Create reserved tenant databases if they don't exist
    console.log('🏢 Setting up reserved tenant workspaces...');
    const reservedTenants = [
      { name: 'Shop Portal', subdomain: 'shop', email: 'shop@ankey.com' },
      { name: 'Hunt Portal', subdomain: 'hunt', email: 'hunt@ankey.com' },
      { name: 'Education Portal', subdomain: 'edu', email: 'edu@ankey.com' },
      { name: 'Swap Portal', subdomain: 'swap', email: 'swap@ankey.com' },
    ];

    for (const tenant of reservedTenants) {
      try {
        const existing = await db.query.tenants.findFirst({
          where: eq(coreSchema.tenants.subdomain, tenant.subdomain),
        });

        if (!existing) {
          await db.insert(coreSchema.tenants).values({
            name: tenant.name,
            subdomain: tenant.subdomain,
            database: `ankey_${tenant.subdomain}`,
            billingEmail: tenant.email,
            isActive: true,
            userCount: 0,
            monthlyRate: 0, // Free for reserved tenants
          });
          console.log(`   ✅ Created reserved tenant: ${tenant.name}`);
        } else {
          console.log(`   ℹ️  Reserved tenant already exists: ${tenant.name}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not create reserved tenant ${tenant.name}:`, error);
      }
    }

    console.log('');
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   👤 Core Admin: itgroup.luck@gmail.com / Mir@nd@32');
    console.log('   🔐 Permissions: Core management permissions created');
    console.log('   👑 Roles: Super Admin role with full access');
    console.log('   🏢 Reserved Tenants: shop, hunt, edu, swap');
    console.log('');
    console.log('⚠️  Important: Change the default password after first login!');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase().catch(console.error);