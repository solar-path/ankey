import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { coreAuthRoutes } from '@/api/controllers/core/auth.hono'
import { coreTenantsRoutes } from '@/api/controllers/core/tenants.hono'
import { coreSettingsRoutes } from '@/api/controllers/core/settings.hono'
import coreExportRoutes from '@/api/controllers/core/export.hono'
import coreImportRoutes from '@/api/controllers/core/import.hono'
import { inquiryRoutes } from '@/api/controllers/core/inquiry.hono'
import { pricingRouter } from '@/api/controllers/core/pricing.hono'
import { tenantAuthRoutes } from '@/api/controllers/tenant/auth.hono'
import { tenantRBACRoutes } from '@/api/controllers/tenant/rbac.hono'
import { tenantSettingsRoutes } from '@/api/controllers/tenant/settings.hono'
import { productRoutes } from '@/api/controllers/tenant/product.hono'
import { TenantService } from '@/api/tenant.settings'
import { AuditService } from '@/api/audit.settings'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use(
  '*',
  cors({
    origin: origin => {
      // Allow localhost and local network IPs in development
      if (
        !origin ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        /http:\/\/192\.168\.\d+\.\d+:\d+/.test(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('https://localhost:')
      ) {
        return origin || '*'
      }

      // In production, be more restrictive
      if (process.env.NODE_ENV === 'production') {
        const allowedOrigins = ['https://ankey.com', 'https://www.ankey.com']
        if (allowedOrigins.includes(origin)) {
          return origin
        }
      }

      return null
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Accept'],
  })
)

// Tenant detection middleware
app.use('*', async (c, next) => {
  const host = c.req.header('host') || ''
  const subdomain = host.split('.')[0].split(':')[0] // Remove port number
  const url = new URL(c.req.url)

  // Skip tenant detection for development assets and internal routes
  if (
    url.pathname.startsWith('/node_modules') ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('vite') ||
    url.pathname.includes('favicon') ||
    url.pathname.includes('apple-touch-icon')
  ) {
    return c.json({ success: false, error: 'Not found' }, 404)
  }

  // Check if it's a tenant request (has subdomain and not localhost/IP)
  const isLocalhost = subdomain === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(subdomain)

  // For tenant subdomains (not localhost or IP), check if tenant exists
  if (!isLocalhost && subdomain && !['www', 'api'].includes(subdomain)) {
    const tenantService = new TenantService()
    const tenantResult = await tenantService.getTenantBySubdomain(subdomain)

    if (tenantResult.success && tenantResult.data) {
      // Ensure tenant data has proper defaults
      const tenant = {
        ...tenantResult.data,
        isActive: tenantResult.data.isActive ?? true,
        userCount: tenantResult.data.userCount ?? 0,
        monthlyRate: tenantResult.data.monthlyRate ?? 25,
        createdAt: tenantResult.data.createdAt ?? new Date(),
        updatedAt: tenantResult.data.updatedAt ?? new Date(),
      }
      c.set('tenant', tenant)
      c.set('tenantDatabase', tenant.database)
      c.set('isTenant', true)
    } else {
      return c.json({ success: false, error: 'Tenant not found' }, 404)
    }
  } else {
    // This is core/localhost access
    c.set('isTenant', false)
  }

  await next()
})

// Add audit middleware
app.use('/api/*', (c, next) => {
  const isTenant = c.get('isTenant')
  const tenantDatabase = c.get('tenantDatabase')

  return AuditService.createAuditMiddleware(isTenant ? tenantDatabase : undefined)(c, next)
})

// Core routes (for localhost without subdomain)
app.route('/api/core/auth', coreAuthRoutes)
app.route('/api/core/tenants', coreTenantsRoutes)
app.route('/api/core/settings', coreSettingsRoutes)
app.route('/api/core/export', coreExportRoutes)
app.route('/api/core/import', coreImportRoutes)
app.route('/api/core/inquiry', inquiryRoutes)
app.route('/api/core/pricing', pricingRouter)

// Tenant routes (for subdomain requests)
app.use('/api/tenant/*', async (c, next) => {
  if (!c.get('isTenant')) {
    return c.json(
      { success: false, error: 'This endpoint is only available for tenant workspaces' },
      400
    )
  }
  await next()
})

app.route('/api/tenant/auth', tenantAuthRoutes)
app.route('/api/tenant/rbac', tenantRBACRoutes)
app.route('/api/tenant/settings', tenantSettingsRoutes)
app.route('/api/tenant/products', productRoutes)

// RPC Routes for type-safe client communication
const rpcRoutes = app
  .basePath('/api/rpc')
  .route('/core/auth', coreAuthRoutes)
  .route('/core/tenants', coreTenantsRoutes)
  .route('/core/settings', coreSettingsRoutes)
  .route('/core/export', coreExportRoutes)
  .route('/core/import', coreImportRoutes)
  .route('/core/inquiry', inquiryRoutes)
  .route('/core/pricing', pricingRouter)
  .route('/tenant/auth', tenantAuthRoutes)
  .route('/tenant/rbac', tenantRBACRoutes)
  .route('/tenant/settings', tenantSettingsRoutes)

export type AppType = typeof rpcRoutes

// Health check
app.get('/api/health', c => {
  const isTenant = c.get('isTenant')
  const tenant = c.get('tenant')

  return c.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      type: isTenant ? 'tenant' : 'core',
      tenant: isTenant
        ? {
            name: tenant?.name,
            subdomain: tenant?.subdomain,
          }
        : null,
    },
  })
})

// Root endpoint
app.get('/', c => {
  const isTenant = c.get('isTenant')
  const tenant = c.get('tenant')

  return c.json({
    message: 'Ankey Multi-Tenant API',
    type: isTenant ? 'tenant' : 'core',
    tenant: isTenant ? tenant?.name : null,
    version: '1.0.0',
  })
})

// Export for Bun to handle server lifecycle
export default {
  port: process.env.PORT || 3001,
  fetch: app.fetch,
  development: process.env.NODE_ENV !== 'production',
}
