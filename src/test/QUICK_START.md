# Testing Quick Start Guide

Quick reference for running tests in the authentication module.

## Prerequisites

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install

# 3. Create test database
createdb ankey_test

# 4. Run migrations
psql ankey_test < src/api/db/auth.definition.sql
psql ankey_test < src/api/db/auth.functions.sql

# 5. Create .env.test file
cat > .env.test << EOF
DATABASE_URL=postgresql://localhost:5432/ankey_test
VITE_API_URL=http://localhost:3002
API_PORT=3002
NODE_ENV=test
EOF
```

## Quick Test Commands

### Run All Tests

```bash
npm test                    # Run all tests once
npm run test:watch          # Run in watch mode
npm run test:ui             # Run with UI interface
npm run test:coverage       # Run with coverage report
```

### Run By Category

```bash
npm run test:unit           # Unit tests only (~60% of tests)
npm run test:integration    # Integration tests (~30% of tests)
npm run test:e2e            # E2E tests (~10% of tests)
npm run test:security       # Security tests
```

### Run Specific Tests

```bash
# Run single file
npm test src/test/unit/validation/auth.validation.test.ts

# Run with pattern
npm test -- --grep="signup"

# Run E2E in headed mode (see browser)
npm run test:e2e:headed
```

## Test Categories

### 1. Unit Tests (Fast - ~1-2 seconds)

Tests validation schemas, services, and components in isolation.

```bash
npm run test:unit

# Specific unit tests
npm test src/test/unit/validation/auth.validation.test.ts
npm test src/test/unit/services/auth-service.test.ts
```

**Coverage**: Validation logic, service methods, state management

### 2. Integration Tests (Medium - ~5-10 seconds)

Tests API routes with real database calls.

```bash
npm run test:integration

# Requires: Test database running
npm test src/test/integration/routes/auth.routes.test.ts
```

**Coverage**: HTTP endpoints, database functions, complete flows

### 3. E2E Tests (Slow - ~30-60 seconds)

Tests complete user journeys in real browsers.

```bash
npm run test:e2e

# With browser visible
npm run test:e2e:headed

# Debug mode (step through)
npm run test:e2e:debug

# Specific browser
npm run test:e2e -- --project=chromium
```

**Coverage**: User signup, signin, verification, profile updates

### 4. Security Tests (Medium - ~10-20 seconds)

Tests security protections and vulnerabilities.

```bash
npm run test:security

# Specific security tests
npm test src/test/security/sql-injection.test.ts
npm test src/test/security/timing-attacks.test.ts
npm test src/test/security/brute-force.test.ts
```

**Coverage**: SQL injection, timing attacks, brute force, XSS, CSRF

## Common Workflows

### Before Committing

```bash
# Run all tests
npm test

# If tests pass, check coverage
npm run test:coverage
```

### After Feature Development

```bash
# 1. Run unit tests
npm run test:unit

# 2. Run integration tests
npm run test:integration

# 3. Run E2E tests
npm run test:e2e

# 4. Check coverage
npm run test:coverage
```

### Security Testing

```bash
# Run all security tests
npm run test:security

# Or run individually
npm test src/test/security/sql-injection.test.ts
npm test src/test/security/timing-attacks.test.ts
npm test src/test/security/brute-force.test.ts
```

### Debugging Failing Tests

```bash
# 1. Run in watch mode
npm run test:watch

# 2. Run with UI
npm run test:ui

# 3. Run specific failing test
npm test path/to/failing/test.ts

# 4. For E2E tests, use debug mode
npm run test:e2e:debug
```

## Test Files Overview

```
src/test/
├── unit/
│   ├── validation/
│   │   └── auth.validation.test.ts         # ✅ Valibot schemas
│   └── services/
│       └── auth-service.test.ts            # ✅ Service methods
│
├── integration/
│   └── routes/
│       └── auth.routes.test.ts             # ✅ API endpoints
│
├── e2e/
│   └── signup-journey.spec.ts              # ✅ Complete user flows
│
└── security/
    ├── sql-injection.test.ts               # ✅ SQL injection prevention
    ├── timing-attacks.test.ts              # ✅ Timing attack resistance
    └── brute-force.test.ts                 # ✅ Brute force protection
```

## Test Coverage Goals

- **Overall**: 80%+ line coverage
- **Critical paths**: 100% coverage (auth, session, password)
- **Unit tests**: 90%+ coverage
- **Integration tests**: 80%+ coverage

Check coverage:
```bash
npm run test:coverage
```

## Troubleshooting

### Tests Fail with Database Errors

```bash
# Check database is running
pg_isready

# Recreate test database
dropdb ankey_test
createdb ankey_test
psql ankey_test < src/api/db/auth.definition.sql
psql ankey_test < src/api/db/auth.functions.sql
```

### E2E Tests Timeout

```bash
# Increase timeout in playwright.config.ts
# Or run in headed mode to see what's happening
npm run test:e2e:headed
```

### Integration Tests Fail

```bash
# Make sure API server is running in test mode
NODE_ENV=test npm run dev:api

# Check .env.test has correct DATABASE_URL
cat .env.test
```

## CI/CD

Tests run automatically on:
- Push to main branch
- Pull requests
- Pre-merge checks

View results in GitHub Actions.

## Need Help?

- 📖 Full documentation: [README.md](./README.md)
- 📋 Test plan: [TEST_PLAN.md](./TEST_PLAN.md)
- 🔍 Test utilities: [utils/test-helpers.ts](./utils/test-helpers.ts)

## Test Statistics

| Category      | Count | Coverage Goal | Typical Runtime |
|---------------|-------|---------------|-----------------|
| Unit          | ~30   | 90%+          | 1-2 seconds     |
| Integration   | ~20   | 80%+          | 5-10 seconds    |
| E2E           | ~5    | Critical paths| 30-60 seconds   |
| Security      | ~15   | 100%          | 10-20 seconds   |
| **Total**     | **~70**| **80%+**     | **1-2 minutes** |

---

**Last Updated**: 2025-10-31
