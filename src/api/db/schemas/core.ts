import { pgTable, text, timestamp, boolean, integer, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';

// Core admin users table
export const coreUsers = pgTable('core_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  isActive: boolean('is_active').default(true),
  emailVerified: boolean('email_verified').default(false),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  twoFactorSecret: text('two_factor_secret'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tenants table
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  subdomain: text('subdomain').notNull().unique(),
  database: text('database').notNull().unique(),
  isActive: boolean('is_active').default(true),
  billingEmail: text('billing_email').notNull(),
  userCount: integer('user_count').default(0),
  monthlyRate: integer('monthly_rate').default(25),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Core sessions for authentication
export const coreSessions = pgTable('core_sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => coreUsers.id),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
});

// Password reset tokens
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => coreUsers.id),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Email verification tokens
export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => coreUsers.id),
  token: text('token').notNull().unique(),
  email: text('email').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Core audit logs
export const coreAuditLogs = pgTable('core_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => coreUsers.id),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: text('resource_id'),
  oldValues: text('old_values'), // JSON string
  newValues: text('new_values'), // JSON string
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const coreUsersRelations = relations(coreUsers, ({ many }) => ({
  sessions: many(coreSessions),
  passwordResetTokens: many(passwordResetTokens),
  emailVerificationTokens: many(emailVerificationTokens),
  auditLogs: many(coreAuditLogs),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  // Will add tenant-specific relations when needed
}));

export const coreSessionsRelations = relations(coreSessions, ({ one }) => ({
  user: one(coreUsers, {
    fields: [coreSessions.userId],
    references: [coreUsers.id],
  }),
}));

// Zod schemas for validation
export const insertCoreUserSchema = createInsertSchema(coreUsers);
export const selectCoreUserSchema = createSelectSchema(coreUsers);
export const insertTenantSchema = createInsertSchema(tenants);
export const selectTenantSchema = createSelectSchema(tenants);
export const insertCoreSessionSchema = createInsertSchema(coreSessions);
export const selectCoreSessionSchema = createSelectSchema(coreSessions);