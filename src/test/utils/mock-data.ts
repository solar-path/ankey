/**
 * Mock Data and Test Fixtures
 *
 * This file contains reusable mock data for testing the authentication module.
 * Organized by feature area for easy maintenance.
 */

// ============================================
// MOCK USERS
// ============================================

export const MOCK_USERS = {
  /** Valid user for successful test scenarios */
  valid: {
    email: 'test@example.com',
    password: 'SecurePass123',
    fullname: 'Test User',
    verified: true,
  },

  /** Unverified user for testing verification flow */
  unverified: {
    email: 'unverified@example.com',
    password: 'SecurePass123',
    fullname: 'Unverified User',
    verified: false,
    verification_code: '123456',
  },

  /** User with 2FA enabled for testing 2FA flow */
  with2FA: {
    email: '2fa@example.com',
    password: 'SecurePass123',
    fullname: '2FA User',
    verified: true,
    twoFactorEnabled: true,
    twoFactorSecret: 'JBSWY3DPEHPK3PXP',
  },

  /** Admin user for testing elevated permissions */
  admin: {
    email: 'admin@example.com',
    password: 'AdminPass123',
    fullname: 'Admin User',
    verified: true,
    role: 'admin',
  },

  /** User with complete profile for testing profile updates */
  complete: {
    email: 'complete@example.com',
    password: 'SecurePass123',
    fullname: 'Complete User',
    verified: true,
    profile: {
      dob: '1990-01-01',
      gender: 'male',
      phone: '+1234567890',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      preferredLanguage: 'en',
    },
  },

  /** User with invitation pending */
  invited: {
    email: 'invited@example.com',
    fullname: 'Invited User',
    verified: false,
    invitation_token: '123456',
    invitation_expiry: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
  },
} as const;

// ============================================
// MOCK SESSIONS
// ============================================

export const MOCK_SESSIONS = {
  /** Valid active session */
  valid: {
    token: 'test-session-token-123',
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
    user_id: 'user_1234567890_abc-123',
  },

  /** Expired session for testing session expiry */
  expired: {
    token: 'expired-session-token-456',
    expiresAt: Date.now() - 60 * 60 * 1000, // 1 hour ago
    user_id: 'user_1234567890_abc-123',
  },

  /** Session about to expire (for testing refresh) */
  expiringSoon: {
    token: 'expiring-session-token-789',
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes from now
    user_id: 'user_1234567890_abc-123',
  },
} as const;

// ============================================
// INVALID INPUT DATA
// ============================================

/** Invalid email formats for validation testing */
export const INVALID_EMAILS = [
  'invalid',
  'invalid@',
  '@example.com',
  'invalid@.com',
  'invalid..email@example.com',
  'invalid@example',
  'invalid @example.com',
  'invalid@example .com',
  '',
  ' ',
  null,
  undefined,
] as const;

/** Weak/invalid passwords for validation testing */
export const WEAK_PASSWORDS = [
  '123',        // Too short
  'pass',       // Too short
  'short',      // Too short
  '1234567',    // < 8 chars
  '',           // Empty
  ' ',          // Whitespace only
  null,
  undefined,
] as const;

/** Invalid fullname values */
export const INVALID_FULLNAMES = [
  'A',          // Too short (< 2 chars)
  '',           // Empty
  ' ',          // Whitespace only
  null,
  undefined,
  '123',        // Numbers only
] as const;

/** Invalid verification codes */
export const INVALID_CODES = [
  '123',        // Too short
  '12345',      // Too short
  '1234567',    // Too long
  'abcdef',     // Not numeric
  '12345a',     // Mixed alphanumeric
  '',           // Empty
  null,
  undefined,
] as const;

// ============================================
// SECURITY TEST PAYLOADS
// ============================================

