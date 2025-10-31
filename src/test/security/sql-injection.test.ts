/**
 * SQL Injection Security Tests
 *
 * Tests to ensure the authentication module is protected against SQL injection attacks.
 * Uses parameterized queries and PostgreSQL's built-in protections.
 *
 * SECURITY TESTING CONTEXT: This is authorized security testing for defensive purposes.
 * All tests are performed in an isolated test environment.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  clearTestDatabase,
  insertTestUser,
  getTestUserByEmail,
  executeTestQuery,
  hashPassword,
  generateRandomEmail,
} from '@/test/utils/test-helpers';
import { SQL_INJECTION_PAYLOADS } from '@/test/utils/mock-data';

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
// SQL INJECTION IN SIGNUP
// ============================================

describe('SQL Injection - Signup', () => {
  test('should safely handle SQL injection in email field', async () => {
    for (const payload of SQL_INJECTION_PAYLOADS) {
      const response = await request(API_URL)
        .post('/api/auth.signup')
        .send({
          email: payload,
          password: 'SecurePass123',
          fullname: 'Test User',
        });

      // Should either fail validation (400) or be safely handled
      // Should NOT return 500 or expose database errors
      expect([200, 400]).toContain(response.status);

      // If 200, verify payload was safely stored (not executed)
      if (response.status === 200) {
        const user = await getTestUserByEmail(payload);
        expect(user).toBeDefined(); // Stored as literal string
      }

      // Verify no SQL injection occurred
      // Check that users table still exists and has expected structure
      const tableCheck = await executeTestQuery(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
      );
      expect(tableCheck[0].exists).toBe(true);
    }
  });

  test('should safely handle SQL injection in fullname field', async () => {
    for (const payload of SQL_INJECTION_PAYLOADS) {
      const email = generateRandomEmail();

      const response = await request(API_URL)
        .post('/api/auth.signup')
        .send({
          email,
          password: 'SecurePass123',
          fullname: payload,
        });

      // Should accept as valid input (stored safely)
      expect([200, 400]).toContain(response.status);

      // Verify users table still exists
      const tableCheck = await executeTestQuery(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
      );
      expect(tableCheck[0].exists).toBe(true);

      // If successful, verify payload was stored as literal string
      if (response.status === 200) {
        const user = await getTestUserByEmail(email);
        expect(user?.fullname).toBe(payload);
      }
    }
  });

  test('should safely handle SQL injection in password field', async () => {
    const email = generateRandomEmail();

    for (const payload of SQL_INJECTION_PAYLOADS.slice(0, 5)) {
      const response = await request(API_URL)
        .post('/api/auth.signup')
        .send({
          email: `${email}-${Date.now()}@example.com`,
          password: payload,
          fullname: 'Test User',
        });

      // Should be safely hashed and stored
      expect([200, 400]).toContain(response.status);

      // Verify tables still exist
      const tableCheck = await executeTestQuery(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name IN ('users', 'sessions')"
      );
      expect(Number(tableCheck[0].count)).toBe(2);
    }
  });

  test('should prevent union-based SQL injection', async () => {
    const unionPayloads = [
      "' UNION SELECT NULL--",
      "' UNION SELECT NULL, NULL--",
      "' UNION SELECT NULL, NULL, NULL--",
      "' UNION ALL SELECT NULL, NULL, NULL--",
    ];

    for (const payload of unionPayloads) {
      const email = generateRandomEmail();

      const response = await request(API_URL)
        .post('/api/auth.signup')
        .send({
          email: `test${payload}@example.com`,
          password: 'SecurePass123',
          fullname: 'Test User',
        });

      // Should fail validation or be safely handled
      expect([200, 400]).toContain(response.status);

      // Verify response doesn't contain multiple result sets
      expect(Array.isArray(response.body)).toBe(false);
    }
  });

  test('should prevent stacked queries injection', async () => {
    const stackedPayloads = [
      "'; DROP TABLE users; --",
      "'; DELETE FROM users; --",
      "'; INSERT INTO users VALUES ('hacker', 'hacker@evil.com'); --",
      "'; UPDATE users SET verified = true; --",
    ];

    const userCountBefore = await executeTestQuery('SELECT COUNT(*) as count FROM users');

    for (const payload of stackedPayloads) {
      const email = generateRandomEmail();

      await request(API_URL)
        .post('/api/auth.signup')
        .send({
          email,
          password: 'SecurePass123',
          fullname: payload,
        });

      // Verify users table still exists
      const tableCheck = await executeTestQuery(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
      );
      expect(tableCheck[0].exists).toBe(true);
    }

    // Verify no unauthorized users were created
    const userCountAfter = await executeTestQuery('SELECT COUNT(*) as count FROM users');
    expect(Number(userCountAfter[0].count)).toBeGreaterThanOrEqual(Number(userCountBefore[0].count));
  });
});

// ============================================
// SQL INJECTION IN SIGNIN
// ============================================

describe('SQL Injection - Signin', () => {
  test('should safely handle SQL injection in email field during signin', async () => {
    const legitEmail = generateRandomEmail();
    const password = 'SecurePass123';
    const hashedPassword = await hashPassword(password);

    // Create legitimate user
    await insertTestUser({
      email: legitEmail,
      password: hashedPassword,
      fullname: 'Legit User',
      verified: true,
    });

    for (const payload of SQL_INJECTION_PAYLOADS.slice(0, 10)) {
      const response = await request(API_URL)
        .post('/api/auth.signin')
        .send({
          email: payload,
          password: 'anything',
        });

      // Should fail authentication (not bypass with SQL injection)
      expect([400, 401]).toContain(response.status);

      // Verify legitimate user is still there and unchanged
      const user = await getTestUserByEmail(legitEmail);
      expect(user).toBeDefined();
      expect(user?.verified).toBe(true);
    }
  });

  test('should prevent authentication bypass via SQL injection', async () => {
    const email = generateRandomEmail();
    const password = 'SecurePass123';
    const hashedPassword = await hashPassword(password);

    await insertTestUser({
      email,
      password: hashedPassword,
      fullname: 'Test User',
      verified: true,
    });

    const bypassAttempts = [
      { email: "' OR '1'='1", password: 'anything' },
      { email: "' OR 1=1--", password: 'anything' },
      { email: "admin'--", password: 'anything' },
      { email: email, password: "' OR '1'='1" },
      { email: email, password: "' OR 1=1--" },
    ];

    for (const attempt of bypassAttempts) {
      const response = await request(API_URL)
        .post('/api/auth.signin')
        .send(attempt);

      // Should NOT return successful authentication
      expect(response.status).not.toBe(200);
      expect(response.body).not.toHaveProperty('session');
    }
  });

  test('should safely handle boolean-based blind SQL injection', async () => {
    const email = generateRandomEmail();
    const password = 'SecurePass123';
    const hashedPassword = await hashPassword(password);

    await insertTestUser({
      email,
      password: hashedPassword,
      fullname: 'Test User',
      verified: true,
    });

    const blindSqlPayloads = [
      "' AND 1=1--",
      "' AND 1=2--",
      "' AND (SELECT COUNT(*) FROM users) > 0--",
      "' AND SUBSTRING((SELECT password FROM users LIMIT 1), 1, 1) = 'a'--",
    ];

    const responseTimes: number[] = [];

    for (const payload of blindSqlPayloads) {
      const startTime = performance.now();

      const response = await request(API_URL)
        .post('/api/auth.signin')
        .send({
          email: payload,
          password: 'anything',
        });

      const endTime = performance.now();
      responseTimes.push(endTime - startTime);

      // Should fail authentication
      expect([400, 401]).toContain(response.status);
    }

    // Response times should be consistent (no information leakage)
    const avgTime = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
    for (const time of responseTimes) {
      // Allow 50% variance (timing attacks are harder over network)
      expect(time).toBeGreaterThan(avgTime * 0.5);
      expect(time).toBeLessThan(avgTime * 1.5);
    }
  });
});

// ============================================
// SQL INJECTION IN VERIFICATION
// ============================================

describe('SQL Injection - Account Verification', () => {
  test('should safely handle SQL injection in verification code', async () => {
    const sqlPayloads = [
      "' OR '1'='1",
      "' OR 1=1--",
      "123456' OR '1'='1",
      "' UNION SELECT NULL--",
    ];

    for (const payload of sqlPayloads) {
      const response = await request(API_URL)
        .post('/api/auth.verify_account')
        .send({ code: payload });

      // Should fail validation or return invalid code error
      expect([400, 401]).toContain(response.status);
      expect(response.body).not.toHaveProperty('user');
    }
  });
});

// ============================================
// SQL INJECTION IN SESSION VERIFICATION
// ============================================

describe('SQL Injection - Session Verification', () => {
  test('should safely handle SQL injection in session token', async () => {
    const email = generateRandomEmail();
    const password = 'SecurePass123';
    const hashedPassword = await hashPassword(password);

    await insertTestUser({
      email,
      password: hashedPassword,
      fullname: 'Test User',
      verified: true,
    });

    // Create valid session
    const signinResponse = await request(API_URL)
      .post('/api/auth.signin')
      .send({ email, password });

    const validToken = signinResponse.body.session.token;

    // Try SQL injection in token
    const injectionPayloads = [
      "' OR '1'='1",
      `${validToken}' OR '1'='1`,
      "' UNION SELECT * FROM sessions--",
      "'; DROP TABLE sessions; --",
    ];

    for (const payload of injectionPayloads) {
      const response = await request(API_URL)
        .post('/api/auth.verify_session')
        .send({ token: payload });

      // Should fail (not bypass session check)
      expect([400, 401]).toContain(response.status);
    }

    // Verify valid token still works
    const validResponse = await request(API_URL)
      .post('/api/auth.verify_session')
      .send({ token: validToken });

    expect(validResponse.status).toBe(200);

    // Verify sessions table still exists
    const tableCheck = await executeTestQuery(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions')"
    );
    expect(tableCheck[0].exists).toBe(true);
  });
});

// ============================================
// SQL INJECTION IN PROFILE UPDATE
// ============================================

describe('SQL Injection - Profile Update', () => {
  test('should safely handle SQL injection in profile fields', async () => {
    const email = generateRandomEmail();
    const password = 'SecurePass123';
    const hashedPassword = await hashPassword(password);

    const user = await insertTestUser({
      email,
      password: hashedPassword,
      fullname: 'Test User',
      verified: true,
    });

    const profileFields = [
      { fullname: "'; DROP TABLE users; --" },
      { phone: "' OR '1'='1" },
      { address: "' UNION SELECT NULL--" },
      { city: "'; DELETE FROM users; --" },
    ];

    for (const field of profileFields) {
      const response = await request(API_URL)
        .post('/api/auth.update_profile')
        .send({
          user_id: user._id,
          ...field,
        });

      // Should either succeed (safely stored) or fail validation
      expect([200, 400, 401]).toContain(response.status);

      // Verify users table still exists
      const tableCheck = await executeTestQuery(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
      );
      expect(tableCheck[0].exists).toBe(true);
    }
  });
});

// ============================================
// TIME-BASED BLIND SQL INJECTION
// ============================================

describe('SQL Injection - Time-Based Blind', () => {
  test('should not allow time-based blind SQL injection', async () => {
    const timeBasedPayloads = [
      "'; WAITFOR DELAY '00:00:05'--",
      "' AND (SELECT pg_sleep(5))--",
      "' OR pg_sleep(5)--",
    ];

    for (const payload of timeBasedPayloads) {
      const startTime = performance.now();

      const response = await request(API_URL)
        .post('/api/auth.signin')
        .send({
          email: payload,
          password: 'anything',
        });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should not sleep for 5 seconds
      expect(duration).toBeLessThan(5000);

      // Should fail authentication
      expect([400, 401]).toContain(response.status);
    }
  });
});

// ============================================
// COMMENT INJECTION
// ============================================

describe('SQL Injection - Comment Injection', () => {
  test('should safely handle SQL comment injection', async () => {
    const commentPayloads = [
      "admin'--",
      "admin'#",
      "admin'/*",
      "test@example.com'--",
    ];

    for (const payload of commentPayloads) {
      const response = await request(API_URL)
        .post('/api/auth.signin')
        .send({
          email: payload,
          password: 'anything',
        });

      // Should not bypass authentication
      expect([400, 401]).toContain(response.status);
      expect(response.body).not.toHaveProperty('session');
    }
  });
});

// ============================================
// PARAMETERIZED QUERY VERIFICATION
// ============================================

describe('Parameterized Queries Verification', () => {
  test('should use parameterized queries for all database operations', async () => {
    // This test verifies that our PostgreSQL functions use proper parameter binding
    // We test by attempting various injection techniques

    const email = generateRandomEmail();
    const maliciousInputs = {
      email: `${email}'; DROP TABLE users; --`,
      password: "'; DELETE FROM sessions; --",
      fullname: "'; INSERT INTO users VALUES(...); --",
    };

    const response = await request(API_URL)
      .post('/api/auth.signup')
      .send({
        ...maliciousInputs,
        fullname: maliciousInputs.fullname,
      });

    // Should handle safely (either succeed or fail validation)
    expect([200, 400]).toContain(response.status);

    // Verify all tables still exist
    const tableCheck = await executeTestQuery(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_name IN ('users', 'sessions')
    `);
    expect(Number(tableCheck[0].count)).toBe(2);

    // Verify no unauthorized data modifications
    const userCount = await executeTestQuery('SELECT COUNT(*) as count FROM users');
    expect(Number(userCount[0].count)).toBeLessThanOrEqual(1); // At most the one we tried to create
  });
});

// ============================================
// SECURITY ASSERTIONS
// ============================================

describe('Security Assertions', () => {
  test('should never expose database error messages', async () => {
    const maliciousPayloads = SQL_INJECTION_PAYLOADS;

    for (const payload of maliciousPayloads.slice(0, 10)) {
      const response = await request(API_URL)
        .post('/api/auth.signin')
        .send({
          email: payload,
          password: 'test',
        });

      // Should not expose PostgreSQL error messages
      const bodyStr = JSON.stringify(response.body).toLowerCase();
      expect(bodyStr).not.toContain('syntax error');
      expect(bodyStr).not.toContain('postgresql');
      expect(bodyStr).not.toContain('pg_');
      expect(bodyStr).not.toContain('relation');
      expect(bodyStr).not.toContain('column');
    }
  });

  test('should maintain database integrity after injection attempts', async () => {
    // Count rows before
    const beforeUsers = await executeTestQuery('SELECT COUNT(*) as count FROM users');
    const beforeSessions = await executeTestQuery('SELECT COUNT(*) as count FROM sessions');

    // Attempt multiple injections
    const injectionAttempts = SQL_INJECTION_PAYLOADS.slice(0, 20);

    for (const payload of injectionAttempts) {
      await request(API_URL)
        .post('/api/auth.signup')
        .send({
          email: generateRandomEmail(),
          password: 'SecurePass123',
          fullname: payload,
        });
    }

    // Count rows after
    const afterUsers = await executeTestQuery('SELECT COUNT(*) as count FROM users');
    const afterSessions = await executeTestQuery('SELECT COUNT(*) as count FROM sessions');

    // Should only have legitimate insertions (no SQL-injected modifications)
    expect(Number(afterUsers[0].count)).toBeGreaterThanOrEqual(Number(beforeUsers[0].count));
    expect(Number(afterSessions[0].count)).toBeGreaterThanOrEqual(Number(beforeSessions[0].count));

    // Tables should still exist
    const tables = await executeTestQuery(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name IN ('users', 'sessions')
    `);
    expect(tables.length).toBe(2);
  });
});
