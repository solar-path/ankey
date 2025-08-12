import { z } from '@hono/zod-openapi'

// Tenant schema for OpenAPI
export const TenantSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Unique tenant identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  name: z.string().openapi({
    description: 'Tenant organization name',
    example: 'Acme Corporation',
  }),
  subdomain: z.string().openapi({
    description: 'Tenant subdomain for multi-tenant access',
    example: 'acme',
  }),
  database: z.string().openapi({
    description: 'Database identifier for tenant data isolation',
    example: 'tenant_acme',
  }),
  isActive: z.boolean().openapi({
    description: 'Whether the tenant is active and operational',
    example: true,
  }),
  billingEmail: z.string().email().openapi({
    description: 'Primary email for billing and administrative purposes',
    example: 'billing@acme.com',
  }),
  userCount: z.number().int().min(0).openapi({
    description: 'Current number of users in the tenant',
    example: 25,
  }),
  monthlyRate: z.number().min(0).openapi({
    description: 'Monthly billing rate in USD',
    example: 29.99,
  }),
  createdAt: z.string().datetime().openapi({
    description: 'Tenant creation timestamp',
    example: '2024-01-01T00:00:00Z',
  }),
  updatedAt: z.string().datetime().openapi({
    description: 'Last tenant update timestamp',
    example: '2024-01-15T10:30:00Z',
  }),
})

// Update tenant request schema
export const UpdateTenantRequestSchema = z.object({
  name: z.string().min(1).optional().openapi({
    description: 'Update tenant name',
    example: 'Acme Corporation Inc.',
  }),
  isActive: z.boolean().optional().openapi({
    description: 'Update active status',
    example: false,
  }),
  billingEmail: z.string().email().optional().openapi({
    description: 'Update billing email',
    example: 'newbilling@acme.com',
  }),
  monthlyRate: z.number().min(0).optional().openapi({
    description: 'Update monthly rate in USD',
    example: 39.99,
  }),
})

// Deactivate tenant request schema
export const DeactivateTenantRequestSchema = z.object({
  reason: z.string().optional().openapi({
    description: 'Optional reason for deactivation',
    example: 'Customer requested account closure',
  }),
})

// Tenant filters query schema
export const TenantFiltersSchema = z.object({
  search: z.string().optional().openapi({
    param: {
      name: 'search',
      in: 'query',
      description: 'Search tenants by name or subdomain',
      example: 'acme',
    },
  }),
  isActive: z.enum(['true', 'false']).optional().openapi({
    param: {
      name: 'isActive',
      in: 'query',
      description: 'Filter by active status',
      example: 'true',
    },
  }),
  limit: z.coerce.number().min(1).max(100).default(10).openapi({
    param: {
      name: 'limit',
      in: 'query',
      description: 'Number of results per page',
      example: 10,
    },
  }),
  offset: z.coerce.number().min(0).default(0).openapi({
    param: {
      name: 'offset',
      in: 'query',
      description: 'Number of results to skip',
      example: 0,
    },
  }),
})

// Billing query schema
export const BillingQuerySchema = z.object({
  startDate: z.string().datetime().openapi({
    param: {
      name: 'startDate',
      in: 'query',
      description: 'Billing period start date',
      example: '2024-01-01T00:00:00Z',
    },
  }),
  endDate: z.string().datetime().openapi({
    param: {
      name: 'endDate',
      in: 'query',
      description: 'Billing period end date',
      example: '2024-01-31T23:59:59Z',
    },
  }),
})

// Tenant list response schema
export const TenantListResponseSchema = z.object({
  tenants: z.array(TenantSchema).openapi({
    description: 'Array of tenant objects',
  }),
  total: z.number().int().optional().openapi({
    description: 'Total number of tenants matching filters',
    example: 150,
  }),
  pagination: z.object({
    page: z.number().int().openapi({
      description: 'Current page number',
      example: 1,
    }),
    limit: z.number().int().openapi({
      description: 'Results per page',
      example: 10,
    }),
    total: z.number().int().openapi({
      description: 'Total number of results',
      example: 150,
    }),
  }).optional(),
})

