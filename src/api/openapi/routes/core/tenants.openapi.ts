import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { TenantService } from '@/api/tenant.settings'
import { TenantSchemas } from '../../schemas/tenant.schemas'
import { CommonSchemas } from '../../schemas/common.schemas'
import { z } from '@hono/zod-openapi'

const tenantService = new TenantService()

// Define OpenAPI routes
const getAllTenantsRoute = createRoute({
  method: 'get',
  path: '/',
  summary: 'Get all tenants',
  description: 'Retrieve a paginated list of tenants with optional filtering and search.',
  tags: ['Tenants'],
  security: [{ cookieAuth: [] }],
  request: {
    query: TenantSchemas.TenantFilters,
  },
  responses: {
    200: {
      description: 'Tenants retrieved successfully',
      content: {
        'application/json': {
          schema: CommonSchemas.ApiResponse(TenantSchemas.TenantListResponse),
          example: {
            success: true,
            data: {
              tenants: [
                {
                  id: '123e4567-e89b-12d3-a456-426614174000',
                  name: 'Acme Corporation',
                  subdomain: 'acme',
                  database: 'tenant_acme',
                  isActive: true,
                  billingEmail: 'billing@acme.com',
                  userCount: 25,
                  monthlyRate: 29.99,
                  createdAt: '2024-01-01T00:00:00Z',
                  updatedAt: '2024-01-15T10:30:00Z',
                },
              ],
              total: 150,
              pagination: {
                page: 1,
                limit: 10,
                total: 150,
              },
            },
          },
        },
      },
    },
    401: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
    403: {
      description: 'Insufficient permissions',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
  },
})

const getTenantByIdRoute = createRoute({
  method: 'get',
  path: '/{id}',
  summary: 'Get tenant by ID',
  description: 'Retrieve a specific tenant by its unique identifier.',
  tags: ['Tenants'],
  security: [{ cookieAuth: [] }],
  request: {
    params: CommonSchemas.UUIDParam,
  },
  responses: {
    200: {
      description: 'Tenant retrieved successfully',
      content: {
        'application/json': {
          schema: CommonSchemas.ApiResponse(TenantSchemas.Tenant),
          example: {
            success: true,
            data: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Acme Corporation',
              subdomain: 'acme',
              database: 'tenant_acme',
              isActive: true,
              billingEmail: 'billing@acme.com',
              userCount: 25,
              monthlyRate: 29.99,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-15T10:30:00Z',
            },
          },
        },
      },
    },
    404: {
      description: 'Tenant not found',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
          example: {
            success: false,
            error: 'Tenant not found',
          },
        },
      },
    },
    401: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
  },
})

