# Authentication Module - Testing Suite

Comprehensive testing documentation for the authentication module.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Test Categories](#test-categories)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

This testing suite provides comprehensive coverage for the authentication module including:

- **Unit Tests** (60% of coverage) - Validation schemas, service methods, utilities
- **Integration Tests** (30% of coverage) - API routes, database functions
- **E2E Tests** (10% of coverage) - Complete user journeys
- **Security Tests** - SQL injection, timing attacks, brute force protection

### Technology Stack

- **Vitest** - Fast unit test runner with ESM support
- **Supertest** - HTTP assertion library for API testing
- **Playwright** - E2E browser testing
- **PostgreSQL** - Test database
- **Testing Library** - React component testing utilities

---

## Test Structure

```
src/test/
├── README.md                          # This file
├── TEST_PLAN.md                       # Comprehensive test plan
├── setup.ts                           # Global test setup
│
├── utils/                             # Test utilities
│   ├── mock-data.ts                   # Mock data and fixtures
│   └── test-helpers.ts                # Database helpers, timing utilities
│
├── unit/                              # Unit tests (60% of tests)
│   ├── validation/                    # Valibot schema tests
│   │   └── auth.validation.test.ts
│   ├── services/                      # Service layer tests
│   │   └── auth-service.test.ts
│   ├── stores/                        # State management tests
│   │   └── auth-store.test.ts
│   └── components/                    # React component tests
│       ├── signup.page.test.tsx
│       └── signin.page.test.tsx
│
├── integration/                       # Integration tests (30% of tests)
│   ├── routes/                        # API route tests
│   │   └── auth.routes.test.ts
│   ├── database/                      # Database function tests
│   │   └── auth.functions.test.ts
│   └── flows/                         # Complete flow tests
│       └── signup.flow.test.ts
│
├── e2e/                               # End-to-end tests (10% of tests)
│   ├── signup-journey.spec.ts
│   ├── signin-journey.spec.ts
│   └── profile-update-journey.spec.ts
│
└── security/                          # Security tests
    ├── sql-injection.test.ts
    ├── timing-attacks.test.ts
    ├── brute-force.test.ts
    ├── xss-protection.test.ts
    └── token-leakage.test.ts
```

---

## Setup

### Prerequisites

1. **Node.js** 18+ installed
2. **PostgreSQL** 15+ installed and running
3. **Test database** created

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers (for E2E tests)
npx playwright install
```

### Environment Setup

Create a `.env.test` file:

```env
# Database
DATABASE_URL=postgresql://localhost:5432/ankey_test

# API
VITE_API_URL=http://localhost:3002
API_PORT=3002

# Node environment
NODE_ENV=test

# SMTP (for email testing - optional)
SMTP_HOST=localhost
SMTP_PORT=1025
FROM_EMAIL=test@example.com
```

### Database Setup

```bash
# Create test database
createdb ankey_test

# Run migrations
psql ankey_test < src/api/db/auth.definition.sql
psql ankey_test < src/api/db/auth.functions.sql
psql ankey_test < src/api/db/audit.definition.sql  # If audit module exists
```

### Test Data Seeding (Optional)

```bash
# Seed test data for development
npm run db:seed:test
```

---

## Running Tests

### All Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run with UI
npm run test:ui
```

### By Category

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# Security tests only
npm run test:security
```

### Specific Test Files

```bash
# Run single file
npm test src/test/unit/validation/auth.validation.test.ts

# Run with pattern
npm test -- --grep="signup"

# Run and update snapshots
npm test -- --update
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run in debug mode
npm run test:e2e:debug

# Run specific browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit
```

### Security Tests

```bash
# Run all security tests
npm run test:security

# Run specific security test
npm test src/test/security/sql-injection.test.ts
npm test src/test/security/timing-attacks.test.ts
npm test src/test/security/brute-force.test.ts
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Open coverage report in browser
npm run test:coverage:open

# Generate lcov report (for CI)
npm run test:coverage:lcov
```

---

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual functions and components in isolation

**Location**: `src/test/unit/`

**Examples**:
- Validation schema tests
- Service method tests
- Store action tests
- Component rendering tests

**Run**: `npm run test:unit`

### 2. Integration Tests

**Purpose**: Test interactions between layers (API → DB)

**Location**: `src/test/integration/`

**Examples**:
- API route tests with real DB
- Database function tests
- Multi-step flow tests

**Run**: `npm run test:integration`

**Note**: Requires test database to be running

### 3. E2E Tests

**Purpose**: Test complete user journeys in real browser

**Location**: `src/test/e2e/`

**Examples**:
- Sign up → Verify → Sign in flow
- Profile update journey
- Password reset flow

**Run**: `npm run test:e2e`

**Note**: Requires both test database and API server running

### 4. Security Tests

**Purpose**: Verify security protections are working

**Location**: `src/test/security/`

**Examples**:
- SQL injection prevention
- Timing attack resistance
- Brute force protection
- XSS/CSRF prevention

**Run**: `npm run test:security`

**Context**: All security tests are authorized defensive security testing

---

## Writing Tests

### Unit Test Example

```typescript
import { describe, test, expect } from 'vitest';
import { signUpSchema } from '@/modules/auth/auth.valibot';
import { parse as valibotParse } from 'valibot';

describe('signUpSchema', () => {
  test('should accept valid registration data', () => {
    const validData = {
      fullname: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePass123',
      terms: true,
    };

    expect(() => valibotParse(signUpSchema, validData)).not.toThrow();
  });

  test('should reject invalid email', () => {
    const invalidData = {
      fullname: 'John Doe',
      email: 'invalid-email',
      password: 'SecurePass123',
      terms: true,
    };

    expect(() => valibotParse(signUpSchema, invalidData)).toThrow();
  });
});
```

### Integration Test Example

```typescript
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  clearTestDatabase,
} from '@/test/utils/test-helpers';

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

