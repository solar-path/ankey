import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { TenantAuthService } from '@/api/auth.settings'
import type { AuthContext } from './auth.types'

/**
 * Middleware to require tenant user authentication
 * Validates session within tenant context and sets user in context
 * Throws HTTPException if authentication fails or tenant is not available
 */
export const requireTenantAuth = createMiddleware<AuthContext>(async (c, next) => {
  const tenantDatabase = c.get('tenantDatabase')

  if (!tenantDatabase) {
    throw new HTTPException(400, { message: 'Tenant database not found' })
  }

  const authService = new TenantAuthService(tenantDatabase)
  const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

  if (!sessionId) {
    throw new HTTPException(401, { message: 'Authentication required' })
  }

  const { session, user } = await authService.validateSession(sessionId)

  if (!session || !user) {
    throw new HTTPException(401, { message: 'Invalid session' })
  }

  // Set user and session in context for use in subsequent handlers
  c.set('user', user as any)
  c.set('sessionId', sessionId)

  await next()
})

/**
 * Middleware to optionally get tenant user if authenticated
 * Does not throw error if not authenticated, just sets user if available
 */
export const optionalTenantAuth = createMiddleware<AuthContext>(async (c, next) => {
  try {
    const tenantDatabase = c.get('tenantDatabase')

    if (tenantDatabase) {
      const authService = new TenantAuthService(tenantDatabase)
      const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

      if (sessionId) {
        const { session, user } = await authService.validateSession(sessionId)

        if (session && user) {
          c.set('user', user as any)
          c.set('sessionId', sessionId)
        }
      }
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
    console.warn('Optional tenant auth failed:', error)
  }

  await next()
})

/**
 * Utility middleware to check if current tenant user exists
 * Use after optionalTenantAuth to enforce authentication
 */
export const requireTenantLoggedIn = createMiddleware<AuthContext>(async (c, next) => {
  const user = c.get('user')
  const tenantDatabase = c.get('tenantDatabase')

  if (!tenantDatabase) {
    throw new HTTPException(400, { message: 'Tenant not found' })
  }

  if (!user) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  await next()
})
