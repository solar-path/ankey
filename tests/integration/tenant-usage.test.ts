import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { tenantUsageRoutes } from '@/api/controllers/tenant/usage.hono'
import { createAuthenticatedSession, authenticatedRequest, useIntegrationTest } from './api-test-helper'
import { createTestUsers, createTestCompanies } from '../fixtures/database'

describe('Tenant Usage API', () => {
  useIntegrationTest()

  let app: Hono
  let session: Awaited<ReturnType<typeof createAuthenticatedSession>>

  beforeEach(async () => {
    app = new Hono().route('/api/tenant-usage', tenantUsageRoutes)
    session = await createAuthenticatedSession(app)
  })

  describe('GET /api/tenant-usage', () => {
    it('should return complete usage information', async () => {
      // Create some test data
      await createTestUsers(2) // 3 total including session user
      await createTestCompanies(2, session.user.id)
      
      const req = authenticatedRequest(app, session)
      const response = await req.get('/api/tenant-usage')
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      
      const data = response.body.data
      expect(data.users).toBeDefined()
      expect(data.companies).toBeDefined()
      expect(data.summary).toBeDefined()
      
      // Check user usage
      expect(data.users.current).toBe(3)
      expect(data.users.max).toBe(5)
      expect(data.users.remaining).toBe(2)
      expect(data.users.canAdd).toBe(true)
      expect(data.users.usagePercent).toBe(60) // 3/5 = 60%
      
      // Check company usage
      expect(data.companies.current).toBe(2)
      expect(data.companies.max).toBe(3)
      expect(data.companies.remaining).toBe(1)
      expect(data.companies.canAdd).toBe(true)
      expect(data.companies.usagePercent).toBe(67) // 2/3 = 67% (rounded)
    })

    it('should handle empty workspace', async () => {
      const req = authenticatedRequest(app, session)
      const response = await req.get('/api/tenant-usage')
      
      expect(response.status).toBe(200)
      const data = response.body.data
      
      expect(data.users.current).toBe(1) // Just the session user
      expect(data.users.usagePercent).toBe(20) // 1/5 = 20%
      expect(data.companies.current).toBe(0)
      expect(data.companies.usagePercent).toBe(0)
    })

    it('should handle usage at limits', async () => {
      // Fill to capacity
      await createTestUsers(4) // 5 total including session user
      await createTestCompanies(3, session.user.id)
      
      const req = authenticatedRequest(app, session)
      const response = await req.get('/api/tenant-usage')
      
      expect(response.status).toBe(200)
      const data = response.body.data
      
      expect(data.users.current).toBe(5)
      expect(data.users.remaining).toBe(0)
      expect(data.users.canAdd).toBe(false)
      expect(data.users.usagePercent).toBe(100)
      
      expect(data.companies.current).toBe(3)
      expect(data.companies.remaining).toBe(0)
      expect(data.companies.canAdd).toBe(false)
      expect(data.companies.usagePercent).toBe(100)
    })

    it('should require authentication', async () => {
      const response = await app.request('/api/tenant-usage')
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/tenant-usage/validate', () => {
    it('should validate ADD_USER operation when under limit', async () => {
      const req = authenticatedRequest(app, session)
      
      const response = await req.post('/api/tenant-usage/validate')
        .send({ operation: 'ADD_USER' })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.allowed).toBe(true)
      expect(response.body.reason).toBeUndefined()
    })

    it('should validate ADD_USER operation when at limit', async () => {
      // Fill to capacity
      await createTestUsers(4) // 5 total including session user
      
      const req = authenticatedRequest(app, session)
      const response = await req.post('/api/tenant-usage/validate')
        .send({ operation: 'ADD_USER' })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(false)
      expect(response.body.allowed).toBe(false)
      expect(response.body.reason).toContain('User limit reached')
    })

    it('should validate ADD_COMPANY operation when under limit', async () => {
      const req = authenticatedRequest(app, session)
      
      const response = await req.post('/api/tenant-usage/validate')
        .send({ operation: 'ADD_COMPANY' })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.allowed).toBe(true)
      expect(response.body.reason).toBeUndefined()
    })

    it('should validate ADD_COMPANY operation when at limit', async () => {
      // Fill to capacity
      await createTestCompanies(3, session.user.id)
      
      const req = authenticatedRequest(app, session)
      const response = await req.post('/api/tenant-usage/validate')
        .send({ operation: 'ADD_COMPANY' })
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(false)
      expect(response.body.allowed).toBe(false)
      expect(response.body.reason).toContain('Company limit reached')
    })

    it('should reject invalid operations', async () => {
      const req = authenticatedRequest(app, session)
      
      const response = await req.post('/api/tenant-usage/validate')
        .send({ operation: 'INVALID_OPERATION' })
      
      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid operation')
    })

    it('should require operation parameter', async () => {
      const req = authenticatedRequest(app, session)
      
      const response = await req.post('/api/tenant-usage/validate')
        .send({}) // No operation
      
      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Invalid operation')
    })

    it('should handle edge case scenarios', async () => {
      const req = authenticatedRequest(app, session)
      
      // Fill users to capacity but leave companies under limit
      await createTestUsers(4) // 5 total
      await createTestCompanies(1, session.user.id) // 1 out of 3
      
      // Should allow company but not user
      const userResponse = await req.post('/api/tenant-usage/validate')
        .send({ operation: 'ADD_USER' })
      expect(userResponse.body.allowed).toBe(false)
      
      const companyResponse = await req.post('/api/tenant-usage/validate')
        .send({ operation: 'ADD_COMPANY' })
      expect(companyResponse.body.allowed).toBe(true)
    })
  })

  describe('performance and edge cases', () => {
    it('should handle rapid successive requests', async () => {
      const req = authenticatedRequest(app, session)
      
      // Make multiple rapid requests
      const promises = Array(5).fill(0).map(() => 
        req.get('/api/tenant-usage')
      )
      
      const responses = await Promise.all(promises)
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
      })
    })

    it('should maintain consistency during concurrent operations', async () => {
      const req = authenticatedRequest(app, session)
      
      // Make concurrent validation requests
      const promises = [
        req.post('/api/tenant-usage/validate').send({ operation: 'ADD_USER' }),
        req.post('/api/tenant-usage/validate').send({ operation: 'ADD_COMPANY' }),
        req.get('/api/tenant-usage'),
      ]
      
      const responses = await Promise.all(promises)
      
      // All should succeed and be consistent
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })
})