import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { createCoreConnection, createTenantConnection } from './db/connection';
import * as coreSchema from './db/schemas/core';
import * as tenantSchema from './db/schemas/tenant';

// Core authentication for admin users
export function createCoreAuth() {
  const db = createCoreConnection();
  
  const adapter = new DrizzlePostgreSQLAdapter(
    db,
    coreSchema.coreSessions,
    coreSchema.coreUsers
  );

  return new Lucia(adapter, {
    sessionCookie: {
      attributes: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? '.ankey.com' : 'localhost',
      },
    },
    getUserAttributes: (attributes) => {
      return {
        id: attributes.id,
        email: attributes.email,
        fullName: attributes.fullName,
        isActive: attributes.isActive,
        emailVerified: attributes.emailVerified,
        twoFactorEnabled: attributes.twoFactorEnabled,
      };
    },
  });
}

// Tenant authentication for workspace users
export function createTenantAuth(tenantDatabase: string) {
  const db = createTenantConnection(tenantDatabase);
  
  const adapter = new DrizzlePostgreSQLAdapter(
    db,
    tenantSchema.sessions,
    tenantSchema.users
  );

  return new Lucia(adapter, {
    sessionCookie: {
      attributes: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    },
    getUserAttributes: (attributes) => {
      return {
        id: attributes.id,
        email: attributes.email,
        fullName: attributes.fullName,
        isActive: attributes.isActive,
        emailVerified: attributes.emailVerified,
        twoFactorEnabled: attributes.twoFactorEnabled,
        isApproved: attributes.isApproved,
      };
    },
  });
}

// Type declarations for Lucia
declare module 'lucia' {
  interface Register {
    Lucia: ReturnType<typeof createCoreAuth> | ReturnType<typeof createTenantAuth>;
    DatabaseUserAttributes: {
      id: string;
      email: string;
      fullName: string;
      isActive: boolean;
      emailVerified: boolean;
      twoFactorEnabled: boolean;
      isApproved?: boolean;
    };
  }
}