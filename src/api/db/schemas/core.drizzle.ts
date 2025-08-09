import { pgTable, text, timestamp, boolean, integer, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Core admin users table
export const coreUsers = pgTable('core_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  avatar: text('avatar'), // Avatar URL
  isActive: boolean('is_active').default(true),
  emailVerified: boolean('email_verified').default(false),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  twoFactorSecret: text('two_factor_secret'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

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
})

// Core sessions for authentication
export const coreSessions = pgTable('core_sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => coreUsers.id),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
})

// Password reset tokens
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => coreUsers.id),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

// Email verification tokens
export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => coreUsers.id),
  token: text('token').notNull().unique(),
  email: text('email').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

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
})

// Relations will be defined after settings table

export const tenantsRelations = relations(tenants, ({ many }) => ({
  subscriptions: many(tenantSubscriptions),
}))

export const coreSessionsRelations = relations(coreSessions, ({ one }) => ({
  user: one(coreUsers, {
    fields: [coreSessions.userId],
    references: [coreUsers.id],
  }),
}))

export const coreAuditLogsRelations = relations(coreAuditLogs, ({ one }) => ({
  user: one(coreUsers, {
    fields: [coreAuditLogs.userId],
    references: [coreUsers.id],
  }),
}))

// Pricing plans table
export const pricingPlans = pgTable('pricing_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  pricePerUserPerMonth: integer('price_per_user_per_month').notNull(),
  minUsers: integer('min_users').default(1),
  maxUsers: integer('max_users'),
  features: text('features').notNull(), // JSON array of features
  trialDays: integer('trial_days').default(0),
  trialMaxUsers: integer('trial_max_users').default(5),
  isActive: boolean('is_active').default(true),
  displayOrder: integer('display_order').default(0),
  badge: text('badge'), // e.g., "Popular", "Best Value"
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Pricing discounts table
export const pricingDiscounts = pgTable('pricing_discounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  planId: uuid('plan_id')
    .notNull()
    .references(() => pricingPlans.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  discountPercent: integer('discount_percent').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  isActive: boolean('is_active').default(true),
  promoCode: text('promo_code'),
  minMonths: integer('min_months').default(1), // Minimum subscription months for discount
  createdAt: timestamp('created_at').defaultNow(),
})

// Tenant pricing subscriptions
export const tenantSubscriptions = pgTable('tenant_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  planId: uuid('plan_id')
    .notNull()
    .references(() => pricingPlans.id),
  discountId: uuid('discount_id').references(() => pricingDiscounts.id),
  status: text('status').notNull().default('active'), // active, trial, suspended, cancelled
  userCount: integer('user_count').notNull().default(1),
  pricePerUser: integer('price_per_user').notNull(),
  totalMonthlyPrice: integer('total_monthly_price').notNull(),
  billingCycle: text('billing_cycle').notNull().default('monthly'), // monthly, yearly
  trialEndsAt: timestamp('trial_ends_at'),
  nextBillingDate: timestamp('next_billing_date'),
  cancelledAt: timestamp('cancelled_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Relations for pricing
export const pricingPlansRelations = relations(pricingPlans, ({ many }) => ({
  discounts: many(pricingDiscounts),
  subscriptions: many(tenantSubscriptions),
}))

export const pricingDiscountsRelations = relations(pricingDiscounts, ({ one }) => ({
  plan: one(pricingPlans, {
    fields: [pricingDiscounts.planId],
    references: [pricingPlans.id],
  }),
}))

export const tenantSubscriptionsRelations = relations(tenantSubscriptions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantSubscriptions.tenantId],
    references: [tenants.id],
  }),
  plan: one(pricingPlans, {
    fields: [tenantSubscriptions.planId],
    references: [pricingPlans.id],
  }),
  discount: one(pricingDiscounts, {
    fields: [tenantSubscriptions.discountId],
    references: [pricingDiscounts.id],
  }),
}))

// Core user settings table
export const coreUserSettings = pgTable('core_user_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => coreUsers.id, { onDelete: 'cascade' }),
  // Personal settings
  gender: text('gender'), // 'male', 'female', 'other', 'prefer-not-to-say'
  dateOfBirth: text('date_of_birth'), // ISO date string
  timezone: text('timezone'),
  language: text('language').default('en'),
  // Contact settings
  phone: text('phone'),
  address: text('address'),
  emergencyContactName: text('emergency_contact_name'),
  emergencyContactPhone: text('emergency_contact_phone'),
  emergencyContactRelationship: text('emergency_contact_relationship'),
  // Appearance settings
  theme: text('theme').default('system'), // 'light', 'dark', 'system'
  density: text('density').default('comfortable'), // 'compact', 'comfortable', 'spacious'
  primaryColor: text('primary_color').default('#000000'),
  fontSize: text('font_size').default('medium'), // 'small', 'medium', 'large'
  sidebarCollapsed: boolean('sidebar_collapsed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Relations for core user settings
export const coreUserSettingsRelations = relations(coreUserSettings, ({ one }) => ({
  user: one(coreUsers, {
    fields: [coreUserSettings.userId],
    references: [coreUsers.id],
  }),
}))

// Update coreUsersRelations to include settings
export const coreUsersRelations = relations(coreUsers, ({ many, one }) => ({
  sessions: many(coreSessions),
  passwordResetTokens: many(passwordResetTokens),
  emailVerificationTokens: many(emailVerificationTokens),
  auditLogs: many(coreAuditLogs),
  settings: one(coreUserSettings),
}))

// Note: Zod schemas temporarily disabled due to Zod v4 + Bun compatibility issues
// TODO: Re-enable validation once Zod v4/Bun issue is resolved
