import { CoreAuthService, createTenantAuth } from '@/api/auth.settings'
import { createMiddleware } from 'hono/factory'

const coreAuthService = new CoreAuthService()

// Middleware that requires core authentication
export const requireCoreAuth = createMiddleware(async (c, next) => {
  const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

  if (!sessionId) {
    return c.json({ success: false, error: 'Authentication required' }, 401)
  }

  const { session, user } = await coreAuthService.validateSession(sessionId)

  if (!session || !user) {
    return c.json({ success: false, error: 'Invalid session' }, 401)
  }

  // Set user and session in context for use by other middleware and routes
  c.set('user', user)
  c.set('session', session)
  c.set('sessionId', sessionId)

  await next()
})

// Middleware that optionally sets user if authenticated (doesn't block if not authenticated)
export const optionalCoreAuth = createMiddleware(async (c, next) => {
  const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

  if (sessionId) {
    try {
      const { session, user } = await coreAuthService.validateSession(sessionId)

      if (session && user) {
        c.set('user', user)
        c.set('session', session)
        c.set('sessionId', sessionId)
      }
    } catch (error) {
      console.error('Optional auth validation failed:', error)
      // Don't block the request, just continue without user context
    }
  }

  await next()
})

// Middleware that requires tenant authentication
export const requireTenantAuth = createMiddleware(async (c, next) => {
  const tenantDatabase = c.get('tenantDatabase')
  if (!tenantDatabase) {
    return c.json({ success: false, error: 'Tenant context required' }, 400)
  }

  const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

  if (!sessionId) {
    return c.json({ success: false, error: 'Authentication required' }, 401)
  }

  const tenantAuth = createTenantAuth(tenantDatabase)
  const { session, user } = await tenantAuth.validateSession(sessionId)

  if (!session || !user) {
    return c.json({ success: false, error: 'Invalid session' }, 401)
  }

  // Set user and session in context
  c.set('user', user)
  c.set('session', session)
  c.set('sessionId', sessionId)

  await next()
})

// Middleware that optionally sets tenant user if authenticated
export const optionalTenantAuth = createMiddleware(async (c, next) => {
  const tenantDatabase = c.get('tenantDatabase')
  if (!tenantDatabase) {
    await next()
    return
  }

  const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

  if (sessionId) {
    try {
      const tenantAuth = createTenantAuth(tenantDatabase)
      const { session, user } = await tenantAuth.validateSession(sessionId)

      if (session && user) {
        c.set('user', user)
        c.set('session', session)
        c.set('sessionId', sessionId)
      }
    } catch (error) {
      console.error('Optional tenant auth validation failed:', error)
      // Don't block the request, just continue without user context
    }
  }

  await next()
})
