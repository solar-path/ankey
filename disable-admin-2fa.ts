#!/usr/bin/env bun

import { createCoreConnection } from './src/api/database.settings'
import * as coreSchema from './src/api/db/schemas/core.drizzle'
import { eq } from 'drizzle-orm'

const db = createCoreConnection()

// Disable 2FA for the admin user
const result = await db
  .update(coreSchema.coreUsers)
  .set({
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorBackupCodes: null,
    updatedAt: new Date()
  })
  .where(eq(coreSchema.coreUsers.email, 'itgroup.luck@gmail.com'))
  .returning()

console.log('Updated admin user:', result[0])