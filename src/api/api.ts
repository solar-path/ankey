import { AuditService } from '@/api/audit.settings'
import { coreAuthRoutes } from '@/api/controllers/core/auth.hono'
import { coreExportRoutes } from '@/api/controllers/core/export.hono'
import { coreImportRoutes } from '@/api/controllers/core/import.hono'
import { inquiryRoutes } from '@/api/controllers/core/inquiry.hono'
import { pricingRouter } from '@/api/controllers/core/pricing.hono'
import { coreRBACRoutes } from '@/api/controllers/core/rbac.hono'
import { servicesRouter } from '@/api/controllers/core/services.hono'
import { coreSettingsRoutes } from '@/api/controllers/core/settings.hono'
import { coreTenantsRoutes } from '@/api/controllers/core/tenants.hono'
import { coreUploadRoutes } from '@/api/controllers/core/upload.hono'
import { tenantAuthRoutes } from '@/api/controllers/tenant/auth.hono'
import { productRoutes } from '@/api/controllers/tenant/product.hono'
import { tenantRBACRoutes } from '@/api/controllers/tenant/rbac.hono'
import { tenantSettingsRoutes } from '@/api/controllers/tenant/settings.hono'
import { optionalCoreAuth, optionalTenantAuth } from '@/api/middleware/auth.middleware'
import { TenantService } from '@/api/tenant.settings'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/bun'

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

// Add authentication middleware to populate user context for audit logging
app.use('/api/*', async (c, next) => {
  const isTenant = c.get('isTenant')

  // Apply appropriate authentication middleware based on context
  if (isTenant) {
    return optionalTenantAuth(c, next)
  } else {
    return optionalCoreAuth(c, next)
  }
})

// Add mandatory audit middleware for SOC 2 compliance
// Exclude health checks and public endpoints
app.use('/api/*', async (c, next) => {
  const url = new URL(c.req.url)

  // Skip audit logging for health checks, public endpoints, and static assets
  const excludedPaths = ['/api/health', '/api/ping', '/api/docs', '/api/openapi']

  const shouldSkipAudit = excludedPaths.some(path => url.pathname.startsWith(path))

  if (shouldSkipAudit) {
    await next()
    return
  }

  // Apply audit middleware for all other API endpoints
  const isTenant = c.get('isTenant')
  const tenantDatabase = c.get('tenantDatabase')

  return AuditService.createAuditMiddleware(isTenant ? tenantDatabase : undefined)(c, next)
})

// Static file serving for uploads
app.use('/uploads/*', serveStatic({ root: './public' }))

// API Routes following BetterNews pattern exactly
const routes = app
  .basePath('/api')
  .route('/auth', coreAuthRoutes)
  .route('/tenants', coreTenantsRoutes)
  .route('/settings', coreSettingsRoutes)
  .route('/rbac', coreRBACRoutes)
  .route('/upload', coreUploadRoutes)
  .route('/export', coreExportRoutes)
  .route('/import', coreImportRoutes)
  .route('/inquiry', inquiryRoutes)
  .route('/pricing', pricingRouter)
  .route('/services', servicesRouter)
  .route('/tenant-auth', tenantAuthRoutes)
  .route('/tenant-rbac', tenantRBACRoutes)
  .route('/tenant-settings', tenantSettingsRoutes)
  .route('/products', productRoutes)

export type AppType = typeof routes

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
