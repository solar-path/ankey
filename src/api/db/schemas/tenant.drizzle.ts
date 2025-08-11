import { pgTable, text, timestamp, boolean, uuid, jsonb, integer, decimal } from 'drizzle-orm/pg-core'
// import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { relations } from 'drizzle-orm'

// Tenant users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  passwordHash: text('password_hash'),
  avatar: text('avatar'), // Avatar URL
  isActive: boolean('is_active').default(true),
  emailVerified: boolean('email_verified').default(false),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  twoFactorSecret: text('two_factor_secret'),
  invitedBy: uuid('invited_by').references((): any => users.id),
  inviteToken: text('invite_token'),
  inviteExpiresAt: timestamp('invite_expires_at'),
  isApproved: boolean('is_approved').default(false),
  approvedBy: uuid('approved_by').references((): any => users.id),
  approvedAt: timestamp('approved_at'),
  requestReason: text('request_reason'), // For "let me in" requests
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Tenant sessions for authentication
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
})

// Permissions table
export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Roles table
export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  isSystem: boolean('is_system').default(false), // Cannot be deleted
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Role-Permission junction table
export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id')
    .notNull()
    .references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
})

// User-Role junction table
export const userRoles = pgTable('user_roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  assignedBy: uuid('assigned_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
})

// Delegation of Authority (DOA) table
export const delegations = pgTable('delegations', {
  id: uuid('id').defaultRandom().primaryKey(),
  delegatorId: uuid('delegator_id')
    .notNull()
    .references(() => users.id),
  delegateeId: uuid('delegatee_id')
    .notNull()
    .references(() => users.id),
  permissionId: uuid('permission_id')
    .notNull()
    .references(() => permissions.id),
  startDate: timestamp('start_date').defaultNow(),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true),
  reason: text('reason'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Audit logs table for SOX compliance
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: text('resource_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  sessionId: text('session_id'),
  createdAt: timestamp('created_at').defaultNow(),
})

// Password reset tokens for tenant users
export const tenantPasswordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

// Email verification tokens for tenant users
export const tenantEmailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  token: text('token').notNull().unique(),
  email: text('email').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// Product table
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  price: text('price').notNull(),
  isActive: text('isActive').notNull(),

  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  userRoles: many(userRoles),
  auditLogs: many(auditLogs),
  delegationsAsDelegate: many(delegations, { relationName: 'delegatee' }),
  delegationsAsDelegator: many(delegations, { relationName: 'delegator' }),
  invitedUsers: many(users, { relationName: 'inviter' }),
  settings: one(userSettings),
  inviter: one(users, {
    fields: [users.invitedBy],
    references: [users.id],
    relationName: 'inviter',
  }),
  approver: one(users, {
    fields: [users.approvedBy],
    references: [users.id],
    relationName: 'approver',
  }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}))

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  delegations: many(delegations),
}))

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}))

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}))

export const delegationsRelations = relations(delegations, ({ one }) => ({
  delegator: one(users, {
    fields: [delegations.delegatorId],
    references: [users.id],
    relationName: 'delegator',
  }),
  delegatee: one(users, {
    fields: [delegations.delegateeId],
    references: [users.id],
    relationName: 'delegatee',
  }),
  permission: one(permissions, {
    fields: [delegations.permissionId],
    references: [permissions.id],
  }),
}))

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}))

// Tenant user settings table
export const userSettings = pgTable('user_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  // Personal settings
  gender: text('gender'), // 'male', 'female', 'other', 'prefer-not-to-say'
  dateOfBirth: text('date_of_birth'), // ISO date string
  timezone: text('timezone'),
  language: text('language').default('en'),
  // Contact settings
  phone: text('phone'),
  address: text('address'),
  // Appearance settings
  theme: text('theme').default('light'), // 'light', 'dark'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Relations for user settings
export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}))

// Zod schemas for validation - temporarily disabled due to Zod v4 + Bun compatibility issues
// // export const insertUserSchema = createInsertSchema(users)
// // export const selectUserSchema = createSelectSchema(users)
// // export const insertSessionSchema = createInsertSchema(sessions)
// export const selectSessionSchema = createSelectSchema(sessions)
// export const insertPermissionSchema = createInsertSchema(permissions)
// export const selectPermissionSchema = createSelectSchema(permissions)
// export const insertRoleSchema = createInsertSchema(roles)
// export const selectRoleSchema = createSelectSchema(roles)

export const productsRelations = relations(products, () => ({
  // Add relations here as needed
}))

// Tenant Subscription & Plan Information (Local Cache)
// This mirrors core database data but provides local access for tenant operations
export const tenantSubscription = pgTable('tenant_subscription', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').notNull(), // Reference to core tenant ID
  planId: text('plan_id').notNull(), // Reference to core plan ID
  planName: text('plan_name').notNull(),
  planFeatures: jsonb('plan_features'), // JSON array of features
  status: text('status').notNull().default('trial'), // 'active', 'trial', 'inactive', 'cancelled'
  userCount: integer('user_count').default(0).notNull(),
  maxUsers: integer('max_users'), // null = unlimited
  pricePerUser: decimal('price_per_user', { precision: 10, scale: 2 }).default('0.00').notNull(),
  totalMonthlyPrice: decimal('total_monthly_price', { precision: 10, scale: 2 }).default('0.00').notNull(),
  billingCycle: text('billing_cycle').default('monthly').notNull(), // 'monthly', 'yearly'
  trialEndsAt: timestamp('trial_ends_at'),
  nextBillingDate: timestamp('next_billing_date'),
  lastSyncedAt: timestamp('last_synced_at').defaultNow(), // When last synced with core
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Tenant Usage Metrics (for billing and plan limits)
export const tenantUsage = pgTable('tenant_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  usageDate: timestamp('usage_date').defaultNow().notNull(),
  activeUsers: integer('active_users').default(0).notNull(),
  totalUsers: integer('total_users').default(0).notNull(),
  storageUsed: integer('storage_used').default(0).notNull(), // in MB
  apiRequests: integer('api_requests').default(0).notNull(),
  dataTransfer: integer('data_transfer').default(0).notNull(), // in MB
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Plan Limits Tracking
export const planLimits = pgTable('plan_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  limitType: text('limit_type').notNull(), // 'users', 'storage', 'api_requests', 'data_transfer'
  limitValue: integer('limit_value'), // null = unlimited
  currentUsage: integer('current_usage').default(0).notNull(),
  warningThreshold: integer('warning_threshold').default(80).notNull(), // percentage
  isExceeded: boolean('is_exceeded').default(false).notNull(),
  lastChecked: timestamp('last_checked').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
