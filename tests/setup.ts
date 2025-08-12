import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { config } from 'dotenv'

// Load test environment variables
config({ path: '.env.test' })

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test'
  
  // Ensure test database is separate from dev
  if (!process.env.DATABASE_URL?.includes('test')) {
    throw new Error('Test database URL must contain "test" to prevent data loss')
  }
  
  console.log('🧪 Test environment initialized')
})

afterAll(async () => {
  console.log('🧪 Test environment cleanup completed')
})

// Per-test setup
beforeEach(async () => {
  // Reset any global state if needed
})

afterEach(async () => {
  // Cleanup after each test
})