describe('POST /api/auth.signup', () => {
  test('should create user with valid data', async () => {
    const response = await request(API_URL)
      .post('/api/auth.signup')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123',
        fullname: 'Test User',
      })
      .expect(200);

    expect(response.body.userId).toBeDefined();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('should complete sign up journey', async ({ page }) => {
  // Navigate to sign up
  await page.goto('/auth/signup');

  // Fill form
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'SecurePass123');
  await page.fill('[name="fullname"]', 'Test User');
  await page.check('[name="terms"]');

  // Submit
  await page.click('button[type="submit"]');

  // Verify redirect
  await page.waitForURL('**/auth/verify-account**');
  await expect(page.locator('h1')).toContainText('Verify');
});
```

### Security Test Example

```typescript
import { describe, test, expect } from 'vitest';
import { SQL_INJECTION_PAYLOADS } from '@/test/utils/mock-data';

describe('SQL Injection Prevention', () => {
  test('should safely handle SQL injection in email', async () => {
    for (const payload of SQL_INJECTION_PAYLOADS) {
      const response = await request(API_URL)
        .post('/api/auth.signup')
        .send({
          email: payload,
          password: 'SecurePass123',
          fullname: 'Test User',
        });

      // Should handle safely without exposing DB errors
      expect([200, 400]).toContain(response.status);
    }
  });
});
```

---

## Test Best Practices

### 1. Test Naming

Use descriptive names that explain WHAT and WHY:

```typescript
// ✅ Good
test('should reject passwords shorter than 8 characters')
test('should return 401 when password is incorrect')
test('should not leak information about email existence through timing')

// ❌ Bad
test('password validation')
test('signin test')
test('timing')
```

### 2. Test Organization

Group related tests:

```typescript
describe('signUpSchema', () => {
  describe('Valid Inputs', () => {
    test('should accept valid registration data')
    test('should accept special characters in fullname')
  })

  describe('Invalid Email', () => {
    test('should reject invalid email formats')
    test('should reject empty email')
  })
})
```

### 3. Test Independence

Each test should be independent:

```typescript
// ✅ Good - each test cleans up
beforeEach(async () => {
  await clearTestDatabase();
});

test('test 1', async () => {
  // Create test data
  // Run test
  // Data cleared by beforeEach
});

// ❌ Bad - tests depend on execution order
test('test 1', async () => {
  await createUser('user1');
});

test('test 2', async () => {
  // Assumes user1 exists from test 1
});
```

### 4. Use Test Helpers

Reuse common functionality:

```typescript
// ✅ Good
import { insertTestUser, generateRandomEmail } from '@/test/utils/test-helpers';

test('test', async () => {
  const email = generateRandomEmail();
  await insertTestUser({ email, password: 'test' });
});

// ❌ Bad - duplicate code in every test
test('test', async () => {
  const email = `test-${Date.now()}@example.com`;
  await db.query('INSERT INTO users...');
});
```

### 5. Assert Early and Often

```typescript
// ✅ Good - multiple assertions
test('should create user', async () => {
  const response = await createUser();

  expect(response.status).toBe(200);
  expect(response.body.userId).toBeDefined();
  expect(response.body.email).toBe('test@example.com');

  const user = await getUser(response.body.userId);
  expect(user.verified).toBe(false);
});
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
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
        ports:
          - 5432:5432
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
        run: |
          PGPASSWORD=postgres psql -h localhost -U postgres -d ankey_test < src/api/db/auth.definition.sql
          PGPASSWORD=postgres psql -h localhost -U postgres -d ankey_test < src/api/db/auth.functions.sql

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/ankey_test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Run security tests
        run: npm run test:security

      - name: Generate coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

### Package.json Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:unit": "vitest run src/test/unit",
    "test:integration": "vitest run src/test/integration",
    "test:security": "vitest run src/test/security",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:coverage:open": "vitest run --coverage && open coverage/index.html"
  }
}
```

---

## Troubleshooting

### Test Database Issues

**Problem**: Tests fail with "database does not exist"

**Solution**:
```bash
createdb ankey_test
psql ankey_test < src/api/db/auth.definition.sql
psql ankey_test < src/api/db/auth.functions.sql
```

**Problem**: Tests fail with connection errors

**Solution**: Check PostgreSQL is running and DATABASE_URL is correct:
```bash
pg_isready
psql $DATABASE_URL -c "SELECT 1"
```

### API Server Issues

**Problem**: Integration tests fail with connection refused

**Solution**: Start API server in test mode:
```bash
NODE_ENV=test npm run dev:api
```

### E2E Test Issues

**Problem**: Playwright tests timeout

**Solution**: Increase timeout in `playwright.config.ts`:
```typescript
timeout: 30000 // 30 seconds
```

**Problem**: Browser not found

**Solution**: Install Playwright browsers:
```bash
npx playwright install
```

### Coverage Issues

**Problem**: Coverage report not generated

**Solution**: Install coverage dependencies:
```bash
npm install -D @vitest/coverage-v8
```

### Timing Test Issues

**Problem**: Timing tests are flaky

**Solution**: Timing tests can be sensitive to system load. Run on consistent hardware or increase tolerance:
```typescript
expect(isTimingConsistent(time1, time2, 30)).toBe(true); // 30% tolerance
```

---

## Test Maintenance

### Regular Tasks

1. **Update Test Data**: Keep mock data current with schema changes
2. **Review Security Tests**: Add new attack vectors as discovered
3. **Update E2E Tests**: Keep in sync with UI changes
4. **Clean Test Database**: Periodically reset test database

### When to Update Tests

- ✅ When adding new features
- ✅ When fixing bugs (add regression test)
- ✅ When refactoring code
- ✅ When API contracts change
- ✅ When security vulnerabilities are discovered

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [PostgreSQL Test Best Practices](https://www.postgresql.org/docs/current/regress.html)

---

## Contributing

When adding new tests:

1. Follow existing patterns and structure
2. Use descriptive test names
3. Add comments for complex test logic
4. Update this README if adding new test categories
5. Ensure tests are independent and can run in any order
6. Add to CI/CD pipeline if needed

---

**Last Updated**: 2025-10-31
**Maintained By**: QA Engineering Team
