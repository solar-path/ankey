import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { CoreAuthService } from '@/api/auth.settings'
import type { AuthContext } from './auth.types'

/**
 * Middleware to require core admin authentication
 * Validates session and sets user in context
 * Throws HTTPException if authentication fails
 */
export const requireCoreAuth = createMiddleware<AuthContext>(async (c, next) => {
  const authService = new CoreAuthService()
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
 * Middleware to optionally get core admin user if authenticated
 * Does not throw error if not authenticated, just sets user if available
 */
export const optionalCoreAuth = createMiddleware<AuthContext>(async (c, next) => {
  try {
    const authService = new CoreAuthService()
    const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

    if (sessionId) {
      const { session, user } = await authService.validateSession(sessionId)
      
      if (session && user) {
        c.set('user', user as any)
        c.set('sessionId', sessionId)
      }
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
    console.warn('Optional auth failed:', error)
  }

  await next()
})

/**
 * Utility middleware to check if current user exists
 * Use after optionalCoreAuth to enforce authentication
 */
export const requireLoggedIn = createMiddleware<AuthContext>(async (c, next) => {
  const user = c.get('user')
  
  if (!user) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  await next()
})