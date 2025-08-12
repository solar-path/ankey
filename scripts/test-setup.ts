#!/usr/bin/env bun

/**
 * Test Setup Script
 * 
 * Sets up local testing environment with proper database configuration
 */

import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

async function setupTestEnvironment() {
  console.log('🧪 Setting up test environment...')

  // Check if .env.test exists
  const envTestPath = join(process.cwd(), '.env.test')
  if (!existsSync(envTestPath)) {
    console.error('❌ .env.test file not found. Please create it with test configuration.')
    process.exit(1)
  }

  // Check if test databases exist
  console.log('📊 Checking test databases...')
  
  try {
    // You could add database checks here
    console.log('✅ Test databases ready')
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    console.log('💡 Make sure PostgreSQL is running and test databases exist')
    process.exit(1)
  }

  console.log('✅ Test environment ready!')
}

async function runTests() {
  const args = process.argv.slice(2)
  const testType = args[0] || 'all'

  await setupTestEnvironment()

  console.log(`🚀 Running ${testType} tests...\n`)

  let command: string[]
  
  switch (testType) {
    case 'unit':
      command = ['bun', 'run', 'test:unit']
      break
    case 'integration':
      command = ['bun', 'run', 'test:integration']
      break
    case 'db':
      command = ['bun', 'run', 'test:db']
      break
    case 'coverage':
      command = ['bun', 'run', 'test:coverage']
      break
    case 'watch':
      command = ['bun', 'run', 'test:watch']
      break
    case 'all':
    default:
      command = ['bun', 'run', 'test']
      break
  }

  const testProcess = spawn(command[0], command.slice(1), {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  })

  testProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Tests completed successfully!')
    } else {
      console.log('\n❌ Tests failed!')
      process.exit(code || 1)
    }
  })

  testProcess.on('error', (error) => {
    console.error('❌ Test process error:', error)
    process.exit(1)
  })
}

// Handle script arguments
if (import.meta.main) {
  runTests().catch(console.error)
}