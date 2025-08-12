import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { tenantCompaniesRoutes } from '@/api/controllers/tenant/companies.hono'
import {
  createAuthenticatedSession,
  authenticatedRequest,
  unauthenticatedRequest,
  useIntegrationTest,
} from './api-test-helper'
import { createTestCompanies } from '../fixtures/database'

describe('Tenant Companies API', () => {
  useIntegrationTest()

  let app: Hono
  let session: Awaited<ReturnType<typeof createAuthenticatedSession>>

  beforeEach(async () => {
    app = new Hono().route('/api/tenant-companies', tenantCompaniesRoutes)
    session = await createAuthenticatedSession(app)
  })

  describe('GET /api/tenant-companies', () => {
    it('should return all companies in workspace', async () => {
      // Create some test companies
      await createTestCompanies(2, session.user.id)

      const req = authenticatedRequest(app, session)
      const response = await req.get('/api/tenant-companies')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBe(2)
    })

    it('should require authentication', async () => {
      const req = unauthenticatedRequest(app)

      const response = await req.get('/api/tenant-companies')

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/tenant-companies', () => {
    it('should create new company when under limit', async () => {
      const req = authenticatedRequest(app, session)

      const companyData = {
        name: 'Test Company',
        code: 'TEST',
        description: 'A test company',
        email: 'test@company.com',
        industry: 'Technology',
        size: 'medium',
      }

      const response = await req.post('/api/tenant-companies').send(companyData)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('Test Company')
      expect(response.body.data.code).toBe('TEST')
      expect(response.body.data.createdBy).toBe(session.user.id)
    })

    it('should prevent creating when at company limit', async () => {
      const req = authenticatedRequest(app, session)

      // Create companies up to the limit (3 for micro plan)
      await createTestCompanies(3, session.user.id)

      const companyData = {
        name: 'Over Limit Company',
        code: 'OVERLIMIT',
      }

      const response = await req.post('/api/tenant-companies').send(companyData)

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Company limit reached')
      expect(response.body.error).toContain('maximum 3 companies')
    })

    it('should prevent duplicate company codes', async () => {
      const req = authenticatedRequest(app, session)

      const companyData = {
        name: 'Duplicate Code Company',
        code: 'DUPLICATE',
      }

      // First company should succeed
      const response1 = await req.post('/api/tenant-companies').send(companyData)
      expect(response1.status).toBe(201)

      // Second company with same code should fail
      const response2 = await req.post('/api/tenant-companies').send({
        name: 'Another Company',
        code: 'DUPLICATE',
      })
      expect(response2.status).toBe(400)
      expect(response2.body.error).toContain('already exists')
    })

    it('should validate required fields', async () => {
      const req = authenticatedRequest(app, session)

      const response = await req.post('/api/tenant-companies').send({}) // Empty payload

      expect(response.status).toBe(400)
    })

    it('should validate email format', async () => {
      const req = authenticatedRequest(app, session)

      const response = await req.post('/api/tenant-companies').send({
        name: 'Test Company',
        email: 'invalid-email',
      })

      expect(response.status).toBe(400)
    })

    it('should validate website URL format', async () => {
      const req = authenticatedRequest(app, session)

      const response = await req.post('/api/tenant-companies').send({
        name: 'Test Company',
        website: 'not-a-url',
      })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/tenant-companies/:id', () => {
    it('should return company details', async () => {
      const companies = await createTestCompanies(1, session.user.id)
      const req = authenticatedRequest(app, session)

      const response = await req.get(`/api/tenant-companies/${companies[0].id}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(companies[0].id)
      expect(response.body.data.name).toBe(companies[0].name)
    })

    it('should return 404 for non-existent company', async () => {
      const req = authenticatedRequest(app, session)

      const response = await req.get('/api/tenant-companies/non-existent-id')

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /api/tenant-companies/:id', () => {
    it('should update company details', async () => {
      const companies = await createTestCompanies(1, session.user.id)
      const req = authenticatedRequest(app, session)

      const updateData = {
        name: 'Updated Company Name',
        description: 'Updated description',
        industry: 'Finance',
      }

      const response = await req.put(`/api/tenant-companies/${companies[0].id}`).send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('Updated Company Name')
      expect(response.body.data.industry).toBe('Finance')
    })

    it('should prevent duplicate codes when updating', async () => {
      const companies = await createTestCompanies(2, session.user.id)
      const req = authenticatedRequest(app, session)

      // Try to update second company with first company's code
      const response = await req.put(`/api/tenant-companies/${companies[1].id}`).send({
        code: companies[0].name.replace(' ', '').toUpperCase(), // TEST0
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('already exists')
    })
  })

  describe('DELETE /api/tenant-companies/:id', () => {
    it('should deactivate company', async () => {
      const companies = await createTestCompanies(1, session.user.id)
      const req = authenticatedRequest(app, session)

      const response = await req.delete(`/api/tenant-companies/${companies[0].id}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('deactivated')
    })

    it('should return 404 for non-existent company', async () => {
      const req = authenticatedRequest(app, session)

      const response = await req.delete('/api/tenant-companies/non-existent-id')

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/tenant-companies/:id/users', () => {
    it('should add user to company', async () => {
      const companies = await createTestCompanies(1, session.user.id)
      const req = authenticatedRequest(app, session)

      const userData = {
        userId: session.user.id,
        role: 'admin',
        isPrimary: true,
      }

      const response = await req
        .post(`/api/tenant-companies/${companies[0].id}/users`)
        .send(userData)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.userId).toBe(session.user.id)
      expect(response.body.data.role).toBe('admin')
    })

    it('should prevent adding user twice to same company', async () => {
      const companies = await createTestCompanies(1, session.user.id)
      const req = authenticatedRequest(app, session)

      const userData = {
        userId: session.user.id,
        role: 'member',
      }

      // First addition should succeed
      const response1 = await req
        .post(`/api/tenant-companies/${companies[0].id}/users`)
        .send(userData)
      expect(response1.status).toBe(201)

      // Second addition should fail
      const response2 = await req
        .post(`/api/tenant-companies/${companies[0].id}/users`)
        .send(userData)
      expect(response2.status).toBe(400)
      expect(response2.body.error).toContain('already in this company')
    })
  })

  describe('DELETE /api/tenant-companies/:id/users/:userId', () => {
    it('should remove user from company', async () => {
      const companies = await createTestCompanies(1, session.user.id)
      const req = authenticatedRequest(app, session)

      // First add user to company
      await req.post(`/api/tenant-companies/${companies[0].id}/users`).send({
        userId: session.user.id,
        role: 'member',
      })

      // Then remove user
      const response = await req.delete(
        `/api/tenant-companies/${companies[0].id}/users/${session.user.id}`
      )

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('removed from company')
    })

    it('should return 404 for user not in company', async () => {
      const companies = await createTestCompanies(1, session.user.id)
      const req = authenticatedRequest(app, session)

      const response = await req.delete(
        `/api/tenant-companies/${companies[0].id}/users/${session.user.id}`
      )

      expect(response.status).toBe(404)
      expect(response.body.error).toContain('not found in company')
    })
  })

  describe('GET /api/tenant-companies/usage/limits', () => {
    it('should return current company usage limits', async () => {
      await createTestCompanies(2, session.user.id)

      const req = authenticatedRequest(app, session)
      const response = await req.get('/api/tenant-companies/usage/limits')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.companies).toBeDefined()
      expect(response.body.data.companies.current).toBe(2)
      expect(response.body.data.companies.max).toBe(3) // Micro plan limit
      expect(response.body.data.companies.remaining).toBe(1)
      expect(response.body.data.companies.canAdd).toBe(true)
    })

    it('should show no remaining when at limit', async () => {
      await createTestCompanies(3, session.user.id) // Max for micro plan

      const req = authenticatedRequest(app, session)
      const response = await req.get('/api/tenant-companies/usage/limits')

      expect(response.status).toBe(200)
      expect(response.body.data.companies.current).toBe(3)
      expect(response.body.data.companies.remaining).toBe(0)
      expect(response.body.data.companies.canAdd).toBe(false)
    })
  })
})
