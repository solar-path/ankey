import { z } from '@hono/zod-openapi'

// Pricing Plan schema
export const PricingPlanSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Unique pricing plan identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  name: z.string().openapi({
    description: 'Plan name',
    example: 'Professional Plan',
  }),
  description: z.string().optional().openapi({
    description: 'Plan description',
    example: 'Perfect for growing teams',
  }),
  pricePerUserPerMonth: z.number().min(0).openapi({
    description: 'Price per user per month in USD',
    example: 29.99,
  }),
  minUsers: z.number().int().optional().openapi({
    description: 'Minimum number of users required',
    example: 1,
  }),
  maxUsers: z.number().int().optional().openapi({
    description: 'Maximum number of users allowed',
    example: 100,
  }),
  features: z.string().openapi({
    description: 'JSON string of plan features array',
    example: '["Advanced analytics", "Priority support", "Custom integrations"]',
  }),
  trialDays: z.number().int().optional().openapi({
    description: 'Number of trial days offered',
    example: 14,
  }),
  trialMaxUsers: z.number().int().optional().openapi({
    description: 'Maximum users allowed during trial',
    example: 5,
  }),
  displayOrder: z.number().int().openapi({
    description: 'Display order for plan listing',
    example: 1,
  }),
  badge: z.string().optional().openapi({
    description: 'Badge text for plan (e.g., "Popular", "Best Value")',
    example: 'Most Popular',
  }),
  isActive: z.boolean().openapi({
    description: 'Whether the plan is active and available',
    example: true,
  }),
  createdAt: z.string().datetime().openapi({
    description: 'Plan creation timestamp',
    example: '2024-01-01T00:00:00Z',
  }),
  updatedAt: z.string().datetime().openapi({
    description: 'Last plan update timestamp',
    example: '2024-01-15T10:30:00Z',
  }),
})

// Create pricing plan request schema
export const CreatePricingPlanRequestSchema = z.object({
  name: z.string().min(1).openapi({
    description: 'Plan name',
    example: 'Professional Plan',
  }),
  description: z.string().optional().openapi({
    description: 'Plan description',
    example: 'Perfect for growing teams',
  }),
  pricePerUserPerMonth: z.number().min(0).openapi({
    description: 'Price per user per month in USD',
    example: 29.99,
  }),
  minUsers: z.number().int().optional().openapi({
    description: 'Minimum number of users required',
    example: 1,
  }),
  maxUsers: z.number().int().optional().openapi({
    description: 'Maximum number of users allowed',
    example: 100,
  }),
  features: z.string().openapi({
    description: 'JSON string of plan features array',
    example: '["Advanced analytics", "Priority support", "Custom integrations"]',
  }),
  trialDays: z.number().int().optional().openapi({
    description: 'Number of trial days offered',
    example: 14,
  }),
  trialMaxUsers: z.number().int().optional().openapi({
    description: 'Maximum users allowed during trial',
    example: 5,
  }),
  displayOrder: z.number().int().default(0).openapi({
    description: 'Display order for plan listing',
    example: 1,
  }),
  badge: z.string().optional().openapi({
    description: 'Badge text for plan (e.g., "Popular", "Best Value")',
    example: 'Most Popular',
  }),
  isActive: z.boolean().default(true).openapi({
    description: 'Whether the plan is active and available',
    example: true,
  }),
})

// Update pricing plan request schema
export const UpdatePricingPlanRequestSchema = CreatePricingPlanRequestSchema.partial()

// Pricing Discount schema
export const PricingDiscountSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Unique discount identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  planId: z.string().uuid().openapi({
    description: 'Associated pricing plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  name: z.string().openapi({
    description: 'Discount name',
    example: 'Black Friday Special',
  }),
  discountPercent: z.number().min(0).max(100).openapi({
    description: 'Discount percentage (0-100)',
    example: 25,
  }),
  startDate: z.string().datetime().openapi({
    description: 'Discount start date',
    example: '2024-11-24T00:00:00Z',
  }),
  endDate: z.string().datetime().openapi({
    description: 'Discount end date',
    example: '2024-11-30T23:59:59Z',
  }),
  promoCode: z.string().optional().openapi({
    description: 'Optional promo code for discount',
    example: 'BLACKFRIDAY25',
  }),
  minMonths: z.number().int().optional().openapi({
    description: 'Minimum months required for discount',
    example: 12,
  }),
  isActive: z.boolean().openapi({
    description: 'Whether the discount is active',
    example: true,
  }),
  createdAt: z.string().datetime().openapi({
    description: 'Discount creation timestamp',
    example: '2024-01-01T00:00:00Z',
  }),
  updatedAt: z.string().datetime().openapi({
    description: 'Last discount update timestamp',
    example: '2024-01-15T10:30:00Z',
  }),
})

// Create discount request schema
export const CreateDiscountRequestSchema = z.object({
  planId: z.string().uuid().openapi({
    description: 'Associated pricing plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  name: z.string().min(1).openapi({
    description: 'Discount name',
    example: 'Black Friday Special',
  }),
  discountPercent: z.number().min(0).max(100).openapi({
    description: 'Discount percentage (0-100)',
    example: 25,
  }),
  startDate: z.coerce.date().openapi({
    description: 'Discount start date',
    example: '2024-11-24T00:00:00Z',
  }),
  endDate: z.coerce.date().openapi({
    description: 'Discount end date',
    example: '2024-11-30T23:59:59Z',
  }),
  promoCode: z.string().optional().openapi({
    description: 'Optional promo code for discount',
    example: 'BLACKFRIDAY25',
  }),
  minMonths: z.number().int().optional().openapi({
    description: 'Minimum months required for discount',
    example: 12,
  }),
  isActive: z.boolean().default(true).openapi({
    description: 'Whether the discount is active',
    example: true,
  }),
})

