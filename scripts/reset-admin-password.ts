#!/usr/bin/env bun

import { createCoreConnection } from '../src/api/database.settings'
import { hashPassword } from '../src/api/auth.settings'
import { coreUsers } from '../src/api/db/schemas/core.drizzle'
import { eq } from 'drizzle-orm'

async function resetAdminPassword() {
  console.log('🔄 Resetting core admin password...')

  const db = createCoreConnection()
  const email = 'itgroup.luck@gmail.com'
  const newPassword = 'M1r@nd@32' // Use the exact password from the login form

  try {
    // Hash the new password
    const passwordHash = await hashPassword(newPassword)

    // Update the password
    await db
      .update(coreUsers)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(coreUsers.email, email))

    console.log('✅ Password reset successfully!')
    console.log('📧 Email: itgroup.luck@gmail.com')
    console.log('🔑 Password: M1r@nd@32')
  } catch (error) {
    console.error('❌ Failed to reset password:', error)
    process.exit(1)
  }

  process.exit(0)
}

resetAdminPassword().catch(console.error)