const updateTenantRoute = createRoute({
  method: 'put',
  path: '/{id}',
  summary: 'Update tenant',
  description: 'Update tenant information such as name, billing email, or monthly rate.',
  tags: ['Tenants'],
  security: [{ cookieAuth: [] }],
  request: {
    params: CommonSchemas.UUIDParam,
    body: {
      content: {
        'application/json': {
          schema: TenantSchemas.UpdateTenantRequest,
          examples: {
            updateName: {
              summary: 'Update tenant name',
              value: {
                name: 'Acme Corporation Inc.',
              },
            },
            updateBilling: {
              summary: 'Update billing information',
              value: {
                billingEmail: 'newbilling@acme.com',
                monthlyRate: 39.99,
              },
            },
            deactivate: {
              summary: 'Deactivate tenant',
              value: {
                isActive: false,
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Tenant updated successfully',
      content: {
        'application/json': {
          schema: CommonSchemas.ApiResponse(TenantSchemas.Tenant),
        },
      },
    },
    400: {
      description: 'Validation error or invalid request',
      content: {
        'application/json': {
          schema: CommonSchemas.ValidationErrorResponse,
        },
      },
    },
    404: {
      description: 'Tenant not found',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
    401: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
  },
})

const deactivateTenantRoute = createRoute({
  method: 'post',
  path: '/{id}/deactivate',
  summary: 'Deactivate tenant',
  description: 'Deactivate a tenant account with an optional reason.',
  tags: ['Tenants'],
  security: [{ cookieAuth: [] }],
  request: {
    params: CommonSchemas.UUIDParam,
    body: {
      content: {
        'application/json': {
          schema: TenantSchemas.DeactivateTenantRequest,
          examples: {
            withReason: {
              summary: 'Deactivate with reason',
              value: {
                reason: 'Customer requested account closure',
              },
            },
            withoutReason: {
              summary: 'Deactivate without reason',
              value: {},
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Tenant deactivated successfully',
      content: {
        'application/json': {
          schema: CommonSchemas.ApiResponse(null),
          example: {
            success: true,
            message: 'Tenant deactivated successfully',
          },
        },
      },
    },
    400: {
      description: 'Cannot deactivate tenant',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
    404: {
      description: 'Tenant not found',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
    401: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
  },
})

const reactivateTenantRoute = createRoute({
  method: 'post',
  path: '/{id}/reactivate',
  summary: 'Reactivate tenant',
  description: 'Reactivate a previously deactivated tenant account.',
  tags: ['Tenants'],
  security: [{ cookieAuth: [] }],
  request: {
    params: CommonSchemas.UUIDParam,
  },
  responses: {
    200: {
      description: 'Tenant reactivated successfully',
      content: {
        'application/json': {
          schema: CommonSchemas.ApiResponse(null),
          example: {
            success: true,
            message: 'Tenant reactivated successfully',
          },
        },
      },
    },
    400: {
      description: 'Cannot reactivate tenant',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
    404: {
      description: 'Tenant not found',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
    401: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
  },
})

const updateUserCountRoute = createRoute({
  method: 'post',
  path: '/{id}/update-user-count',
  summary: 'Update tenant user count',
  description: 'Refresh the cached user count for a tenant by counting actual users.',
  tags: ['Tenants'],
  security: [{ cookieAuth: [] }],
  request: {
    params: CommonSchemas.UUIDParam,
  },
  responses: {
    200: {
      description: 'User count updated successfully',
      content: {
        'application/json': {
          schema: CommonSchemas.ApiResponse(z.object({
            userCount: z.number().int(),
          })),
          example: {
            success: true,
            data: {
              userCount: 25,
            },
          },
        },
      },
    },
    404: {
      description: 'Tenant not found',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
    401: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
  },
})

const getTenantBillingRoute = createRoute({
  method: 'get',
  path: '/{id}/billing',
  summary: 'Get tenant billing',
  description: 'Calculate billing information for a tenant over a specific period.',
  tags: ['Tenants', 'Billing'],
  security: [{ cookieAuth: [] }],
  request: {
    params: CommonSchemas.UUIDParam,
    query: TenantSchemas.BillingQuery,
  },
  responses: {
    200: {
      description: 'Billing information retrieved successfully',
      content: {
        'application/json': {
          schema: CommonSchemas.ApiResponse(TenantSchemas.BillingCalculation),
          example: {
            success: true,
            data: {
              tenantId: '123e4567-e89b-12d3-a456-426614174000',
              billingPeriod: {
                startDate: '2024-01-01T00:00:00Z',
                endDate: '2024-01-31T23:59:59Z',
              },
              usage: {
                userCount: 25,
                storageUsed: 15.5,
                apiCalls: 50000,
              },
              charges: {
                baseRate: 29.99,
                overages: 15.50,
                total: 45.49,
              },
            },
          },
        },
      },
    },
    400: {
      description: 'Invalid date range or parameters',
      content: {
        'application/json': {
          schema: CommonSchemas.ValidationErrorResponse,
        },
      },
    },
    404: {
      description: 'Tenant not found',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
    401: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
  },
})

const getBillingReportRoute = createRoute({
  method: 'get',
  path: '/reports/billing',
  summary: 'Generate billing report',
  description: 'Generate a comprehensive billing report for all tenants over a specific period.',
  tags: ['Tenants', 'Billing', 'Reports'],
  security: [{ cookieAuth: [] }],
  request: {
    query: TenantSchemas.BillingQuery,
  },
  responses: {
    200: {
      description: 'Billing report generated successfully',
      content: {
        'application/json': {
          schema: CommonSchemas.ApiResponse(z.array(TenantSchemas.BillingReportItem)),
          example: {
            success: true,
            data: [
              {
                tenant: {
                  id: '123e4567-e89b-12d3-a456-426614174000',
                  name: 'Acme Corporation',
                  subdomain: 'acme',
                  database: 'tenant_acme',
                  isActive: true,
                  billingEmail: 'billing@acme.com',
                  userCount: 25,
                  monthlyRate: 29.99,
                  createdAt: '2024-01-01T00:00:00Z',
                  updatedAt: '2024-01-15T10:30:00Z',
                },
                billing: {
                  tenantId: '123e4567-e89b-12d3-a456-426614174000',
                  billingPeriod: {
                    startDate: '2024-01-01T00:00:00Z',
                    endDate: '2024-01-31T23:59:59Z',
                  },
                  usage: {
                    userCount: 25,
                    storageUsed: 15.5,
                    apiCalls: 50000,
                  },
                  charges: {
                    baseRate: 29.99,
                    overages: 15.50,
                    total: 45.49,
                  },
                },
              },
            ],
          },
        },
      },
    },
    400: {
      description: 'Invalid date range',
      content: {
        'application/json': {
          schema: CommonSchemas.ValidationErrorResponse,
        },
      },
    },
    401: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
  },
})

const getDashboardStatsRoute = createRoute({
  method: 'get',
  path: '/stats/dashboard',
  summary: 'Get dashboard statistics',
  description: 'Retrieve key metrics and statistics for the admin dashboard.',
  tags: ['Tenants', 'Dashboard'],
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      description: 'Dashboard statistics retrieved successfully',
      content: {
        'application/json': {
          schema: CommonSchemas.ApiResponse(TenantSchemas.DashboardStats),
          example: {
            success: true,
            data: {
              totalTenants: 150,
              activeTenants: 142,
              totalUsers: 3250,
              totalRevenue: 4875.00,
              recentActivity: [
                {
                  id: 'act_123',
                  type: 'tenant_created',
                  description: 'New tenant "Acme Corp" created',
                  timestamp: '2024-01-15T10:30:00Z',
                },
              ],
            },
          },
        },
      },
    },
    401: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
  },
})

const getRecentTenantsRoute = createRoute({
  method: 'get',
  path: '/recent',
  summary: 'Get recent tenants',
  description: 'Retrieve a list of recently created tenants.',
  tags: ['Tenants'],
  security: [{ cookieAuth: [] }],
  request: {
    query: z.object({
      limit: z.coerce.number().min(1).max(50).default(5).openapi({
        param: {
          name: 'limit',
          in: 'query',
          description: 'Number of recent tenants to return',
          example: 5,
        },
      }),
    }),
  },
  responses: {
    200: {
      description: 'Recent tenants retrieved successfully',
      content: {
        'application/json': {
          schema: CommonSchemas.ApiResponse(z.array(TenantSchemas.RecentTenant)),
          example: {
            success: true,
            data: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Acme Corporation',
                subdomain: 'acme',
                userCount: 25,
                createdAt: '2024-01-15T10:30:00Z',
              },
            ],
          },
        },
      },
    },
    500: {
      description: 'Server error',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
    401: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
  },
})

const getSystemActivityRoute = createRoute({
  method: 'get',
  path: '/activity',
  summary: 'Get system activity',
  description: 'Retrieve recent system activity and audit logs.',
  tags: ['Tenants', 'Audit'],
  security: [{ cookieAuth: [] }],
  request: {
    query: z.object({
      limit: z.coerce.number().min(1).max(100).default(10).openapi({
        param: {
          name: 'limit',
          in: 'query',
          description: 'Number of activity records to return',
          example: 10,
        },
      }),
    }),
  },
  responses: {
    200: {
      description: 'System activity retrieved successfully',
      content: {
        'application/json': {
          schema: CommonSchemas.ApiResponse(z.array(TenantSchemas.SystemActivity)),
          example: {
            success: true,
            data: [
              {
                id: 'act_123',
                action: 'CREATE',
                resource: 'tenant',
                description: 'Created new tenant "Acme Corp"',
                userId: '123e4567-e89b-12d3-a456-426614174000',
                ipAddress: '192.168.1.100',
                timestamp: '2024-01-15T10:30:00Z',
              },
            ],
          },
        },
      },
    },
    500: {
      description: 'Server error',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
    401: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: CommonSchemas.ErrorResponse,
        },
      },
    },
  },
})

// Create the OpenAPI app and register routes
export const tenantsOpenAPIRoutes = new OpenAPIHono()

// Implement route handlers
tenantsOpenAPIRoutes.openapi(getAllTenantsRoute, async (c) => {
  const user = c.get('user')
  if (!user) {
    return c.json({ success: false, error: 'User not authenticated' }, 401)
  }

  const queryParams = c.req.valid('query')
  const filters = {
    search: queryParams.search,
    isActive: queryParams.isActive ? queryParams.isActive === 'true' : undefined,
    limit: queryParams.limit,
    offset: queryParams.offset,
  }

  const result = await tenantService.getAllTenants(filters)
  return c.json(result)
})

tenantsOpenAPIRoutes.openapi(getTenantByIdRoute, async (c) => {
  const { id } = c.req.valid('param')
  const result = await tenantService.getTenantById(id)
  return c.json(result, result.success ? 200 : 404)
})

tenantsOpenAPIRoutes.openapi(updateTenantRoute, async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')
  const user = c.get('user')
  
  if (!user) {
    return c.json({ success: false, error: 'User not authenticated' }, 401)
  }

  const result = await tenantService.updateTenant(id, data, user.id)
  return c.json(result, result.success ? 200 : 400)
})

tenantsOpenAPIRoutes.openapi(deactivateTenantRoute, async (c) => {
  const { id } = c.req.valid('param')
  const { reason } = c.req.valid('json')
  const user = c.get('user')
  
  if (!user) {
    return c.json({ success: false, error: 'User not authenticated' }, 401)
  }

  const result = await tenantService.deactivateTenant(id, user.id, reason)
  return c.json(result, result.success ? 200 : 400)
})

tenantsOpenAPIRoutes.openapi(reactivateTenantRoute, async (c) => {
  const { id } = c.req.valid('param')
  const user = c.get('user')
  
  if (!user) {
    return c.json({ success: false, error: 'User not authenticated' }, 401)
  }

  const result = await tenantService.reactivateTenant(id, user.id)
  return c.json(result, result.success ? 200 : 400)
})

tenantsOpenAPIRoutes.openapi(updateUserCountRoute, async (c) => {
  const { id } = c.req.valid('param')
  const result = await tenantService.updateUserCount(id)
  return c.json(result, result.success ? 200 : 400)
})

tenantsOpenAPIRoutes.openapi(getTenantBillingRoute, async (c) => {
  const { id } = c.req.valid('param')
  const { startDate, endDate } = c.req.valid('query')
  
  // Convert string dates to Date objects
  const start = new Date(startDate)
  const end = new Date(endDate)

  const result = await tenantService.calculateBilling(id, start, end)
  return c.json(result, result.success ? 200 : 400)
})

tenantsOpenAPIRoutes.openapi(getBillingReportRoute, async (c) => {
  const { startDate, endDate } = c.req.valid('query')
  
  // Convert string dates to Date objects
  const start = new Date(startDate)
  const end = new Date(endDate)

  const result = await tenantService.generateBillingReport(start, end)
  return c.json(result, result.success ? 200 : 400)
})

tenantsOpenAPIRoutes.openapi(getDashboardStatsRoute, async (c) => {
  const result = await tenantService.getDashboardStats()
  return c.json(result)
})

tenantsOpenAPIRoutes.openapi(getRecentTenantsRoute, async (c) => {
  try {
    const { limit } = c.req.valid('query')
    const result = await tenantService.getRecentTenants(limit)

    if (!result.success) {
      console.error('Recent tenants service error:', result.error)
      return c.json(result, 500)
    }

    return c.json(result)
  } catch (error) {
    console.error('Recent tenants route error:', error)
    return c.json({ success: false, error: 'Failed to get recent tenants' }, 500)
  }
})

tenantsOpenAPIRoutes.openapi(getSystemActivityRoute, async (c) => {
  try {
    const { limit } = c.req.valid('query')
    const result = await tenantService.getSystemActivity(limit)

    if (!result.success) {
      console.error('System activity service error:', result.error)
      return c.json(result, 500)
    }

    return c.json(result)
  } catch (error) {
    console.error('System activity route error:', error)
    return c.json({ success: false, error: 'Failed to get system activity' }, 500)
  }
})