// Billing calculation schema
export const BillingCalculationSchema = z.object({
  tenantId: z.string().uuid().openapi({
    description: 'Tenant identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  billingPeriod: z.object({
    startDate: z.string().datetime().openapi({
      description: 'Billing period start',
      example: '2024-01-01T00:00:00Z',
    }),
    endDate: z.string().datetime().openapi({
      description: 'Billing period end',
      example: '2024-01-31T23:59:59Z',
    }),
  }),
  usage: z.object({
    userCount: z.number().int().openapi({
      description: 'Average user count during period',
      example: 25,
    }),
    storageUsed: z.number().openapi({
      description: 'Storage usage in GB',
      example: 15.5,
    }),
    apiCalls: z.number().int().openapi({
      description: 'Total API calls during period',
      example: 50000,
    }),
  }),
  charges: z.object({
    baseRate: z.number().openapi({
      description: 'Base monthly rate',
      example: 29.99,
    }),
    overages: z.number().openapi({
      description: 'Overage charges',
      example: 15.50,
    }),
    total: z.number().openapi({
      description: 'Total charges for period',
      example: 45.49,
    }),
  }),
})

// Dashboard stats schema
export const DashboardStatsSchema = z.object({
  totalTenants: z.number().int().openapi({
    description: 'Total number of tenants',
    example: 150,
  }),
  activeTenants: z.number().int().openapi({
    description: 'Number of active tenants',
    example: 142,
  }),
  totalUsers: z.number().int().openapi({
    description: 'Total users across all tenants',
    example: 3250,
  }),
  totalRevenue: z.number().openapi({
    description: 'Total monthly recurring revenue',
    example: 4875.00,
  }),
  recentActivity: z.array(z.object({
    id: z.string().openapi({
      description: 'Activity ID',
      example: 'act_123',
    }),
    type: z.string().openapi({
      description: 'Activity type',
      example: 'tenant_created',
    }),
    description: z.string().openapi({
      description: 'Activity description',
      example: 'New tenant "Acme Corp" created',
    }),
    timestamp: z.string().datetime().openapi({
      description: 'Activity timestamp',
      example: '2024-01-15T10:30:00Z',
    }),
  })).openapi({
    description: 'Recent system activity',
  }),
})

// Billing report item schema
export const BillingReportItemSchema = z.object({
  tenant: TenantSchema,
  billing: BillingCalculationSchema,
})

// Recent tenant schema (simplified)
export const RecentTenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  subdomain: z.string(),
  userCount: z.number().int(),
  createdAt: z.string().datetime(),
})

// System activity schema
export const SystemActivitySchema = z.object({
  id: z.string().openapi({
    description: 'Activity ID',
    example: 'act_123',
  }),
  action: z.string().openapi({
    description: 'Action performed',
    example: 'CREATE',
  }),
  resource: z.string().openapi({
    description: 'Resource affected',
    example: 'tenant',
  }),
  description: z.string().openapi({
    description: 'Human-readable description',
    example: 'Created new tenant "Acme Corp"',
  }),
  userId: z.string().uuid().optional().openapi({
    description: 'User who performed the action',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  ipAddress: z.string().optional().openapi({
    description: 'IP address of the request',
    example: '192.168.1.100',
  }),
  timestamp: z.string().datetime().openapi({
    description: 'When the activity occurred',
    example: '2024-01-15T10:30:00Z',
  }),
})

// Export all schemas
export const TenantSchemas = {
  Tenant: TenantSchema,
  UpdateTenantRequest: UpdateTenantRequestSchema,
  DeactivateTenantRequest: DeactivateTenantRequestSchema,
  TenantFilters: TenantFiltersSchema,
  BillingQuery: BillingQuerySchema,
  TenantListResponse: TenantListResponseSchema,
  BillingCalculation: BillingCalculationSchema,
  DashboardStats: DashboardStatsSchema,
  BillingReportItem: BillingReportItemSchema,
  RecentTenant: RecentTenantSchema,
  SystemActivity: SystemActivitySchema,
}