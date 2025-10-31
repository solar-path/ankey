# Comprehensive Authentication Module Test Plan

## Table of Contents
1. [Overview](#overview)
2. [Testing Strategy](#testing-strategy)
3. [Test Categories](#test-categories)
4. [Security Testing](#security-testing)
5. [Test Environment](#test-environment)
6. [Test Data](#test-data)
7. [Coverage Goals](#coverage-goals)

---

## Overview

This document outlines the comprehensive testing strategy for the authentication module built with:
- **Frontend**: React + react-hook-form + Valibot + shadcn/ui
- **Backend**: Hono (Node.js framework)
- **Database**: PostgreSQL with stored procedures
- **Testing Tools**: Vitest, Supertest, Playwright

### Authentication Features Covered
- User sign up with email verification
- User sign in with session management
- Two-factor authentication (2FA)
- Password reset flow
- User profile management
- User invitation system
- Session management and verification
- Password change
- Language preference

---

## Testing Strategy

### Test Pyramid Approach

```
                    /\
                   /  \
                  / E2E \          10% - Full user journeys
                 /______\
                /        \
               /Integration\       30% - API routes + DB
              /____________\
             /              \
            /   Unit Tests   \     60% - Validation, utils, services
           /__________________\
```

### Testing Layers

1. **Unit Tests (60% of tests)**
   - Validation schemas (Valibot)
   - Service functions (auth-service, user-service)
   - Utility functions
   - Component rendering (isolated)
   - Store logic (Zustand)

2. **Integration Tests (30% of tests)**
   - Hono API routes with Supertest
   - Database function calls
   - Service + API integration
   - Session management flow

3. **E2E Tests (10% of tests)**
   - Complete user journeys with Playwright
   - Multi-step flows
   - Browser-level interactions

---

## Test Categories

### 1. Unit Tests

#### 1.1 Validation Schema Tests (`src/test/unit/validation/`)
**Purpose**: Ensure all Valibot schemas validate data correctly

**Test Files**:
- `auth.validation.test.ts` - Sign up, sign in, forgot password, verify account
- `profile.validation.test.ts` - Profile update, contact update
- `2fa.validation.test.ts` - 2FA setup, enable, disable, verify
- `invitation.validation.test.ts` - Invite user, accept invitation

**Test Cases**:
- ✅ Valid input passes validation
- ❌ Invalid email format
- ❌ Password too short (< 8 chars)
- ❌ Missing required fields
- ❌ Wrong data types
- ❌ Out-of-range values
- ✅ Optional fields can be omitted
- ❌ Special characters in names
- ❌ SQL injection attempts in input

**Example Test Structure**:
```typescript
describe('signUpSchema', () => {
  describe('Valid Inputs', () => {
    test('accepts valid registration data')
    test('accepts special characters in fullname')
  })

  describe('Invalid Email', () => {
    test('rejects invalid email format')
    test('rejects email without @')
    test('rejects email without domain')
  })

  describe('Password Validation', () => {
    test('rejects password shorter than 8 characters')
    test('accepts password with special characters')
  })

  describe('SQL Injection Prevention', () => {
    test('sanitizes SQL injection attempts in email')
    test('sanitizes SQL injection in fullname')
  })
})
```

---

#### 1.2 Auth Service Tests (`src/test/unit/services/`)
**Purpose**: Test service layer methods with mocked API calls

**Test Files**:
- `auth-service.test.ts` - All AuthService methods
- `user-service.test.ts` - All UserService methods

**Test Cases**:
- ✅ Service methods call API with correct parameters
- ✅ Service methods transform responses correctly
- ❌ Service handles API errors gracefully
- ❌ Service handles network failures
- ✅ Service methods return expected data structures
- ❌ Service validates input before API call

**Example Test Structure**:
```typescript
describe('AuthService.signUp', () => {
  test('calls API with correct parameters')
  test('returns user data on success')
  test('throws error when email already exists')
  test('throws error on network failure')
  test('validates email format before API call')
})

describe('AuthService.signIn', () => {
  test('successful signin returns user and session')
  test('handles 2FA required scenario')
  test('throws error for invalid credentials')
  test('throws error for unverified account')
  test('includes IP and user-agent in request')
})
```

---

#### 1.3 Store Tests (`src/test/unit/stores/`)
**Purpose**: Test Zustand store state management

**Test Files**:
- `auth-store.test.ts` - Auth store actions and state

**Test Cases**:
- ✅ Initial state is correct
- ✅ `login()` updates state correctly
- ✅ `logout()` clears state and calls API
- ✅ `refreshAuth()` syncs with session token
- ✅ `initialize()` restores from localStorage
- ✅ Store persists to localStorage
- ❌ Store handles expired session
- ❌ Store handles missing session token

---

#### 1.4 Component Unit Tests (`src/test/unit/components/`)
**Purpose**: Test individual React components in isolation

**Test Files**:
- `signup.page.test.tsx` - Sign up form
- `signin.page.test.tsx` - Sign in form (already exists)
- `forgotPassword.page.test.tsx` - Password reset request
- `verifyAccount.page.test.tsx` - Email verification
- `profile.page.test.tsx` - Profile update form
- `security.page.test.tsx` - 2FA and password change
- `acceptInvite.page.test.tsx` - Invitation acceptance

**Test Cases**:
- ✅ Component renders all form fields
- ✅ Component renders links and buttons
- ✅ Form validation displays errors
- ✅ Submit button disabled during loading
- ✅ Success message shows after successful submission
- ❌ Error message shows on failure
- ✅ Form resets after successful submission
- ✅ Navigation redirects work correctly

---

### 2. Integration Tests

#### 2.1 Hono API Route Tests (`src/test/integration/routes/`)
**Purpose**: Test HTTP endpoints with real database calls

**Test Files**:
- `auth.routes.test.ts` - All auth routes

**Test Cases**:
- ✅ POST /api/auth.signup creates user
- ✅ POST /api/auth.signin returns session token
- ✅ POST /api/auth.verify_session validates token
- ✅ POST /api/auth.signout invalidates session
- ❌ Invalid token returns 401
- ❌ Missing parameters return 400
- ❌ Duplicate email returns error
- ✅ Routes inject IP and user-agent
- ❌ Malformed JSON returns 400
- ❌ SQL injection attempts are blocked

**Example Test Structure**:
```typescript
describe('POST /api/auth.signup', () => {
  test('creates user with valid data')
  test('returns 400 for invalid email')
  test('returns 400 for duplicate email')
  test('returns verification code in response')
  test('hashes password before storage')
  test('sets verified to false initially')
})

describe('POST /api/auth.signin', () => {
  test('returns session token for valid credentials')
  test('returns 401 for invalid password')
  test('returns 401 for unverified account')
  test('returns 2FA required flag when enabled')
  test('logs IP address and user agent')
  test('creates session with 7-day expiry')
})
```

---

#### 2.2 Database Function Tests (`src/test/integration/database/`)
**Purpose**: Test PostgreSQL functions directly

**Test Files**:
- `auth.functions.test.ts` - All auth schema functions
- `session.functions.test.ts` - Session management
- `user.functions.test.ts` - User CRUD operations

**Test Cases**:
- ✅ `auth.signup()` creates user record
- ✅ `auth.signin()` validates credentials
- ✅ `auth.verify_account()` sets verified flag
- ✅ `auth.verify_session()` checks expiry
- ✅ `auth.signout()` deletes session
- ❌ `auth.signin()` fails with wrong password
- ❌ Expired session is rejected
- ✅ `auth.update_profile()` updates JSONB field
- ✅ `auth.change_password()` hashes new password
- ❌ SQL injection in parameters is blocked

**Example Test Structure**:
```typescript
describe('auth.signup()', () => {
  test('inserts user into database')
  test('generates unique user_id')
  test('hashes password with SHA-256')
  test('generates 6-digit verification code')
  test('throws error for duplicate email')
  test('sets timestamps correctly')
})

describe('auth.signin()', () => {
  test('returns user and session for valid creds')
  test('throws error for invalid email')
  test('throws error for invalid password')
  test('throws error for unverified user')
  test('creates session with correct expiry')
  test('handles 2FA enabled scenario')
  test('logs failed login attempts to audit table')
})
```

---

#### 2.3 Service + API Integration Tests (`src/test/integration/flows/`)
**Purpose**: Test complete service-to-API-to-DB flows

**Test Files**:
- `signup.flow.test.ts` - Complete sign up flow
- `signin.flow.test.ts` - Complete sign in flow
- `password-reset.flow.test.ts` - Password reset flow
- `2fa.flow.test.ts` - 2FA setup and verification
- `invitation.flow.test.ts` - User invitation flow

**Test Cases**:
- ✅ Sign up → Verify account → Sign in
- ✅ Sign in → Sign out → Session invalidated
- ✅ Forgot password → Reset with token
- ✅ Enable 2FA → Sign in with 2FA code
- ✅ Invite user → Accept invitation → Sign in
- ❌ Expired verification code
- ❌ Expired reset token
- ❌ Expired invitation code

---

### 3. End-to-End Tests

#### 3.1 User Journey Tests (`src/test/e2e/`)
**Purpose**: Test complete user flows in real browser

**Test Files**:
- `signup-journey.spec.ts` - Sign up → Verify → Dashboard
- `signin-journey.spec.ts` - Sign in → Dashboard → Sign out
- `password-reset-journey.spec.ts` - Forgot password → Reset → Sign in
- `2fa-journey.spec.ts` - Enable 2FA → Sign out → Sign in with 2FA
- `profile-update-journey.spec.ts` - Update profile → Language → Password

**Test Cases**:
- ✅ New user can sign up and verify account
- ✅ User can sign in and access dashboard
- ✅ User can reset password and sign in with new password
- ✅ User can enable 2FA and sign in with code
- ✅ User can update profile information
- ✅ User can change language preference
- ✅ User can change password
- ✅ User is redirected to sign in when not authenticated
- ❌ Invalid credentials show error message
- ❌ Unverified user cannot access dashboard

**Example Test Structure**:
```typescript
test('complete sign up journey', async ({ page }) => {
  // 1. Navigate to sign up page
  await page.goto('/auth/signup')

  // 2. Fill sign up form
  await page.fill('[name="fullname"]', 'Test User')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'SecurePass123')
  await page.check('[name="terms"]')

  // 3. Submit form
  await page.click('button[type="submit"]')

  // 4. Verify redirect to verification page
  await expect(page).toHaveURL('/auth/verify-account')

  // 5. Enter verification code
  // (Get code from email or test database)
  await page.fill('[name="code"]', '123456')
  await page.click('button[type="submit"]')

  // 6. Verify redirect to sign in
  await expect(page).toHaveURL('/auth/signin')

  // 7. Sign in
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'SecurePass123')
  await page.click('button[type="submit"]')

  // 8. Verify redirect to dashboard
  await expect(page).toHaveURL('/dashboard')

  // 9. Verify user is authenticated
  await expect(page.locator('text=Test User')).toBeVisible()
})
```

---

## Security Testing

### 4.1 SQL Injection Tests (`src/test/security/`)
**Purpose**: Verify protection against SQL injection attacks

**Test Files**:
- `sql-injection.test.ts` - SQL injection attempts

**Test Cases**:
- ❌ SQL injection in email field
- ❌ SQL injection in password field
- ❌ SQL injection in fullname field
- ❌ Union-based SQL injection
- ❌ Time-based blind SQL injection
- ❌ Boolean-based blind SQL injection
- ✅ Parameterized queries prevent injection
- ✅ Input sanitization works correctly

**Example Payloads**:
```typescript
const SQL_INJECTION_PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "admin'--",
  "' OR 1=1--",
  "' UNION SELECT NULL, NULL, NULL--",
  "'; WAITFOR DELAY '00:00:05'--",
  "1' AND (SELECT COUNT(*) FROM users) > 0--"
]
```

---

### 4.2 Authentication Security Tests (`src/test/security/`)
**Purpose**: Test authentication security measures

**Test Files**:
- `session-security.test.ts` - Session management security
- `password-security.test.ts` - Password handling security
- `timing-attack.test.ts` - Timing attack prevention
- `brute-force.test.ts` - Brute force protection

**Test Cases**:

**Session Security**:
- ❌ Expired session is rejected
- ❌ Invalid session token is rejected
- ❌ Session token cannot be reused after logout
- ✅ Session has proper expiry (7 days)
- ❌ Session token is not exposed in URLs
- ✅ Session token is httpOnly (if using cookies)

**Password Security**:
- ✅ Passwords are hashed (SHA-256)
- ✅ Password is never returned in API responses
- ✅ Password meets minimum length requirement
- ❌ Common passwords are rejected (optional)
- ✅ Password change requires current password

**Timing Attack Prevention**:
- ✅ Sign in response time is consistent
- ✅ Password verification time is consistent
- ❌ Timing attack cannot determine if email exists

**Brute Force Protection**:
- ❌ Multiple failed login attempts (test lockout)
- ✅ Failed login attempts are logged
- ❌ Rate limiting on sign in endpoint
- ❌ CAPTCHA after N failed attempts (if implemented)

---

### 4.3 XSS and CSRF Tests (`src/test/security/`)
**Purpose**: Test protection against XSS and CSRF attacks

**Test Files**:
- `xss-protection.test.ts` - XSS prevention
- `csrf-protection.test.ts` - CSRF prevention

**Test Cases**:

**XSS Prevention**:
- ❌ Script tags in fullname are escaped
- ❌ Script tags in email are rejected
- ❌ HTML in profile fields is sanitized
- ✅ User-generated content is escaped in UI

**CSRF Prevention**:
- ✅ API requires authentication token
- ✅ Sensitive actions require CSRF token (if implemented)
- ❌ State-changing requests cannot be made via GET
- ✅ CORS configuration is restrictive

---

### 4.4 Token Leakage Tests (`src/test/security/`)
**Purpose**: Ensure tokens are not leaked

**Test Files**:
- `token-leakage.test.ts` - Token exposure prevention

**Test Cases**:
- ❌ Session token not logged in console
- ❌ Session token not in URL parameters
- ❌ Session token not in referer header
- ❌ Verification code not in logs
- ❌ Reset token not exposed in API responses
- ✅ Tokens are transmitted over HTTPS only (E2E)

---

### 4.5 Authorization Tests (`src/test/security/`)
**Purpose**: Test access control and authorization

**Test Files**:
- `authorization.test.ts` - Permission checks

**Test Cases**:
- ❌ Unauthenticated user cannot access protected routes
- ❌ User cannot access another user's data
- ❌ User cannot modify another user's profile
- ✅ User can only access their own data
- ✅ Admin users have elevated permissions (if applicable)

---

## Test Environment

### Test Database Setup

**Strategy**: Use separate test database with automatic cleanup

```sql
-- Create test database
CREATE DATABASE ankey_test;

-- Run migrations
psql ankey_test < src/api/db/auth.definition.sql
psql ankey_test < src/api/db/auth.functions.sql
```

**Environment Variables** (`.env.test`):
```env
DATABASE_URL=postgresql://localhost:5432/ankey_test
VITE_API_URL=http://localhost:3002
API_PORT=3002
NODE_ENV=test
```

### Test Lifecycle Hooks

**Before All Tests**:
1. Start test database
2. Run migrations
3. Start test API server (Hono)
4. Seed test data (if needed)

**Before Each Test**:
1. Clear database tables
2. Reset auto-increment IDs
3. Clear Redis cache (if applicable)
4. Reset localStorage (for E2E)

**After Each Test**:
1. Clean up test data
2. Close database connections
3. Clear mocks

**After All Tests**:
1. Drop test database (optional)
2. Stop test API server
3. Generate coverage report

---

## Test Data

### Mock User Data (`src/test/utils/mock-data.ts`)

```typescript
export const MOCK_USERS = {
  valid: {
    email: 'test@example.com',
    password: 'SecurePass123',
    fullname: 'Test User'
  },
  unverified: {
    email: 'unverified@example.com',
    password: 'SecurePass123',
    fullname: 'Unverified User',
    verified: false
  },
  with2FA: {
    email: '2fa@example.com',
    password: 'SecurePass123',
    fullname: '2FA User',
    twoFactorEnabled: true
  },
  admin: {
    email: 'admin@example.com',
    password: 'AdminPass123',
    fullname: 'Admin User',
    role: 'admin'
  }
}

export const INVALID_EMAILS = [
  'invalid',
  'invalid@',
  '@example.com',
  'invalid@.com',
  'invalid..email@example.com'
]

export const WEAK_PASSWORDS = [
  '123',
  'pass',
  'short',
  '1234567' // < 8 chars
]

export const SQL_INJECTION_PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "admin'--",
  "' UNION SELECT NULL--"
]
```

---

## Coverage Goals

### Overall Coverage Targets
- **Unit Tests**: 90%+ coverage
- **Integration Tests**: 80%+ coverage
- **E2E Tests**: Critical paths covered

### Critical Areas (100% Coverage)
- Validation schemas
- Authentication functions
- Session management
- Password handling
- Database queries

### Coverage Exclusions
- Type definitions
- Configuration files
- Mock files
- Migration scripts

---

## Test Execution

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run E2E tests only
npm run test:e2e

# Run security tests only
npm run test:security

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run with UI
npm run test:ui
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: ankey_test
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run database migrations
        run: npm run db:migrate:test

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Generate coverage report
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

---

## Test Documentation Standards

### Test Naming Convention
- Use descriptive test names that read like sentences
- Format: `should [expected behavior] when [condition]`
- Example: `should return 401 when password is incorrect`

### Test Organization
```typescript
describe('Feature/Component Name', () => {
  describe('Positive Cases', () => {
    test('should ...')
  })

  describe('Negative Cases', () => {
    test('should fail when ...')
  })

  describe('Edge Cases', () => {
    test('should handle ...')
  })
})
```

### Test Comments
- Explain WHY you're testing something, not WHAT
- Document any non-obvious setup or teardown
- Reference security concerns or business rules

---

## Appendix

### Tools and Libraries

**Testing Frameworks**:
- Vitest - Fast unit test runner
- Supertest - HTTP assertion library
- Playwright - E2E browser testing

**Assertion Libraries**:
- @testing-library/react - React component testing
- @testing-library/jest-dom - Extended matchers
- @testing-library/user-event - User interaction simulation

**Mocking**:
- vi.mock() - Vitest mocking
- msw - API mocking (if needed)

**Database**:
- pg - PostgreSQL client
- Test containers (optional) - Isolated DB instances

### Useful Resources
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-31
**Author**: QA Engineering Team
