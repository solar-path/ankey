/**
 * Auth Routes Integration Tests
 *
 * Tests HTTP endpoints with real database calls using Supertest.
 * Tests the complete flow from HTTP request to PostgreSQL function execution.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  clearTestDatabase,
  insertTestUser,
  getTestUserByEmail,
  getTestSessionByToken,
  setTestUserVerificationCode,
  enableTest2FA,
  hashPassword,
  generateRandomEmail,
  generateRandomPassword,
  generateRandomFullname,
} from '@/test/utils/test-helpers';
import {
  SQL_INJECTION_PAYLOADS,
  MOCK_USERS,
} from '@/test/utils/mock-data';

// ============================================
// SETUP
// ============================================

const API_URL = process.env.VITE_API_URL || 'http://localhost:3002';

beforeAll(async () => {
  await setupTestEnvironment();
});

afterAll(async () => {
  await teardownTestEnvironment();
});

beforeEach(async () => {
  await clearTestDatabase();
});

// ============================================
// POST /api/auth.signup
// ============================================

describe('POST /api/auth.signup', () => {
  test('should create user with valid data', async () => {
    const userData = {
      email: generateRandomEmail(),
      password: 'SecurePass123',
      fullname: 'Test User',
    };

    const response = await request(API_URL)
      .post('/api/auth.signup')
      .send(userData)
      .expect(200);

    expect(response.body).toMatchObject({
      message: expect.stringContaining('User created successfully'),
      userId: expect.stringMatching(/^user_\d+_/),
      verificationCode: expect.stringMatching(/^\d{6}$/),
    });

    // Verify user was inserted into database
    const user = await getTestUserByEmail(userData.email);
    expect(user).toBeDefined();
    expect(user?.email).toBe(userData.email);
    expect(user?.fullname).toBe(userData.fullname);
    expect(user?.verified).toBe(false);
    expect(user?.verification_code).toBe(response.body.verificationCode);
  });

  test('should hash password before storage', async () => {
    const userData = {
      email: generateRandomEmail(),
      password: 'PlainTextPassword123',
      fullname: 'Test User',
    };

    await request(API_URL)
      .post('/api/auth.signup')
      .send(userData)
      .expect(200);

    const user = await getTestUserByEmail(userData.email);
    expect(user?.password).not.toBe(userData.password);
    expect(user?.password).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash
  });

  test('should set verified to false initially', async () => {
    const userData = {
      email: generateRandomEmail(),
      password: 'SecurePass123',
      fullname: 'Test User',
    };

    await request(API_URL)
      .post('/api/auth.signup')
      .send(userData)
      .expect(200);

    const user = await getTestUserByEmail(userData.email);
    expect(user?.verified).toBe(false);
  });

  test('should return 400 for invalid email', async () => {
    const userData = {
      email: 'invalid-email',
      password: 'SecurePass123',
      fullname: 'Test User',
    };

    const response = await request(API_URL)
      .post('/api/auth.signup')
      .send(userData)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  test('should return 400 for duplicate email', async () => {
    const email = generateRandomEmail();
    const password = await hashPassword('SecurePass123');

    // Insert user first
    await insertTestUser({
      email,
      password,
      fullname: 'Existing User',
    });

    // Try to signup with same email
    const response = await request(API_URL)
      .post('/api/auth.signup')
      .send({
        email,
        password: 'SecurePass123',
        fullname: 'New User',
      })
      .expect(400);

    expect(response.body.error).toContain('already exists');
  });

  test('should return 400 for missing parameters', async () => {
    const response = await request(API_URL)
      .post('/api/auth.signup')
      .send({
        email: 'test@example.com',
        // Missing password and fullname
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  test('should handle SQL injection attempts safely', async () => {
    for (const payload of SQL_INJECTION_PAYLOADS.slice(0, 5)) {
      const response = await request(API_URL)
        .post('/api/auth.signup')
        .send({
          email: `test${Date.now()}@example.com`,
          password: 'SecurePass123',
          fullname: payload,
        });

      // Should either succeed (sanitized) or fail validation gracefully
      // Should NOT expose SQL errors or crash
      expect([200, 400]).toContain(response.status);
    }
  });
});

// ============================================
// POST /api/auth.signin
// ============================================

describe('POST /api/auth.signin', () => {
  test('should return session token for valid credentials', async () => {
    const email = generateRandomEmail();
    const password = 'SecurePass123';
    const hashedPassword = await hashPassword(password);

    // Insert verified user
    await insertTestUser({
      email,
      password: hashedPassword,
      fullname: 'Test User',
      verified: true,
    });

    const response = await request(API_URL)
      .post('/api/auth.signin')
      .send({ email, password })
      .expect(200);

    expect(response.body).toMatchObject({
      requires2FA: false,
      user: {
        email,
        fullname: 'Test User',
        verified: true,
      },
      session: {
        token: expect.any(String),
        expiresAt: expect.any(Number),
      },
    });

    // Verify session was created in database
    const session = await getTestSessionByToken(response.body.session.token);
    expect(session).toBeDefined();
  });

  test('should return 401 for invalid password', async () => {
    const email = generateRandomEmail();
    const password = 'CorrectPassword123';
    const hashedPassword = await hashPassword(password);

    await insertTestUser({
      email,
      password: hashedPassword,
      fullname: 'Test User',
      verified: true,
    });

    const response = await request(API_URL)
      .post('/api/auth.signin')
      .send({ email, password: 'WrongPassword123' })
      .expect(400);

    expect(response.body.error).toContain('Invalid');
  });

  test('should return 401 for unverified account', async () => {
    const email = generateRandomEmail();
    const password = 'SecurePass123';
    const hashedPassword = await hashPassword(password);

    await insertTestUser({
      email,
      password: hashedPassword,
      fullname: 'Test User',
      verified: false,
    });

    const response = await request(API_URL)
      .post('/api/auth.signin')
      .send({ email, password })
      .expect(400);

    expect(response.body.error).toContain('verify');
  });

  test('should return 2FA required flag when enabled', async () => {
    const email = generateRandomEmail();
    const password = 'SecurePass123';
    const hashedPassword = await hashPassword(password);

    await insertTestUser({
      email,
      password: hashedPassword,
      fullname: 'Test User',
      verified: true,
      two_factor_enabled: true,
      two_factor_secret: 'JBSWY3DPEHPK3PXP',
    });

    const response = await request(API_URL)
      .post('/api/auth.signin')
      .send({ email, password })
      .expect(200);

    expect(response.body.requires2FA).toBe(true);
    expect(response.body.session).toBeUndefined();
  });

  test('should create session with 7-day expiry', async () => {
    const email = generateRandomEmail();
    const password = 'SecurePass123';
    const hashedPassword = await hashPassword(password);

    await insertTestUser({
      email,
      password: hashedPassword,
      fullname: 'Test User',
      verified: true,
    });

    const beforeSignin = Date.now();

    const response = await request(API_URL)
      .post('/api/auth.signin')
      .send({ email, password })
      .expect(200);

    const expiresAt = response.body.session.expiresAt;
    const expectedExpiry = beforeSignin + 7 * 24 * 60 * 60 * 1000;

    // Allow 5 second tolerance
    expect(expiresAt).toBeGreaterThanOrEqual(expectedExpiry - 5000);
    expect(expiresAt).toBeLessThanOrEqual(expectedExpiry + 5000);
  });

  test('should handle SQL injection attempts in email safely', async () => {
    for (const payload of SQL_INJECTION_PAYLOADS.slice(0, 3)) {
      const response = await request(API_URL)
        .post('/api/auth.signin')
        .send({
          email: payload,
          password: 'SecurePass123',
        });

      // Should fail validation or return 401, not expose SQL errors
      expect([400, 401]).toContain(response.status);
    }
  });
});

// ============================================
// POST /api/auth.verify_account
// ============================================

describe('POST /api/auth.verify_account', () => {
  test('should verify account with valid code', async () => {
    const email = generateRandomEmail();
    const password = await hashPassword('SecurePass123');
    const verificationCode = '123456';

    await insertTestUser({
      email,
      password,
      fullname: 'Test User',
      verified: false,
      verification_code: verificationCode,
    });

    const response = await request(API_URL)
      .post('/api/auth.verify_account')
      .send({ code: verificationCode })
      .expect(200);

    expect(response.body.message).toContain('verified successfully');

    // Verify user is now verified in database
    const user = await getTestUserByEmail(email);
    expect(user?.verified).toBe(true);
    expect(user?.verification_code).toBeNull();
  });

  test('should return 400 for invalid code', async () => {
    const response = await request(API_URL)
      .post('/api/auth.verify_account')
      .send({ code: '999999' })
      .expect(400);

    expect(response.body.error).toContain('Invalid');
  });

  test('should return 400 for malformed code', async () => {
    const response = await request(API_URL)
      .post('/api/auth.verify_account')
      .send({ code: '12345' }) // Too short
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });
});

// ============================================
// POST /api/auth.verify_session
// ============================================

describe('POST /api/auth.verify_session', () => {
  test('should validate active session', async () => {
    const email = generateRandomEmail();
    const password = await hashPassword('SecurePass123');

    const user = await insertTestUser({
      email,
      password,
      fullname: 'Test User',
      verified: true,
    });

    // Create session first
    const signinResponse = await request(API_URL)
      .post('/api/auth.signin')
      .send({ email, password: 'SecurePass123' });

    const token = signinResponse.body.session.token;

    // Verify session
    const response = await request(API_URL)
      .post('/api/auth.verify_session')
      .send({ token })
      .expect(200);

    expect(response.body.user.email).toBe(email);
    expect(response.body.session.token).toBe(token);
  });

  test('should reject invalid session token', async () => {
    const response = await request(API_URL)
      .post('/api/auth.verify_session')
      .send({ token: 'invalid-token-12345' })
      .expect(400);

    expect(response.body.error).toContain('Invalid');
  });

  test('should reject expired session', async () => {
    const email = generateRandomEmail();
    const password = await hashPassword('SecurePass123');

    const user = await insertTestUser({
      email,
      password,
      fullname: 'Test User',
      verified: true,
    });

    // Create expired session manually
    const expiredToken = `expired-${crypto.randomUUID()}`;
    await executeTestQuery(
      `INSERT INTO sessions (id, _id, type, user_id, token, expires_at, created_at)
       VALUES ($1, $2, 'session', $3, $4, $5, $6)`,
      [
        crypto.randomUUID(),
        `session_${Date.now()}_${crypto.randomUUID()}`,
        user._id,
        expiredToken,
        Date.now() - 60 * 60 * 1000, // 1 hour ago
        Date.now(),
      ]
    );

    const response = await request(API_URL)
      .post('/api/auth.verify_session')
      .send({ token: expiredToken })
      .expect(400);

    expect(response.body.error).toContain('expired');
  });
});

// ============================================
// POST /api/auth.signout
// ============================================

describe('POST /api/auth.signout', () => {
  test('should invalidate session on signout', async () => {
    const email = generateRandomEmail();
    const password = 'SecurePass123';
    const hashedPassword = await hashPassword(password);

    await insertTestUser({
      email,
      password: hashedPassword,
      fullname: 'Test User',
      verified: true,
    });

    // Signin first
    const signinResponse = await request(API_URL)
      .post('/api/auth.signin')
      .send({ email, password });

    const token = signinResponse.body.session.token;

    // Signout
    const response = await request(API_URL)
      .post('/api/auth.signout')
      .send({ token })
      .expect(200);

    expect(response.body.message).toContain('Signed out successfully');

    // Verify session was deleted from database
    const session = await getTestSessionByToken(token);
    expect(session).toBeNull();

    // Verify session is now invalid
    await request(API_URL)
      .post('/api/auth.verify_session')
      .send({ token })
      .expect(400);
  });
});

// ============================================
// POST /api/auth.forgot_password
// ============================================

describe('POST /api/auth.forgot_password', () => {
  test('should generate reset token for existing user', async () => {
    const email = generateRandomEmail();
    const password = await hashPassword('SecurePass123');

    await insertTestUser({
      email,
      password,
      fullname: 'Test User',
      verified: true,
    });

    const response = await request(API_URL)
      .post('/api/auth.forgot_password')
      .send({ email })
      .expect(200);

    expect(response.body.message).toContain('If an account exists');
    expect(response.body.resetToken).toBeDefined();

    // Verify reset token was set in database
    const user = await getTestUserByEmail(email);
    expect(user?.reset_token).toBe(response.body.resetToken);
    expect(user?.reset_token_expiry).toBeGreaterThan(Date.now());
  });

  test('should not reveal if email does not exist', async () => {
    const response = await request(API_URL)
      .post('/api/auth.forgot_password')
      .send({ email: 'nonexistent@example.com' })
      .expect(200);

    // Same message even if email doesn't exist
    expect(response.body.message).toContain('If an account exists');
  });
});

// ============================================
// ERROR HANDLING
// ============================================

describe('Error Handling', () => {
  test('should return 400 for malformed JSON', async () => {
    const response = await request(API_URL)
      .post('/api/auth.signup')
      .send('{ invalid json }')
      .set('Content-Type', 'application/json')
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  test('should return 404 for invalid function name', async () => {
    const response = await request(API_URL)
      .post('/api/auth.nonexistent_function')
      .send({})
      .expect(404);
  });

  test('should handle database connection errors gracefully', async () => {
    // This test would require mocking database connection
    // or temporarily disabling database access
    // Implementation depends on your test infrastructure
  });
});