/** SQL injection attack payloads */
export const SQL_INJECTION_PAYLOADS = [
  // Basic SQL injection
  "' OR '1'='1",
  "' OR 1=1--",
  "admin'--",
  "admin' #",
  "admin'/*",

  // Union-based injection
  "' UNION SELECT NULL--",
  "' UNION SELECT NULL, NULL--",
  "' UNION SELECT NULL, NULL, NULL--",

  // Drop table attempts
  "'; DROP TABLE users; --",
  "'; DROP TABLE sessions; --",
  "'; DELETE FROM users; --",

  // Time-based blind injection
  "'; WAITFOR DELAY '00:00:05'--",
  "' AND (SELECT * FROM (SELECT(SLEEP(5)))a)--",

  // Boolean-based blind injection
  "' AND 1=1--",
  "' AND 1=2--",
  "1' AND (SELECT COUNT(*) FROM users) > 0--",

  // Stacked queries
  "'; INSERT INTO users VALUES('hacker', 'hacker@evil.com')--",

  // Comment injection
  "admin'--",
  "admin'#",
  "admin'/*",
] as const;

/** XSS attack payloads */
export const XSS_PAYLOADS = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  '<svg onload=alert("XSS")>',
  'javascript:alert("XSS")',
  '<iframe src="javascript:alert(\'XSS\')">',
  '<body onload=alert("XSS")>',
  '<input type="text" value="XSS" onfocus="alert(\'XSS\')">',
  '<a href="javascript:alert(\'XSS\')">Click me</a>',
  '"><script>alert(String.fromCharCode(88,83,83))</script>',
  '<IMG SRC="javascript:alert(\'XSS\');">',
] as const;

/** NoSQL injection payloads (for CouchDB compatibility testing) */
export const NOSQL_INJECTION_PAYLOADS = [
  { $ne: null },
  { $ne: '' },
  { $gt: '' },
  { $regex: '.*' },
  { $where: '1==1' },
] as const;

/** Path traversal payloads */
export const PATH_TRAVERSAL_PAYLOADS = [
  '../../../etc/passwd',
  '..\\..\\..\\windows\\system32',
  '....//....//....//etc/passwd',
  '..%2F..%2F..%2Fetc%2Fpasswd',
] as const;

/** Command injection payloads */
export const COMMAND_INJECTION_PAYLOADS = [
  '; ls -la',
  '| cat /etc/passwd',
  '& whoami',
  '`whoami`',
  '$(whoami)',
  '; rm -rf /',
] as const;

// ============================================
// VALID EDGE CASE DATA
// ============================================

/** Valid but edge case emails */
export const EDGE_CASE_EMAILS = [
  'user+tag@example.com',              // Plus sign
  'user.name@example.com',             // Dot in local part
  'user_name@example.com',             // Underscore
  'user-name@example.com',             // Hyphen
  'a@example.com',                     // Single character local
  'user@sub.example.com',              // Subdomain
  'user@example.co.uk',                // Country TLD
  '123456@example.com',                // Numeric local
  'user@123.456.789.012',              // Numeric domain
] as const;

/** Valid but edge case names */
export const EDGE_CASE_NAMES = [
  'X Æ A-12',                          // Special characters (Elon's son)
  'Jean-Claude Van Damme',             // Hyphens
  "O'Brien",                           // Apostrophe
  'Nguyễn Tấn Dũng',                   // Unicode characters
  'José García',                       // Accented characters
  'محمد علي',                          // Arabic characters
  '张伟',                               // Chinese characters
  'Александр Петров',                  // Cyrillic characters
] as const;

/** Valid but edge case passwords */
export const EDGE_CASE_PASSWORDS = [
  'Password123!@#$%^&*()',             // Special characters
  'P@ssw0rd' + 'x'.repeat(64),         // Long password
  '密码Password123',                    // Mixed unicode
  'Pass Word 123',                     // Spaces
] as const;

// ============================================
// MOCK API RESPONSES
// ============================================

/** Mock successful signup response */
export const MOCK_SIGNUP_RESPONSE = {
  message: 'User created successfully. Please check your email for verification code.',
  userId: 'user_1234567890_abc-123',
  verificationCode: '123456',
};