// Update discount request schema
export const UpdateDiscountRequestSchema = CreateDiscountRequestSchema.partial()

// Tenant Subscription schema
export const TenantSubscriptionSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Unique subscription identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  tenantId: z.string().uuid().openapi({
    description: 'Associated tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  tenantName: z.string().optional().openapi({
    description: 'Tenant name (from join)',
    example: 'Acme Corporation',
  }),
  tenantSubdomain: z.string().optional().openapi({
    description: 'Tenant subdomain (from join)',
    example: 'acme',
  }),
  planId: z.string().uuid().openapi({
    description: 'Associated pricing plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  planName: z.string().optional().openapi({
    description: 'Plan name (from join)',
    example: 'Professional Plan',
  }),
  discountId: z.string().uuid().optional().openapi({
    description: 'Applied discount ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  status: z.string().openapi({
    description: 'Subscription status',
    example: 'active',
    enum: ['trial', 'active', 'cancelled', 'inactive'],
  }),
  userCount: z.number().int().min(0).openapi({
    description: 'Current number of users',
    example: 25,
  }),
  pricePerUser: z.number().min(0).openapi({
    description: 'Price per user per month',
    example: 29.99,
  }),
  totalMonthlyPrice: z.number().min(0).openapi({
    description: 'Total monthly price',
    example: 749.75,
  }),
  billingCycle: z.string().openapi({
    description: 'Billing cycle',
    example: 'monthly',
    enum: ['monthly', 'yearly'],
  }),
  trialEndsAt: z.string().datetime().optional().openapi({
    description: 'Trial end date',
    example: '2024-01-15T00:00:00Z',
  }),
  nextBillingDate: z.string().datetime().optional().openapi({
    description: 'Next billing date',
    example: '2024-02-01T00:00:00Z',
  }),
  cancelledAt: z.string().datetime().optional().openapi({
    description: 'Cancellation date',
    example: '2024-01-15T00:00:00Z',
  }),
  createdAt: z.string().datetime().openapi({
    description: 'Subscription creation timestamp',
    example: '2024-01-01T00:00:00Z',
  }),
  updatedAt: z.string().datetime().openapi({
    description: 'Last subscription update timestamp',
    example: '2024-01-15T10:30:00Z',
  }),
})

// Pricing calculation request schema
export const PricingCalculationRequestSchema = z.object({
  planId: z.string().uuid().openapi({
    description: 'Pricing plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  userCount: z.number().int().min(1).openapi({
    description: 'Number of users',
    example: 25,
  }),
  discountCode: z.string().optional().openapi({
    description: 'Optional discount/promo code',
    example: 'BLACKFRIDAY25',
  }),
  billingCycle: z.enum(['monthly', 'yearly']).openapi({
    description: 'Billing cycle',
    example: 'monthly',
  }),
})

// Pricing calculation response schema
export const PricingCalculationResponseSchema = z.object({
  planId: z.string().uuid().openapi({
    description: 'Pricing plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  planName: z.string().openapi({
    description: 'Plan name',
    example: 'Professional Plan',
  }),
  userCount: z.number().int().openapi({
    description: 'Number of users',
    example: 25,
  }),
  billingCycle: z.string().openapi({
    description: 'Billing cycle',
    example: 'monthly',
  }),
  pricePerUser: z.number().openapi({
    description: 'Price per user per month',
    example: 29.99,
  }),
  basePrice: z.number().openapi({
    description: 'Base price before discounts',
    example: 749.75,
  }),
  discountPercent: z.number().openapi({
    description: 'Applied discount percentage',
    example: 15,
  }),
  discountAmount: z.number().openapi({
    description: 'Discount amount in USD',
    example: 112.46,
  }),
  finalPrice: z.number().openapi({
    description: 'Final price after discounts',
    example: 637.29,
  }),
  periodicPrice: z.number().openapi({
    description: 'Periodic price (monthly equivalent)',
    example: 637.29,
  }),
  appliedDiscount: PricingDiscountSchema.optional().openapi({
    description: 'Applied discount details (if any)',
  }),
  trialDays: z.number().int().optional().openapi({
    description: 'Number of trial days',
    example: 14,
  }),
})

// Subscription sync response schema
export const SubscriptionSyncResponseSchema = z.object({
  success: z.boolean().openapi({
    description: 'Whether sync was successful',
    example: true,
  }),
  synced: z.number().int().openapi({
    description: 'Number of subscriptions updated',
    example: 5,
  }),
  created: z.number().int().openapi({
    description: 'Number of subscriptions created',
    example: 2,
  }),
  errors: z.number().int().openapi({
    description: 'Number of errors encountered',
    example: 0,
  }),
  message: z.string().openapi({
    description: 'Summary message',
    example: '5 subscriptions updated, 2 subscriptions created',
  }),
})

// Export all schemas
export const PricingSchemas = {
  PricingPlan: PricingPlanSchema,
  CreatePricingPlanRequest: CreatePricingPlanRequestSchema,
  UpdatePricingPlanRequest: UpdatePricingPlanRequestSchema,
  PricingDiscount: PricingDiscountSchema,
  CreateDiscountRequest: CreateDiscountRequestSchema,
  UpdateDiscountRequest: UpdateDiscountRequestSchema,
  TenantSubscription: TenantSubscriptionSchema,
  PricingCalculationRequest: PricingCalculationRequestSchema,
  PricingCalculationResponse: PricingCalculationResponseSchema,
  SubscriptionSyncResponse: SubscriptionSyncResponseSchema,
}