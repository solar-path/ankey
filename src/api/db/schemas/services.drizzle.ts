import { pgTable, uuid, varchar, text, boolean, timestamp, integer, decimal } from 'drizzle-orm/pg-core'

// Services - Educational Portal, Hunt Portal, Shop Portal, Swap Portal
export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  baseUrl: varchar('base_url', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  maxUsers: integer('max_users').default(1000),
  currentUsers: integer('current_users').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Service subscriptions - track tenant usage of services
export const serviceSubscriptions = pgTable('service_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').references(() => services.id, { onDelete: 'cascade' }).notNull(),
  tenantId: uuid('tenant_id').notNull(), // Reference to tenant ID
  tenantName: varchar('tenant_name', { length: 255 }),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  userCount: integer('user_count').default(0).notNull(),
  pricePerUser: decimal('price_per_user', { precision: 10, scale: 2 }).default('0.00').notNull(),
  totalMonthlyPrice: decimal('total_monthly_price', { precision: 10, scale: 2 }).default('0.00').notNull(),
  billingCycle: varchar('billing_cycle', { length: 20 }).default('monthly').notNull(),
  trialEndsAt: timestamp('trial_ends_at'),
  nextBillingDate: timestamp('next_billing_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Service usage tracking
export const serviceUsage = pgTable('service_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').references(() => services.id, { onDelete: 'cascade' }).notNull(),
  tenantId: uuid('tenant_id').notNull(),
  usageDate: timestamp('usage_date').defaultNow().notNull(),
  activeUsers: integer('active_users').default(0).notNull(),
  requestCount: integer('request_count').default(0).notNull(),
  dataTransferred: integer('data_transferred').default(0).notNull(), // in bytes
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Service configurations per tenant
export const serviceConfigs = pgTable('service_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').references(() => services.id, { onDelete: 'cascade' }).notNull(),
  tenantId: uuid('tenant_id').notNull(),
  configKey: varchar('config_key', { length: 100 }).notNull(),
  configValue: text('config_value'),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})