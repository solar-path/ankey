#!/usr/bin/env bun

import { createCoreConnection } from './src/api/database.settings'
import * as coreSchema from './src/api/db/schemas/core.drizzle'
import { eq } from 'drizzle-orm'

const db = createCoreConnection()

const adminUser = await db.query.coreUsers.findFirst({
  where: eq(coreSchema.coreUsers.email, 'itgroup.luck@gmail.com')
})

console.log('Admin user:', adminUser)