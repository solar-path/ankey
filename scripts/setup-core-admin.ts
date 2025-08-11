#!/usr/bin/env bun

import { TenantService } from '../src/api/tenant.settings'

async function setupCoreAdmin() {
  console.log('🚀 Setting up core admin user...')

  const tenantService = new TenantService()

  const result = await tenantService.createCoreAdmin({
    email: 'itgroup.luck@gmail.com',
    password: 'Mir@nd@32',
    fullName: 'Core Administrator',
  })

  if (result.success) {
    console.log('✅ Core admin user created successfully!')
    console.log('📧 Email: itgroup.luck@gmail.com')
    console.log('🔑 Password: Mir@nd@32')
    console.log('⚠️  Please change the password after first login')
  } else {
    console.error('❌ Failed to create core admin:', result.error)
  }

  process.exit(result.success ? 0 : 1)
}

setupCoreAdmin().catch(console.error)
