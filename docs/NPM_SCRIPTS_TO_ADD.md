# NPM Scripts to Add to package.json

Add these scripts to your `package.json` file to enable the complete testing suite.

## Scripts to Add

```json
{
  "scripts": {
    // Existing test scripts (keep these)
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",

    // NEW: Add these test scripts
    "test:unit": "vitest run src/test/unit",
    "test:integration": "vitest run src/test/integration",
    "test:security": "vitest run src/test/security",
    "test:watch": "vitest",
    "test:coverage:open": "vitest run --coverage && open coverage/index.html",

    // E2E tests with Playwright
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:chromium": "playwright test --project=chromium",
    "test:e2e:firefox": "playwright test --project=firefox",
    "test:e2e:webkit": "playwright test --project=webkit",

    // Test database management
    "db:test:create": "createdb ankey_test",
    "db:test:drop": "dropdb ankey_test",
    "db:test:migrate": "psql ankey_test < src/api/db/auth.definition.sql && psql ankey_test < src/api/db/auth.functions.sql",
    "db:test:reset": "npm run db:test:drop && npm run db:test:create && npm run db:test:migrate",

    // API server for testing
    "dev:api:test": "NODE_ENV=test API_PORT=3002 DATABASE_URL=postgresql://localhost:5432/ankey_test bun run src/api/server.ts"
  }
}
```

## Dependencies to Install

### Testing Dependencies

```bash
# Core testing libraries (already installed)
# vitest, @testing-library/react, @testing-library/jest-dom

# Integration testing
npm install -D supertest @types/supertest

# E2E testing
npm install -D @playwright/test

# PostgreSQL for integration tests
npm install -D pg @types/pg

# Coverage (if not installed)
npm install -D @vitest/coverage-v8
```

### Complete Install Command

```bash
npm install -D supertest @types/supertest @playwright/test pg @types/pg @vitest/coverage-v8
```

## Install Playwright Browsers

```bash
npx playwright install
```

## Updated package.json Scripts Section

Replace your entire `"scripts"` section with this:

```json
{
  "scripts": {
    // Development
    "dev": "bun run kill-ports && bun run dev:all",
    "dev:all": "bun run --bun dev:api & bun run dev:vite",
    "dev:api": "bun run src/api/server.ts",
    "dev:vite": "vite",
    "dev:api:test": "NODE_ENV=test API_PORT=3002 DATABASE_URL=postgresql://localhost:5432/ankey_test bun run src/api/server.ts",
    "kill-ports": "lsof -ti:5173,3001,3002 | xargs kill -9 2>/dev/null || true",

    // Build
    "build": "(tsc -b && vite build) 2>&1 | tee docs/debug.txt",
    "lint": "eslint .",
    "preview": "vite preview",

    // Database - Development
    "import:data": "bun run scripts/import-data.ts",
    "seed:reference": "bun run scripts/seed-reference-data.ts",
    "db:drop": "bun run src/api/db/drop.ts",
    "db:migrate": "bun run src/api/db/migrate.ts",
    "db:seed": "bun run src/api/db/seed.ts",
    "db:seed:reference": "psql -U postgres -d ankey -f src/api/db/reference.seed.sql",
    "db:reset": "bun run db:drop && bun run db:migrate && bun run db:seed && bun run db:seed:reference",
    "db:deploy:supabase": "bun run src/api/db/deploy-to-supabase.ts",
    "db:supabase:permissions": "bun run src/api/db/setup-supabase-permissions.ts",

    // Database - Testing
    "db:test:create": "createdb ankey_test",
    "db:test:drop": "dropdb ankey_test || true",
    "db:test:migrate": "psql ankey_test < src/api/db/auth.definition.sql && psql ankey_test < src/api/db/auth.functions.sql",
    "db:test:reset": "npm run db:test:drop && npm run db:test:create && npm run db:test:migrate",

    // Testing - Core
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:coverage:open": "vitest run --coverage && open coverage/index.html",

    // Testing - By Category
    "test:unit": "vitest run src/test/unit",
    "test:integration": "vitest run src/test/integration",
    "test:security": "vitest run src/test/security",

    // Testing - E2E
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:chromium": "playwright test --project=chromium",
    "test:e2e:firefox": "playwright test --project=firefox",
    "test:e2e:webkit": "playwright test --project=webkit",
    "test:e2e:mobile": "playwright test --project='Mobile Chrome' --project='Mobile Safari'",

    // Testing - All
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e && npm run test:security"
  }
}
```

## Environment Variables

Create `.env.test` file:

```bash
cat > .env.test << 'EOF'
# Database
DATABASE_URL=postgresql://localhost:5432/ankey_test

# API
VITE_API_URL=http://localhost:3002
API_PORT=3002

# Node environment
NODE_ENV=test

# SMTP (optional - for email testing)
SMTP_HOST=localhost
SMTP_PORT=1025
FROM_EMAIL=test@example.com
FROM_NAME=Test System

# Application
APP_URL=http://localhost:5173
EOF
```

## Verification

After adding scripts, verify they work:

```bash
# 1. Setup test database
npm run db:test:create
npm run db:test:migrate

# 2. Run tests
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:security

# 3. Check coverage
npm run test:coverage
```

## .gitignore Updates

Add to `.gitignore`:

```
# Test coverage
coverage/
.nyc_output/

# Playwright
test-results/
playwright-report/
playwright/.cache/

# Test environment
.env.test.local

# Test database dumps
*.sql.dump
```

## VS Code Settings (Optional)

Add to `.vscode/settings.json`:

```json
{
  "vitest.enable": true,
  "vitest.commandLine": "npm run test",
  "playwright.reuseBrowser": true,
  "testing.automaticallyOpenPeekView": "failureInVisibleDocument"
}
```

## GitHub Actions Workflow (Optional)

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

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

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: npm run db:test:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/ankey_test

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/ankey_test

      - name: Run security tests
        run: npm run test:security
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/ankey_test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Generate coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Complete Setup Checklist

- [ ] Add scripts to package.json
- [ ] Install dependencies (`npm install -D ...`)
- [ ] Install Playwright browsers (`npx playwright install`)
- [ ] Create `.env.test` file
- [ ] Setup test database (`npm run db:test:create && npm run db:test:migrate`)
- [ ] Update `.gitignore`
- [ ] Add VS Code settings (optional)
- [ ] Add GitHub Actions workflow (optional)
- [ ] Run tests to verify (`npm test`)
- [ ] Check coverage (`npm run test:coverage`)

## Quick Start After Setup

```bash
# Full test suite
npm test

# By category
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:security

# With coverage
npm run test:coverage
```

---

**Last Updated**: 2025-10-31
