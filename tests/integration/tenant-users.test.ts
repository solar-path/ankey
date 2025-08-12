import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { tenantUsersRoutes } from '@/api/controllers/tenant/users.hono'
import {
  createAuthenticatedSession,
  authenticatedRequest,
  unauthenticatedRequest,
  useIntegrationTest,
} from './api-test-helper'
import { createTestUsers } from '../fixtures/database'

describe('Tenant Users API', () => {
  useIntegrationTest()

  let app: Hono
  let session: Awaited<ReturnType<typeof createAuthenticatedSession>>

  beforeEach(async () => {
    app = new Hono().route('/api/tenant-users', tenantUsersRoutes)
    session = await createAuthenticatedSession(app)
  })

  describe('GET /api/tenant-users', () => {
    it('should return all users in workspace', async () => {
      const req = authenticatedRequest(app, session)

      const response = await req.get('/api/tenant-users')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0) // At least the test user
    })

    it('should require authentication', async () => {
      const req = unauthenticatedRequest(app)

      const response = await req.get('/api/tenant-users')

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/tenant-users/invite', () => {
    it('should invite new user when under limit', async () => {
      const req = authenticatedRequest(app, session)

      const inviteData = {
        email: 'newuser@example.com',
        fullName: 'New User',
        role: 'member',
      }

      const response = await req.post('/api/tenant-users/invite').send(inviteData)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.userId).toBeDefined()
      expect(response.body.data.inviteToken).toBeDefined()
    })

    it('should prevent inviting when at user limit', async () => {
      const req = authenticatedRequest(app, session)

      // Create users up to the limit (5 total, including the test user = 1)
      await createTestUsers(4)

      const inviteData = {
        email: 'overlimit@example.com',
        fullName: 'Over Limit User',
      }

      const response = await req.post('/api/tenant-users/invite').send(inviteData)

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('User limit reached')
      expect(response.body.error).toContain('maximum 5 users')
    })

    it('should prevent duplicate email invitations', async () => {
      const req = authenticatedRequest(app, session)

      const inviteData = {
        email: 'duplicate@example.com',
        fullName: 'Duplicate User',
      }

      // First invitation should succeed
      const response1 = await req.post('/api/tenant-users/invite').send(inviteData)
      expect(response1.status).toBe(201)

      // Second invitation should fail
      const response2 = await req.post('/api/tenant-users/invite').send(inviteData)
      expect(response2.status).toBe(400)
      expect(response2.body.error).toContain('already exists')
    })

    it('should validate required fields', async () => {
      const req = authenticatedRequest(app, session)

      const response = await req.post('/api/tenant-users/invite').send({}) // Empty payload

      expect(response.status).toBe(400)
    })

    it('should validate email format', async () => {
      const req = authenticatedRequest(app, session)

      const response = await req.post('/api/tenant-users/invite').send({
        email: 'invalid-email',
        fullName: 'Test User',
      })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/tenant-users/:id', () => {
    it('should return user details', async () => {
      const req = authenticatedRequest(app, session)

      const response = await req.get(`/api/tenant-users/${session.user.id}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(session.user.id)
      expect(response.body.data.email).toBe(session.user.email)
    })

    it('should return 404 for non-existent user', async () => {
      const req = authenticatedRequest(app, session)

      const response = await req.get('/api/tenant-users/non-existent-id')

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /api/tenant-users/:id', () => {
    it('should update user details', async () => {
      const req = authenticatedRequest(app, session)

      const updateData = {
        fullName: 'Updated Name',
        isActive: true,
      }

      const response = await req.put(`/api/tenant-users/${session.user.id}`).send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.fullName).toBe('Updated Name')
    })

    it('should return 404 for non-existent user', async () => {
      const req = authenticatedRequest(app, session)

      const response = await req
        .put('/api/tenant-users/non-existent-id')
        .send({ fullName: 'New Name' })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/tenant-users/:id', () => {
    it('should deactivate user', async () => {
      // Create another user to delete (can't delete self)
      const otherUsers = await createTestUsers(1)
      const req = authenticatedRequest(app, session)

      const response = await req.delete(`/api/tenant-users/${otherUsers[0].id}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('deactivated')
    })

    it('should prevent self-deletion', async () => {
      const req = authenticatedRequest(app, session)

      const response = await req.delete(`/api/tenant-users/${session.user.id}`)

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Cannot delete your own account')
    })

    it('should return 404 for non-existent user', async () => {
      const req = authenticatedRequest(app, session)

      const response = await req.delete('/api/tenant-users/non-existent-id')

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/tenant-users/usage/limits', () => {
    it('should return current usage limits', async () => {
      const req = authenticatedRequest(app, session)

      const response = await req.get('/api/tenant-users/usage/limits')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.users).toBeDefined()
      expect(response.body.data.users.current).toBeGreaterThan(0)
      expect(response.body.data.users.max).toBe(5) // Micro plan limit
      expect(response.body.data.users.canAdd).toBe(true)
    })

    it('should show accurate usage after adding users', async () => {
      // Add 3 more users (total will be 4 including test user)
      await createTestUsers(3)

      const req = authenticatedRequest(app, session)
      const response = await req.get('/api/tenant-users/usage/limits')

      expect(response.status).toBe(200)
      expect(response.body.data.users.current).toBe(4)
      expect(response.body.data.users.remaining).toBe(1)
      expect(response.body.data.users.canAdd).toBe(true)
    })

    it('should show no remaining when at limit', async () => {
      // Add 4 more users (total will be 5 including test user)
      await createTestUsers(4)

      const req = authenticatedRequest(app, session)
      const response = await req.get('/api/tenant-users/usage/limits')

      expect(response.status).toBe(200)
      expect(response.body.data.users.current).toBe(5)
      expect(response.body.data.users.remaining).toBe(0)
      expect(response.body.data.users.canAdd).toBe(false)
    })
  })
})
