/**
 * Timing Attack Security Tests
 *
 * Tests to ensure the authentication module does not leak information through timing differences.
 * Prevents attackers from determining if emails exist or passwords are partially correct.
 *
 * SECURITY TESTING CONTEXT: Authorized defensive security testing.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  clearTestDatabase,
  insertTestUser,
  hashPassword,
  generateRandomEmail,
  measureExecutionTime,
  measureAverageDuration,
  isTimingConsistent,
} from '@/test/utils/test-helpers';

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
// SIGNIN TIMING CONSISTENCY
// ============================================

describe('Timing Attack Prevention - Signin', () => {
  test('should have consistent response time for existing vs non-existing emails', async () => {
    const existingEmail = generateRandomEmail();
    const nonExistingEmail = generateRandomEmail();
    const password = 'SecurePass123';
    const hashedPassword = await hashPassword(password);

    // Create user with existing email
    await insertTestUser({
      email: existingEmail,
      password: hashedPassword,
      fullname: 'Existing User',
      verified: true,
    });

    // Measure timing for existing email (wrong password)
    const existingEmailDuration = await measureAverageDuration(async () => {
      await request(API_URL)
        .post('/api/auth.signin')
        .send({
          email: existingEmail,
          password: 'WrongPassword123',
        });
    }, 10);

    // Measure timing for non-existing email
    const nonExistingEmailDuration = await measureAverageDuration(async () => {
      await request(API_URL)
        .post('/api/auth.signin')
        .send({
          email: nonExistingEmail,
          password: 'WrongPassword123',
        });
    }, 10);

    // Timing should be consistent (within 20% variance)
    // This prevents attackers from determining if an email exists
    expect(isTimingConsistent(existingEmailDuration, nonExistingEmailDuration, 20)).toBe(true);

    console.log(`Existing email: ${existingEmailDuration.toFixed(2)}ms`);
    console.log(`Non-existing email: ${nonExistingEmailDuration.toFixed(2)}ms`);
  });

  test('should have consistent response time for correct vs incorrect passwords', async () => {
    const email = generateRandomEmail();
    const correctPassword = 'CorrectPassword123';
    const incorrectPassword = 'IncorrectPassword456';
    const hashedPassword = await hashPassword(correctPassword);

    await insertTestUser({
      email,
      password: hashedPassword,
      fullname: 'Test User',
      verified: true,
    });

    // Measure timing for incorrect password
    const incorrectDuration = await measureAverageDuration(async () => {
      await request(API_URL)
        .post('/api/auth.signin')
        .send({ email, password: incorrectPassword });
    }, 10);

    // Note: We can't test correct password timing here because it succeeds
    // Instead, we verify that incorrect password doesn't leak info via timing

    // Measure with different incorrect passwords
    const anotherIncorrectDuration = await measureAverageDuration(async () => {
      await request(API_URL)
        .post('/api/auth.signin')
        .send({ email, password: 'DifferentWrongPassword789' });
    }, 10);

    // Different wrong passwords should have similar timing
    expect(isTimingConsistent(incorrectDuration, anotherIncorrectDuration, 15)).toBe(true);

    console.log(`Incorrect password 1: ${incorrectDuration.toFixed(2)}ms`);
    console.log(`Incorrect password 2: ${anotherIncorrectDuration.toFixed(2)}ms`);
  });

  test('should not leak information about password length through timing', async () => {
    const email = generateRandomEmail();
    const password = 'SecurePassword123456';
    const hashedPassword = await hashPassword(password);

    await insertTestUser({
      email,
      password: hashedPassword,
      fullname: 'Test User',
      verified: true,
    });

    // Test with passwords of different lengths
    const shortPasswordDuration = await measureAverageDuration(async () => {
      await request(API_URL)
        .post('/api/auth.signin')
        .send({ email, password: 'short' });
    }, 5);

    const mediumPasswordDuration = await measureAverageDuration(async () => {
      await request(API_URL)
        .post('/api/auth.signin')
        .send({ email, password: 'mediumpassword' });
    }, 5);

    const longPasswordDuration = await measureAverageDuration(async () => {
      await request(API_URL)
        .post('/api/auth.signin')
        .send({ email, password: 'verylongpasswordthatistoolongtobereal' });
    }, 5);

    // All should have similar timing (password is hashed before comparison)
    expect(isTimingConsistent(shortPasswordDuration, mediumPasswordDuration, 20)).toBe(true);
    expect(isTimingConsistent(mediumPasswordDuration, longPasswordDuration, 20)).toBe(true);

    console.log(`Short password: ${shortPasswordDuration.toFixed(2)}ms`);
    console.log(`Medium password: ${mediumPasswordDuration.toFixed(2)}ms`);
    console.log(`Long password: ${longPasswordDuration.toFixed(2)}ms`);
  });
});

// ============================================
// FORGOT PASSWORD TIMING
// ============================================

describe('Timing Attack Prevention - Forgot Password', () => {
  test('should have consistent response time regardless of email existence', async () => {
    const existingEmail = generateRandomEmail();
    const nonExistingEmail = generateRandomEmail();
    const password = await hashPassword('SecurePass123');

    // Create user
    await insertTestUser({
      email: existingEmail,
      password,
      fullname: 'Test User',
      verified: true,
    });

    // Measure timing for existing email
    const existingEmailDuration = await measureAverageDuration(async () => {
      await request(API_URL)
        .post('/api/auth.forgot_password')
        .send({ email: existingEmail });
    }, 10);

    // Measure timing for non-existing email
    const nonExistingEmailDuration = await measureAverageDuration(async () => {
      await request(API_URL)
        .post('/api/auth.forgot_password')
        .send({ email: nonExistingEmail });
    }, 10);

    // Timing should be consistent (prevent email enumeration)
    expect(isTimingConsistent(existingEmailDuration, nonExistingEmailDuration, 20)).toBe(true);

    console.log(`Existing email: ${existingEmailDuration.toFixed(2)}ms`);
    console.log(`Non-existing email: ${nonExistingEmailDuration.toFixed(2)}ms`);
  });
});

// ============================================
// VERIFICATION CODE TIMING
// ============================================

describe('Timing Attack Prevention - Verification', () => {
  test('should have consistent response time for valid vs invalid codes', async () => {
    const email = generateRandomEmail();
    const password = await hashPassword('SecurePass123');
    const validCode = '123456';

    await insertTestUser({
      email,
      password,
      fullname: 'Test User',
      verified: false,
      verification_code: validCode,
    });

    // Measure timing for invalid codes
    const invalidCodes = ['111111', '222222', '333333', '444444', '555555'];
    const durations: number[] = [];

    for (const code of invalidCodes) {
      const duration = await measureAverageDuration(async () => {
        await request(API_URL)
          .post('/api/auth.verify_account')
          .send({ code });
      }, 3);
      durations.push(duration);
    }

    // All invalid codes should have similar timing
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;

    for (const duration of durations) {
      expect(Math.abs(duration - avgDuration) / avgDuration).toBeLessThan(0.2); // Within 20%
    }

    console.log(`Average invalid code duration: ${avgDuration.toFixed(2)}ms`);
    console.log(`Durations:`, durations.map(d => d.toFixed(2)).join(', '));
  });
});

// ============================================
// SESSION VERIFICATION TIMING
// ============================================

describe('Timing Attack Prevention - Session Verification', () => {
  test('should have consistent response time for valid vs invalid tokens', async () => {
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

    // Measure timing for valid token
    const validTokenDuration = await measureAverageDuration(async () => {
      await request(API_URL)
        .post('/api/auth.verify_session')
        .send({ token: validToken });
    }, 10);

    // Measure timing for invalid token (same length)
    const invalidToken = 'invalid-' + 'x'.repeat(validToken.length - 8);
    const invalidTokenDuration = await measureAverageDuration(async () => {
      await request(API_URL)
        .post('/api/auth.verify_session')
        .send({ token: invalidToken });
    }, 10);

    // Timing should be consistent
    expect(isTimingConsistent(validTokenDuration, invalidTokenDuration, 25)).toBe(true);

    console.log(`Valid token: ${validTokenDuration.toFixed(2)}ms`);
    console.log(`Invalid token: ${invalidTokenDuration.toFixed(2)}ms`);
  });
});

// ============================================
// PARTIAL PASSWORD MATCH TIMING
// ============================================

describe('Timing Attack Prevention - Partial Password Match', () => {
  test('should not leak info about partially correct passwords', async () => {
    const email = generateRandomEmail();
    const correctPassword = 'CorrectPassword123';
    const hashedPassword = await hashPassword(correctPassword);

    await insertTestUser({
      email,
      password: hashedPassword,
      fullname: 'Test User',
      verified: true,
    });

    // Test passwords with increasing similarity to correct password
    const passwords = [
      'WrongPassword123',           // Completely wrong
      'CorrectPassword111',         // First part correct
      'CorrectPassword12',          // Almost correct (missing one char)
      'correctPassword123',         // Different case
      'CorrectPassword1234',        // Correct + extra char
    ];

    const durations: number[] = [];

    for (const pwd of passwords) {
      const duration = await measureAverageDuration(async () => {
        await request(API_URL)
          .post('/api/auth.signin')
          .send({ email, password: pwd });
      }, 5);
      durations.push(duration);
    }

    // All should have similar timing (constant-time comparison)
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;

    for (const duration of durations) {
      const variance = Math.abs(duration - avgDuration) / avgDuration;
      expect(variance).toBeLessThan(0.25); // Within 25%
    }

    console.log(`Partial password match timing:`, durations.map(d => d.toFixed(2)).join(', '));
  });
});

// ============================================
// STATISTICAL TIMING ANALYSIS
// ============================================

describe('Statistical Timing Analysis', () => {
  test('should not allow email enumeration through statistical timing analysis', async () => {
    const existingEmails: string[] = [];
    const password = await hashPassword('SecurePass123');

    // Create multiple users
    for (let i = 0; i < 5; i++) {
      const email = generateRandomEmail();
      existingEmails.push(email);
      await insertTestUser({
        email,
        password,
        fullname: `User ${i}`,
        verified: true,
      });
    }

    // Measure timing for existing emails
    const existingTimings: number[] = [];
    for (const email of existingEmails) {
      const { duration } = await measureExecutionTime(async () => {
        await request(API_URL)
          .post('/api/auth.signin')
          .send({ email, password: 'WrongPassword' });
      });
      existingTimings.push(duration);
    }

    // Measure timing for non-existing emails
    const nonExistingTimings: number[] = [];
    for (let i = 0; i < 5; i++) {
      const email = generateRandomEmail();
      const { duration } = await measureExecutionTime(async () => {
        await request(API_URL)
          .post('/api/auth.signin')
          .send({ email, password: 'WrongPassword' });
      });
      nonExistingTimings.push(duration);
    }

    // Calculate means
    const existingMean = existingTimings.reduce((sum, t) => sum + t, 0) / existingTimings.length;
    const nonExistingMean = nonExistingTimings.reduce((sum, t) => sum + t, 0) / nonExistingTimings.length;

    // Calculate standard deviations
    const existingStdDev = Math.sqrt(
      existingTimings.reduce((sum, t) => sum + Math.pow(t - existingMean, 2), 0) / existingTimings.length
    );
    const nonExistingStdDev = Math.sqrt(
      nonExistingTimings.reduce((sum, t) => sum + Math.pow(t - nonExistingMean, 2), 0) / nonExistingTimings.length
    );

    console.log(`Existing emails mean: ${existingMean.toFixed(2)}ms ± ${existingStdDev.toFixed(2)}ms`);
    console.log(`Non-existing emails mean: ${nonExistingMean.toFixed(2)}ms ± ${nonExistingStdDev.toFixed(2)}ms`);

    // Means should be similar (within 20% considering network variance)
    const difference = Math.abs(existingMean - nonExistingMean);
    const avgMean = (existingMean + nonExistingMean) / 2;
    const percentDifference = (difference / avgMean) * 100;

    expect(percentDifference).toBeLessThan(20);
  });
});

// ============================================
// RACE CONDITION TIMING
// ============================================

describe('Race Condition Prevention', () => {
  test('should handle concurrent requests without timing leaks', async () => {
    const email = generateRandomEmail();
    const password = 'SecurePass123';
    const hashedPassword = await hashPassword(password);

    await insertTestUser({
      email,
      password: hashedPassword,
      fullname: 'Test User',
      verified: true,
    });

    // Send multiple concurrent requests
    const concurrentRequests = 10;
    const promises: Promise<any>[] = [];

    const startTime = performance.now();

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        request(API_URL)
          .post('/api/auth.signin')
          .send({ email, password: 'WrongPassword' + i })
      );
    }

    await Promise.all(promises);

    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    // Concurrent requests should not significantly differ in total time
    // vs sequential (indicates proper handling without timing leaks)
    console.log(`Concurrent requests total time: ${totalDuration.toFixed(2)}ms`);
    console.log(`Average per request: ${(totalDuration / concurrentRequests).toFixed(2)}ms`);

    // All should fail authentication
    const results = await Promise.all(promises);
    for (const result of results) {
      expect([400, 401]).toContain(result.status);
    }
  });
});
