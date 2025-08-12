import { Hono } from 'hono'
import request from 'supertest'
import { useDatabaseTest, createTestTenant, createTestPlans } from '../fixtures/database'
import { TenantAuthService } from '@/api/auth.settings'

export interface TestSession {
  sessionCookie: string
  user: {
    id: string
    email: string
    fullName: string
  }
  tenant: {
    id: string
    name: string
    subdomain: string
    database: string
  }
}

/**
 * Helper to create authenticated test session
 */
export async function createAuthenticatedSession(app: Hono): Promise<TestSession> {
  // Create test plans and tenant
  const plans = await createTestPlans()
  const microPlan = plans.find(p => p.name === 'Test Micro')!
  const tenant = await createTestTenant(microPlan.id)

  // Create test user in tenant database
  const authService = new TenantAuthService(tenant.database)
  
  const userResult = await authService.register({
    email: 'test@example.com',
    password: 'password123',
    fullName: 'Test User',
  })

  if (!userResult.success || !userResult.data) {
    throw new Error('Failed to create test user')
  }

  const user = userResult.data.user
  const sessionCookie = userResult.data.sessionCookie

  return {
    sessionCookie,
    user,
    tenant,
  }
}

/**
 * Helper to make authenticated requests
 */
export function authenticatedRequest(
  app: Hono, 
  session: TestSession
) {
  return {
    get: (path: string) => 
      request(app.fetch)
        .get(path)
        .set('Host', `${session.tenant.subdomain}.localhost:3000`)
        .set('Cookie', session.sessionCookie),
    
    post: (path: string) => 
      request(app.fetch)
        .post(path)
        .set('Host', `${session.tenant.subdomain}.localhost:3000`)
        .set('Cookie', session.sessionCookie),
    
    put: (path: string) => 
      request(app.fetch)
        .put(path)
        .set('Host', `${session.tenant.subdomain}.localhost:3000`)
        .set('Cookie', session.sessionCookie),
    
    delete: (path: string) => 
      request(app.fetch)
        .delete(path)
        .set('Host', `${session.tenant.subdomain}.localhost:3000`)
        .set('Cookie', session.sessionCookie),
  }
}

/**
 * Helper to make unauthenticated requests (for testing auth failures)
 */
export function unauthenticatedRequest(app: Hono, tenantSubdomain: string = 'test-workspace') {
  return {
    get: (path: string) => 
      request(app.fetch)
        .get(path)
        .set('Host', `${tenantSubdomain}.localhost:3000`),
    
    post: (path: string) => 
      request(app.fetch)
        .post(path)
        .set('Host', `${tenantSubdomain}.localhost:3000`),
    
    put: (path: string) => 
      request(app.fetch)
        .put(path)
        .set('Host', `${tenantSubdomain}.localhost:3000`),
    
    delete: (path: string) => 
      request(app.fetch)
        .delete(path)
        .set('Host', `${tenantSubdomain}.localhost:3000`),
  }
}

/**
 * Database test setup for integration tests
 */
export function useIntegrationTest() {
  return useDatabaseTest()
}