# Testing Guide

This document outlines the comprehensive testing strategy for the multi-tenant application.

## Quick Start

```bash
# Run all tests
bun run test

# Run tests with UI
bun run test:ui

# Run with coverage
bun run test:coverage

# Watch mode for development
bun run test:watch
```

## Test Categories

### 1. Unit Tests (`tests/unit/`)

- **Purpose**: Test individual functions and services in isolation
- **Location**: `tests/unit/`
- **Run**: `bun run test:unit`
- **Coverage**: Business logic, utilities, validation schemas

**Example**:

```bash
bun run test:unit
# Tests PlanLimitsService, utility functions, validation logic
```

### 2. Integration Tests (`tests/integration/`)

- **Purpose**: Test API endpoints and service interactions
- **Location**: `tests/integration/`
- **Run**: `bun run test:integration`
- **Coverage**: API routes, authentication, database interactions

**Example**:

```bash
bun run test:integration
# Tests /api/tenant-users, /api/tenant-companies, auth flows
```

### 3. Database Tests (`tests/database/`)

- **Purpose**: Test database schema, migrations, and relationships
- **Location**: `tests/database/`
- **Run**: `bun run test:db`
- **Coverage**: Migrations, relationships, constraints

## Test Setup

### Environment Configuration

1. **Copy test environment**:

   ```bash
   cp .env.test .env.test.local
   ```

2. **Configure test databases**:

   ```bash
   # PostgreSQL test databases
   createdb ankey_test_core
   createdb ankey_test_tenant_default
   ```

3. **Update `.env.test.local`**:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/ankey_test_core
   TENANT_DATABASE_PREFIX=ankey_test_tenant
   ```

### Database Setup

The testing framework automatically:

- ✅ Sets up test database connections
- ✅ Runs migrations before tests
- ✅ Clears data between tests
- ✅ Provides test data fixtures

## Test Structure

```
tests/
├── fixtures/
│   ├── database.ts          # Database test utilities
│   └── data.ts              # Test data fixtures
├── unit/
│   └── services/
│       └── plan-limits.service.test.ts
├── integration/
│   ├── api-test-helper.ts   # API testing utilities
│   ├── auth.test.ts         # Authentication tests
│   ├── tenant-users.test.ts # User management tests
│   ├── tenant-companies.test.ts # Company tests
│   └── tenant-usage.test.ts # Usage limit tests
└── setup.ts                 # Global test setup
```

## Key Testing Areas

### 1. Plan Limits Enforcement

Tests the core business logic for subscription limits:

```typescript
// Example test
it('should prevent adding users when at limit', async () => {
  await createTestUsers(5) // Max for micro plan

  const result = await service.canAddUser(tenantId)

  expect(result.allowed).toBe(false)
  expect(result.reason).toContain('User limit reached')
})
```

**Coverage**:

- ✅ User creation limits
- ✅ Company creation limits
- ✅ Plan upgrade/downgrade scenarios
- ✅ Usage percentage calculations
- ✅ Edge cases (unlimited plans)

### 2. Multi-Tenant Isolation

Ensures proper data separation:

```typescript
// Example test
it('should isolate tenant data', async () => {
  const tenant1Data = await getTenantData(tenant1.id)
  const tenant2Data = await getTenantData(tenant2.id)

  expect(tenant1Data).not.toContain(tenant2Data)
})
```

**Coverage**:

- ✅ Database routing validation
- ✅ Cross-tenant access prevention
- ✅ Authentication context switching
- ✅ Data isolation verification

### 3. API Security & Authentication

Tests authentication and authorization:

```typescript
// Example test
it('should require authentication', async () => {
  const response = await unauthenticatedRequest(app).get('/api/tenant-users')

  expect(response.status).toBe(401)
})
```

**Coverage**:

- ✅ Authentication flows (core vs tenant)
- ✅ Session management
- ✅ Permission validation (RBAC)
- ✅ Input validation
- ✅ Security headers

### 4. Critical User Flows

Tests end-to-end scenarios:

**Coverage**:

- ✅ Workspace creation & setup
- ✅ User invitation & onboarding
- ✅ Company management
- ✅ Subscription changes
- ✅ Error handling

## Test Data Management

### Fixtures

Predefined test data in `tests/fixtures/data.ts`:

```typescript
export const testUsers = {
  admin: { email: 'admin@test.com', ... },
  owner: { email: 'owner@test.com', ... },
  member: { email: 'member@test.com', ... },
}

