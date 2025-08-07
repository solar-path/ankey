import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as coreSchema from './db/schemas/core.drizzle';
import * as tenantSchema from './db/schemas/tenant.drizzle';

// Core database connection
export function createCoreConnection() {
  const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  
  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  
  return drizzle(client, { schema: coreSchema });
}

// Tenant database connection
export function createTenantConnection(tenantDatabase: string) {
  const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${tenantDatabase}`;
  
  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  
  return drizzle(client, { schema: tenantSchema });
}

// Create a new tenant database
export async function createTenantDatabase(tenantDatabase: string) {
  const adminConnectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/postgres`;
  const adminClient = postgres(adminConnectionString);
  
  try {
    // Create database
    await adminClient.unsafe(`CREATE DATABASE "${tenantDatabase}"`);
    console.log(`Database ${tenantDatabase} created successfully`);
    
    // Close admin connection
    await adminClient.end();
    
    return true;
  } catch (error: any) {
    console.error(`Failed to create database ${tenantDatabase}:`, error);
    if (error.code !== '42P04') { // Database already exists
      throw error;
    }
    return false;
  }
}

// Run tenant migrations (you'll need to implement this based on your migration strategy)
export async function runTenantMigrations(tenantDatabase: string) {
  // This would typically use drizzle-kit to run migrations
  // For now, we'll create tables directly
  // const db = createTenantConnection(tenantDatabase);
  
  // You would typically run migration files here
  console.log(`Migrations completed for ${tenantDatabase}`);
  return true;
}

// Seed tenant database with default data
export async function seedTenantDatabase(tenantDatabase: string, ownerData: {
  email: string;
  fullName: string;
  passwordHash: string;
}) {
  const db = createTenantConnection(tenantDatabase);
  
  try {
    // Create default roles
    const adminRole = await db.insert(tenantSchema.roles).values({
      name: 'Administrator',
      description: 'Full system access',
      isSystem: true,
    }).returning();

    await db.insert(tenantSchema.roles).values({
      name: 'User',
      description: 'Basic user access',
      isSystem: true,
    });

    // Create owner user
    const owner = await db.insert(tenantSchema.users).values({
      email: ownerData.email,
      fullName: ownerData.fullName,
      passwordHash: ownerData.passwordHash,
      emailVerified: true,
      isApproved: true,
      isActive: true,
    }).returning();

    // Assign admin role to owner
    await db.insert(tenantSchema.userRoles).values({
      userId: owner[0].id,
      roleId: adminRole[0].id,
    });

    console.log(`Tenant database ${tenantDatabase} seeded successfully`);
    return { success: true, ownerId: owner[0].id };
  } catch (error) {
    console.error(`Failed to seed tenant database ${tenantDatabase}:`, error);
    return { success: false, error };
  }
}