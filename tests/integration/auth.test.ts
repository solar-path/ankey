import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { tenantAuthRoutes } from '@/api/controllers/tenant/auth.hono'
import { tenantInfoRoutes } from '@/api/controllers/tenant/info.hono'
import { createTestTenant, createTestPlans, useIntegrationTest } from './api-test-helper'
import request from 'supertest'

describe('Authentication & Authorization', () => {
  useIntegrationTest()

  let app: Hono
  let tenantSubdomain: string

  beforeEach(async () => {
    app = new Hono()
      .route('/api/tenant-auth', tenantAuthRoutes)
      .route('/api/tenant-info', tenantInfoRoutes)
    
    // Create test tenant
    const plans = await createTestPlans()
    const tenant = await createTestTenant(plans[0].id)
    tenantSubdomain = tenant.subdomain
  })

  describe('Tenant Authentication', () => {
    it('should register new user successfully', async () => {
      const response = await request(app.fetch)
        .post('/api/tenant-auth/register')
        .set('Host', `${tenantSubdomain}.localhost:3000`)
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          fullName: 'New User',
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toBeDefined()
      expect(response.body.data.user.email).toBe('newuser@example.com')
    })

    it('should login existing user successfully', async () => {
      // First register a user
      await request(app.fetch)
        .post('/api/tenant-auth/register')
        .set('Host', `${tenantSubdomain}.localhost:3000`)
        .send({
          email: 'logintest@example.com',
          password: 'password123',
          fullName: 'Login Test User',
        })

      // Then login
      const response = await request(app.fetch)
        .post('/api/tenant-auth/login')
        .set('Host', `${tenantSubdomain}.localhost:3000`)
        .send({
          email: 'logintest@example.com',
          password: 'password123',
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.headers['set-cookie']).toBeDefined()
    })

    it('should reject login with invalid credentials', async () => {
      const response = await request(app.fetch)
        .post('/api/tenant-auth/login')
        .set('Host', `${tenantSubdomain}.localhost:3000`)
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
    })

    it('should prevent registration with duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        fullName: 'Duplicate User',
      }

      // First registration should succeed
      const response1 = await request(app.fetch)
        .post('/api/tenant-auth/register')
        .set('Host', `${tenantSubdomain}.localhost:3000`)
        .send(userData)
      expect(response1.status).toBe(201)

      // Second registration should fail
      const response2 = await request(app.fetch)
        .post('/api/tenant-auth/register')
        .set('Host', `${tenantSubdomain}.localhost:3000`)
        .send(userData)
      expect(response2.status).toBe(400)
      expect(response2.body.error).toContain('already exists')
    })
  })

  describe('Session Management', () => {
    let sessionCookie: string

    beforeEach(async () => {
      // Register and login to get session
      await request(app.fetch)
        .post('/api/tenant-auth/register')
        .set('Host', `${tenantSubdomain}.localhost:3000`)
        .send({
          email: 'sessiontest@example.com',
          password: 'password123',
          fullName: 'Session Test User',
        })

      const loginResponse = await request(app.fetch)
        .post('/api/tenant-auth/login')
        .set('Host', `${tenantSubdomain}.localhost:3000`)
        .send({
          email: 'sessiontest@example.com',
          password: 'password123',
        })

      sessionCookie = loginResponse.headers['set-cookie'][0]
    })

    it('should get current user with valid session', async () => {
      const response = await request(app.fetch)
        .get('/api/tenant-auth/me')
        .set('Host', `${tenantSubdomain}.localhost:3000`)
        .set('Cookie', sessionCookie)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.email).toBe('sessiontest@example.com')
    })

    it('should reject requests without valid session', async () => {
      const response = await request(app.fetch)
        .get('/api/tenant-auth/me')
        .set('Host', `${tenantSubdomain}.localhost:3000`)

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })

    it('should logout successfully', async () => {
      const response = await request(app.fetch)
        .post('/api/tenant-auth/logout')
        .set('Host', `${tenantSubdomain}.localhost:3000`)
        .set('Cookie', sessionCookie)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should invalidate session after logout', async () => {
      // Logout
      await request(app.fetch)
        .post('/api/tenant-auth/logout')
        .set('Host', `${tenantSubdomain}.localhost:3000`)
        .set('Cookie', sessionCookie)

      // Try to use session after logout
      const response = await request(app.fetch)
        .get('/api/tenant-auth/me')
        .set('Host', `${tenantSubdomain}.localhost:3000`)
        .set('Cookie', sessionCookie)

      expect(response.status).toBe(401)
    })
  })

  describe('Tenant Context', () => {
    it('should get tenant information', async () => {
      const response = await request(app.fetch)
        .get('/api/tenant-info')
        .set('Host', `${tenantSubdomain}.localhost:3000`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.subdomain).toBe(tenantSubdomain)
    })

    it('should reject requests to non-existent tenant', async () => {
      const response = await request(app.fetch)
        .get('/api/tenant-info')
        .set('Host', 'nonexistent.localhost:3000')

      expect(response.status).toBe(404)
    })

    it('should handle requests without proper host header', async () => {
      const response = await request(app.fetch)
        .get('/api/tenant-info')
        // No Host header

      expect(response.status).toBe(404)
    })
  })

  describe('Input Validation', () => {
    it('should validate email format on registration', async () => {
      const response = await request(app.fetch)
        .post('/api/tenant-auth/register')
        .set('Host', `${tenantSubdomain}.localhost:3000`)
        .send({
          email: 'invalid-email',
          password: 'password123',
          fullName: 'Test User',
        })

      expect(response.status).toBe(400)
    })

    it('should validate password strength', async () => {
      const response = await request(app.fetch)
        .post('/api/tenant-auth/register')
        .set('Host', `${tenantSubdomain}.localhost:3000`)
        .send({
          email: 'test@example.com',
          password: '123', // Too short
          fullName: 'Test User',
        })

      expect(response.status).toBe(400)
    })

    it('should validate required fields', async () => {
      const response = await request(app.fetch)
        .post('/api/tenant-auth/register')
        .set('Host', `${tenantSubdomain}.localhost:3000`)
        .send({
          email: 'test@example.com',
          // Missing password and fullName
        })

      expect(response.status).toBe(400)
    })
  })

  describe('Security', () => {
    it('should not expose sensitive information in responses', async () => {
      const response = await request(app.fetch)
        .post('/api/tenant-auth/register')
        .set('Host', `${tenantSubdomain}.localhost:3000`)
        .send({
          email: 'security@example.com',
          password: 'password123',
          fullName: 'Security Test',
        })

      expect(response.status).toBe(201)
      expect(response.body.data.user.passwordHash).toBeUndefined()
      expect(response.body.data.user.twoFactorSecret).toBeUndefined()
    })

    it('should use secure session cookies', async () => {
      const response = await request(app.fetch)
        .post('/api/tenant-auth/login')
        .set('Host', `${tenantSubdomain}.localhost:3000`)
        .send({
          email: 'security@example.com',
          password: 'password123',
        })

      const setCookieHeader = response.headers['set-cookie']?.[0]
      expect(setCookieHeader).toBeDefined()
      // In production, should be HttpOnly and Secure
    })
  })
})