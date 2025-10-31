/**
 * Test Helper Utilities
 *
 * Reusable utilities for setting up and managing tests across the suite.
 */

import { Pool, PoolClient } from 'pg';
import type { DbUser, DbSession } from './mock-data';

// ============================================
// DATABASE HELPERS
// ============================================

let testPool: Pool | null = null;

/**
 * Get or create test database connection pool
 */
export function getTestDbPool(): Pool {
  if (!testPool) {
    testPool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/ankey_test',
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return testPool;
}

/**
 * Close test database pool
 */
export async function closeTestDbPool(): Promise<void> {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
}

/**
 * Get a database client from the pool
 */
export async function getTestDbClient(): Promise<PoolClient> {
  const pool = getTestDbPool();
  return pool.connect();
}

/**
 * Execute a SQL query against the test database
 */
export async function executeTestQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  const pool = getTestDbPool();
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Execute a PostgreSQL function call
 */
export async function callDbFunction<T = any>(
  functionName: string,
  params: Record<string, any> = {}
): Promise<T> {
  const paramNames = Object.keys(params);
  const paramValues = Object.values(params);

  // Build function call with named parameters
  const paramPlaceholders = paramNames
    .map((name, index) => `_${name} := $${index + 1}`)
    .join(', ');

  const query = `SELECT ${functionName}(${paramPlaceholders})`;

  const result = await executeTestQuery(query, paramValues);
  return result[0]?.[functionName];
}

/**
 * Clear all data from test database tables
 */
export async function clearTestDatabase(): Promise<void> {
  await executeTestQuery('TRUNCATE TABLE sessions CASCADE');
  await executeTestQuery('TRUNCATE TABLE users CASCADE');
  // Add other tables as needed
}

/**
 * Insert a test user into the database
 */
export async function insertTestUser(user: Partial<DbUser>): Promise<DbUser> {
  const timestamp = Date.now();
  const userId = user._id || `user_${timestamp}_${crypto.randomUUID()}`;

  const query = `
    INSERT INTO users (
      id, _id, type, email, password, fullname, verified,
      verification_code, two_factor_enabled, two_factor_secret,
      profile, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
    ) RETURNING *
  `;

  const values = [
    user.id || crypto.randomUUID(),
    userId,
    'user',
    user.email || 'test@example.com',
    user.password || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    user.fullname || 'Test User',
    user.verified !== undefined ? user.verified : true,
    user.verification_code || null,
    user.two_factor_enabled || false,
    user.two_factor_secret || null,
    user.profile || {},
    user.created_at || timestamp,
    user.updated_at || timestamp,
  ];

  const result = await executeTestQuery<DbUser>(query, values);
  return result[0];
}

/**
 * Insert a test session into the database
 */
export async function insertTestSession(session: Partial<DbSession>): Promise<DbSession> {
  const timestamp = Date.now();
  const sessionId = session._id || `session_${timestamp}_${crypto.randomUUID()}`;

  const query = `
    INSERT INTO sessions (
      id, _id, type, user_id, token, expires_at, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7
    ) RETURNING *
  `;

  const values = [
    session.id || crypto.randomUUID(),
    sessionId,
    'session',
    session.user_id || 'user_1234567890_abc-123',
    session.token || `token_${crypto.randomUUID()}`,
    session.expires_at || timestamp + 7 * 24 * 60 * 60 * 1000,
    session.created_at || timestamp,
  ];

  const result = await executeTestQuery<DbSession>(query, values);
  return result[0];
}

/**
 * Get user by email from test database
 */
export async function getTestUserByEmail(email: string): Promise<DbUser | null> {
  const result = await executeTestQuery<DbUser>(
    'SELECT * FROM users WHERE email = $1 AND type = $2',
    [email, 'user']
  );
  return result[0] || null;
}

/**
 * Get session by token from test database
 */
export async function getTestSessionByToken(token: string): Promise<DbSession | null> {
  const result = await executeTestQuery<DbSession>(
    'SELECT * FROM sessions WHERE token = $1 AND type = $2',
    [token, 'session']
  );
  return result[0] || null;
}

/**
 * Delete user from test database
 */
export async function deleteTestUser(email: string): Promise<void> {
  await executeTestQuery('DELETE FROM users WHERE email = $1', [email]);
}

/**
 * Delete session from test database
 */
export async function deleteTestSession(token: string): Promise<void> {
  await executeTestQuery('DELETE FROM sessions WHERE token = $1', [token]);
}

// ============================================
// API TESTING HELPERS
// ============================================

/**
 * Build API URL for testing
 */
export function buildApiUrl(path: string): string {
  const baseUrl = process.env.VITE_API_URL || 'http://localhost:3002';
  return `${baseUrl}${path}`;
}

/**
 * Make authenticated API request
 */
export async function makeAuthenticatedRequest(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<Response> {
  const { token, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(buildApiUrl(path), {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });
}

/**
 * Call PostgreSQL function via API
 */
export async function callApiFunction<T = any>(
  functionName: string,
  params: Record<string, any> = {},
  token?: string
): Promise<T> {
  const response = await makeAuthenticatedRequest(`/api/${functionName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    token,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

// ============================================
// TIMING HELPERS
// ============================================

/**
 * Measure execution time of a function
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  return { result, duration };
}

/**
 * Execute function multiple times and get average duration
 */
export async function measureAverageDuration<T>(
  fn: () => Promise<T>,
  iterations = 10
): Promise<number> {
  const durations: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const { duration } = await measureExecutionTime(fn);
    durations.push(duration);
  }

  return durations.reduce((sum, d) => sum + d, 0) / durations.length;
}

/**
 * Check if timing is consistent (for timing attack tests)
 */
export function isTimingConsistent(
  duration1: number,
  duration2: number,
  thresholdPercent = 10
): boolean {
  const avgDuration = (duration1 + duration2) / 2;
  const difference = Math.abs(duration1 - duration2);
  const differencePercent = (difference / avgDuration) * 100;

  return differencePercent <= thresholdPercent;
}

// ============================================
// PASSWORD HASHING HELPERS
// ============================================

/**
 * Hash password using SHA-256 (matches backend implementation)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================
// SESSION HELPERS
// ============================================

/**
 * Create a valid test session
 */
export async function createTestSession(
  userId: string,
  expiresInDays = 7
): Promise<DbSession> {
  const timestamp = Date.now();
  const token = `test-token-${crypto.randomUUID()}`;

  return insertTestSession({
    user_id: userId,
    token,
    expires_at: timestamp + expiresInDays * 24 * 60 * 60 * 1000,
  });
}

/**
 * Create an expired test session
 */
export async function createExpiredTestSession(userId: string): Promise<DbSession> {
  const timestamp = Date.now();
  const token = `expired-token-${crypto.randomUUID()}`;

  return insertTestSession({
    user_id: userId,
    token,
    expires_at: timestamp - 60 * 60 * 1000, // 1 hour ago
  });
}

// ============================================
// VERIFICATION CODE HELPERS
// ============================================

/**
 * Generate 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Set verification code for test user
 */
export async function setTestUserVerificationCode(
  email: string,
  code?: string
): Promise<string> {
  const verificationCode = code || generateVerificationCode();

  await executeTestQuery(
    'UPDATE users SET verification_code = $1 WHERE email = $2',
    [verificationCode, email]
  );

  return verificationCode;
}

// ============================================
// 2FA HELPERS
// ============================================

/**
 * Enable 2FA for test user
 */
export async function enableTest2FA(email: string, secret?: string): Promise<string> {
  const twoFactorSecret = secret || 'JBSWY3DPEHPK3PXP';

  await executeTestQuery(
    'UPDATE users SET two_factor_enabled = $1, two_factor_secret = $2 WHERE email = $3',
    [true, twoFactorSecret, email]
  );

  return twoFactorSecret;
}

/**
 * Disable 2FA for test user
 */
export async function disableTest2FA(email: string): Promise<void> {
  await executeTestQuery(
    'UPDATE users SET two_factor_enabled = $1, two_factor_secret = $2 WHERE email = $3',
    [false, null, email]
  );
}

// ============================================
// CLEANUP HELPERS
// ============================================

/**
 * Cleanup test data after test
 */
export async function cleanupTestData(emails: string[], tokens: string[] = []): Promise<void> {
  // Delete users
  for (const email of emails) {
    await deleteTestUser(email);
  }

  // Delete sessions
  for (const token of tokens) {
    await deleteTestSession(token);
  }
}

/**
 * Global test setup
 */
export async function setupTestEnvironment(): Promise<void> {
  // Initialize database connection
  getTestDbPool();

  // Run migrations if needed
  // await runTestMigrations();

  // Clear existing test data
  await clearTestDatabase();
}

/**
 * Global test teardown
 */
export async function teardownTestEnvironment(): Promise<void> {
  // Clear test data
  await clearTestDatabase();

  // Close database connections
  await closeTestDbPool();
}

// ============================================
// WAIT HELPERS
// ============================================

/**
 * Wait for specified milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for condition to be true
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeoutMs = 5000,
  intervalMs = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return;
    }
    await wait(intervalMs);
  }

  throw new Error(`Condition not met within ${timeoutMs}ms`);
}

// ============================================
// RANDOM DATA GENERATORS
// ============================================

/**
 * Generate random email
 */
export function generateRandomEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * Generate random password
 */
export function generateRandomPassword(length = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * Generate random fullname
 */
export function generateRandomFullname(): string {
  const firstNames = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${firstName} ${lastName}`;
}

// ============================================
// ASSERTION HELPERS
// ============================================

/**
 * Assert that a user exists in database
 */
export async function assertUserExists(email: string): Promise<DbUser> {
  const user = await getTestUserByEmail(email);
  if (!user) {
    throw new Error(`User with email ${email} does not exist`);
  }
  return user;
}

/**
 * Assert that a user does not exist in database
 */
export async function assertUserNotExists(email: string): Promise<void> {
  const user = await getTestUserByEmail(email);
  if (user) {
    throw new Error(`User with email ${email} exists but should not`);
  }
}

/**
 * Assert that a session exists in database
 */
export async function assertSessionExists(token: string): Promise<DbSession> {
  const session = await getTestSessionByToken(token);
  if (!session) {
    throw new Error(`Session with token ${token} does not exist`);
  }
  return session;
}

/**
 * Assert that a session does not exist in database
 */
export async function assertSessionNotExists(token: string): Promise<void> {
  const session = await getTestSessionByToken(token);
  if (session) {
    throw new Error(`Session with token ${token} exists but should not`);
  }
}