export const testPlans = {
  micro: { maxUsers: 5, maxCompanies: 3, ... },
  small: { maxUsers: 49, maxCompanies: 5, ... },
}
```

### Database Utilities

Helper functions for test data:

```typescript
// Create test tenant with plan
const tenant = await createTestTenant(planId)

// Create test users
const users = await createTestUsers(3)

// Create test companies
const companies = await createTestCompanies(2, createdBy)
```

## Running Tests

### Local Development

```bash
# Quick unit tests during development
bun run test:quick

# Full test suite with coverage
bun run test:full

# Watch mode for TDD
bun run test:watch

# Interactive UI
bun run test:ui
```

### CI/CD Pipeline

The GitHub Actions workflow automatically:

1. ✅ Sets up PostgreSQL service
2. ✅ Installs dependencies
3. ✅ Runs TypeScript checks
4. ✅ Runs linting
5. ✅ Executes all test suites
6. ✅ Generates coverage reports
7. ✅ Builds the application

### Coverage Reports

Coverage thresholds are set at **70%** for:

- Branches
- Functions
- Lines
- Statements

View coverage:

```bash
bun run test:coverage
open coverage/index.html
```

## Best Practices

### Writing Tests

1. **Use descriptive test names**:

   ```typescript
   it('should prevent adding users when at plan limit', async () => {
   ```

2. **Follow AAA pattern** (Arrange, Act, Assert):

   ```typescript
   // Arrange
   await createTestUsers(5)

   // Act
   const result = await service.canAddUser(tenantId)

   // Assert
   expect(result.allowed).toBe(false)
   ```

3. **Test edge cases**:
   ```typescript
   it('should handle unlimited plans', async () => {
   it('should handle missing data gracefully', async () => {
   it('should handle concurrent operations', async () => {
   ```

### Test Isolation

- ✅ Each test has fresh database state
- ✅ No shared mutable state between tests
- ✅ Proper cleanup after each test
- ✅ Independent test execution

### Performance

- ✅ Parallel test execution where safe
- ✅ Database pooling for speed
- ✅ Minimal test data creation
- ✅ Efficient cleanup strategies

## Troubleshooting

### Common Issues

1. **Database connection errors**:

   ```bash
   # Check PostgreSQL is running
   pg_isready -h localhost -p 5432

   # Verify test databases exist
   psql -l | grep ankey_test
   ```

2. **Test timeouts**:

   ```bash
   # Increase timeout in vitest.config.ts
   testTimeout: 10000
   ```

3. **Port conflicts**:
   ```bash
   # Check if test port is available
   lsof -i :3001
   ```

### Debug Mode

```bash
# Run tests with debug output
DEBUG=test:* bun run test

# Run specific test file
bun run test tests/unit/services/plan-limits.service.test.ts

# Run with verbose output
bun run test --reporter=verbose
```

## Future Enhancements

### Planned Additions

- [ ] E2E tests with Playwright
- [ ] Load testing with k6
- [ ] Visual regression testing
- [ ] Contract testing with Pact
- [ ] Mutation testing with Stryker

### Performance Testing

- [ ] API response time benchmarks
- [ ] Database query performance
- [ ] Memory usage monitoring
- [ ] Concurrent user simulation

This comprehensive testing strategy ensures your multi-tenant application behaves correctly, performs well, and maintains security across all user scenarios.
