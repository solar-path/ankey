import { CoreAuthService } from '@/api/auth.settings'
import { TenantService } from '@/api/tenant.settings'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

const coreTenantsRoutes = new Hono()
const tenantService = new TenantService()
const authService = new CoreAuthService()

// Middleware to check core admin authentication
const requireCoreAuth = async (c: any, next: any) => {
  const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

  if (!sessionId) {
    return c.json({ success: false, error: 'Authentication required' }, 401)
  }

  const { session, user } = await authService.validateSession(sessionId)

  if (!session || !user) {
    return c.json({ success: false, error: 'Invalid session' }, 401)
  }

  c.set('user', user)
  c.set('sessionId', sessionId)
  await next()
}

coreTenantsRoutes.use('*', requireCoreAuth)

// Get all tenants
coreTenantsRoutes.get('/', async c => {
  const search = c.req.query('search')
  const isActive = c.req.query('isActive')
  const limit = c.req.query('limit')
  const offset = c.req.query('offset')

  const filters = {
    search,
    isActive: isActive ? isActive === 'true' : undefined,
    limit: limit ? parseInt(limit) : undefined,
    offset: offset ? parseInt(offset) : undefined,
  }

  const result = await tenantService.getAllTenants(filters)
  return c.json(result)
})

// Update tenant
const updateTenantSchema = z.object({
  name: z.string().optional(),
  isActive: z.boolean().optional(),
  billingEmail: z.string().email().optional(),
  monthlyRate: z.number().min(0).optional(),
})

coreTenantsRoutes.put('/:id', zValidator('json', updateTenantSchema), async c => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  const user = c.get('user')

  const result = await tenantService.updateTenant(id, data, user.id)
  return c.json(result, result.success ? 200 : 400)
})

// Deactivate tenant
const deactivateTenantSchema = z.object({
  reason: z.string().optional(),
})

coreTenantsRoutes.post('/:id/deactivate', zValidator('json', deactivateTenantSchema), async c => {
  const id = c.req.param('id')
  const { reason } = c.req.valid('json')
  const user = c.get('user')

  const result = await tenantService.deactivateTenant(id, user.id, reason)
  return c.json(result, result.success ? 200 : 400)
})

// Reactivate tenant
coreTenantsRoutes.post('/:id/reactivate', async c => {
  const id = c.req.param('id')
  const user = c.get('user')

  const result = await tenantService.reactivateTenant(id, user.id)
  return c.json(result, result.success ? 200 : 400)
})

// Update user count for tenant
coreTenantsRoutes.post('/:id/update-user-count', async c => {
  const id = c.req.param('id')
  const result = await tenantService.updateUserCount(id)
  return c.json(result, result.success ? 200 : 400)
})

// Get billing for tenant
const billingQuerySchema = z.object({
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
})

coreTenantsRoutes.get('/:id/billing', zValidator('query', billingQuerySchema), async c => {
  const id = c.req.param('id')
  const { startDate, endDate } = c.req.valid('query')

  const result = await tenantService.calculateBilling(id, startDate, endDate)
  return c.json(result, result.success ? 200 : 400)
})

// Generate billing report for all tenants
coreTenantsRoutes.get('/reports/billing', zValidator('query', billingQuerySchema), async c => {
  const { startDate, endDate } = c.req.valid('query')

  const result = await tenantService.generateBillingReport(startDate, endDate)
  return c.json(result, result.success ? 200 : 400)
})

// Get dashboard statistics
coreTenantsRoutes.get('/stats/dashboard', async c => {
  const result = await tenantService.getDashboardStats()
  return c.json(result)
})

// Get recent tenants
coreTenantsRoutes.get('/recent', async c => {
  try {
    const limit = c.req.query('limit')
    const result = await tenantService.getRecentTenants(limit ? parseInt(limit) : 5)

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

// Get system activity logs
coreTenantsRoutes.get('/activity', async c => {
  try {
    const limit = c.req.query('limit')
    const result = await tenantService.getSystemActivity(limit ? parseInt(limit) : 10)

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

// Get tenant by ID - MUST come after all specific routes to avoid conflicts
coreTenantsRoutes.get('/:id', async c => {
  const id = c.req.param('id')
  const result = await tenantService.getTenantById(id)
  return c.json(result, result.success ? 200 : 404)
})

export { coreTenantsRoutes }