/** Mock successful signin response */
export const MOCK_SIGNIN_RESPONSE = {
  requires2FA: false,
  user: {
    _id: 'user_1234567890_abc-123',
    email: 'test@example.com',
    fullname: 'Test User',
    verified: true,
    profile: {},
    created_at: Date.now(),
  },
  session: {
    token: 'test-session-token-123',
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  },
};

/** Mock 2FA required response */
export const MOCK_2FA_REQUIRED_RESPONSE = {
  requires2FA: true,
  user: {
    email: '2fa@example.com',
    fullname: '2FA User',
  },
};

/** Mock error responses */
export const MOCK_ERROR_RESPONSES = {
  invalidCredentials: {
    error: 'Invalid email or password',
    status: 401,
  },
  emailExists: {
    error: 'User with this email already exists',
    status: 400,
  },
  unverified: {
    error: 'Please verify your account first',
    status: 403,
  },
  invalidToken: {
    error: 'Invalid session',
    status: 401,
  },
  expiredSession: {
    error: 'Session expired',
    status: 401,
  },
  invalidCode: {
    error: 'Invalid verification code',
    status: 400,
  },
  expiredCode: {
    error: 'Verification code has expired',
    status: 400,
  },
};

// ============================================
// TEST DATABASE DATA
// ============================================

/** Database user record structure */
export interface DbUser {
  id: string;
  _id: string;
  type: 'user';
  email: string;
  password: string;
  fullname: string;
  verified: boolean;
  verification_code?: string;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  invitation_token?: string;
  invitation_expiry?: number;
  reset_token?: string;
  reset_token_expiry?: number;
  profile: Record<string, any>;
  created_at: number;
  updated_at: number;
}

/** Database session record structure */
export interface DbSession {
  id: string;
  _id: string;
  type: 'session';
  user_id: string;
  token: string;
  expires_at: number;
  created_at: number;
}

/** Helper to create mock DB user */
export function createMockDbUser(overrides: Partial<DbUser> = {}): DbUser {
  const timestamp = Date.now();
  return {
    id: crypto.randomUUID(),
    _id: `user_${timestamp}_${crypto.randomUUID()}`,
    type: 'user',
    email: 'test@example.com',
    password: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // hashed "SecurePass123"
    fullname: 'Test User',
    verified: true,
    two_factor_enabled: false,
    profile: {},
    created_at: timestamp,
    updated_at: timestamp,
    ...overrides,
  };
}

/** Helper to create mock DB session */
export function createMockDbSession(overrides: Partial<DbSession> = {}): DbSession {
  const timestamp = Date.now();
  return {
    id: crypto.randomUUID(),
    _id: `session_${timestamp}_${crypto.randomUUID()}`,
    type: 'session',
    user_id: 'user_1234567890_abc-123',
    token: `token_${crypto.randomUUID()}`,
    expires_at: timestamp + 7 * 24 * 60 * 60 * 1000, // 7 days
    created_at: timestamp,
    ...overrides,
  };
}

// ============================================
// TIMING ATTACK TEST DATA
// ============================================

/** Email addresses for timing attack tests */
export const TIMING_TEST_EMAILS = {
  existing: 'existing@example.com',
  nonExisting: 'nonexisting@example.com',
};

/** Passwords for timing attack tests */
export const TIMING_TEST_PASSWORDS = {
  correct: 'CorrectPassword123',
  incorrect: 'IncorrectPassword456',
};

// ============================================
// BRUTE FORCE TEST DATA
// ============================================

/** Generate multiple failed login attempts */
export function generateFailedLoginAttempts(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    email: 'brute-force@example.com',
    password: `WrongPassword${i}`,
    attempt: i + 1,
  }));
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Generate random email for tests */
export function generateRandomEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test-${timestamp}-${random}@example.com`;
}

/** Generate random password */
export function generateRandomPassword(length = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/** Generate 6-digit verification code */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Wait for specified milliseconds (for timing tests) */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Check if two timestamps are within acceptable range (for timing attack tests) */
export function isWithinTimeRange(time1: number, time2: number, thresholdMs = 100): boolean {
  return Math.abs(time1 - time2) < thresholdMs;
}
