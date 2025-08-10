import { createCoreConnection } from '@/api/database.settings'
import { coreUsers, coreUserSettings } from '@/api/db/schemas/core.drizzle'
import {
  appearanceSettingsSchema,
  contactSettingsSchema,
  passwordChangeSchema,
  personalSettingsSchema,
  profileSettingsSchema,
} from '@/shared'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { requireCoreAuth } from '@/api/middleware'

export const coreSettingsRoutes = new Hono()
  .use('*', requireCoreAuth)

  // Get current user's settings
  .get('/me', async c => {
    try {
      const coreDb = createCoreConnection()
      const user = c.get('user') as any // Get user from context

      const userId = user.id
      const userWithSettings = await coreDb
        .select()
        .from(coreUsers)
        .leftJoin(coreUserSettings, eq(coreUsers.id, coreUserSettings.userId))
        .where(eq(coreUsers.id, userId))
        .then(rows => rows[0])

      if (!userWithSettings) {
        return c.json({ success: false, error: 'User not found' }, 404)
      }

      // Return settings with defaults
      const userInfo = userWithSettings.core_users
      const settingsInfo = userWithSettings.core_user_settings

      const settings = {
        profile: {
          fullName: userInfo.fullName,
          email: userInfo.email,
          avatar: userInfo.avatar || null,
        },
        personal: {
          gender: settingsInfo?.gender || null,
          dateOfBirth: settingsInfo?.dateOfBirth || null,
          timezone: settingsInfo?.timezone || null,
          language: settingsInfo?.language || 'en',
        },
        contact: {
          phone: settingsInfo?.phone || null,
          address: settingsInfo?.address || null,
        },
        appearance: {
          theme: settingsInfo?.theme || 'light',
        },
      }

      return c.json({ success: true, data: settings })
    } catch (error) {
      console.error('Get user settings error:', error)
      return c.json({ success: false, error: 'Internal server error' }, 500)
    }
  })

  // Get profile settings
  .get('/profile', async c => {
    try {
      const coreDb = createCoreConnection()
      const user = c.get('user') as any
      if (!user) {
        return c.json({ success: false, error: 'Unauthorized' }, 401)
      }

      const userId = user.id
      const userRecord = await coreDb
        .select()
        .from(coreUsers)
        .where(eq(coreUsers.id, userId))
        .then(rows => rows[0])

      if (!userRecord) {
        return c.json({ success: false, error: 'User not found' }, 404)
      }

      const profileData = {
        fullName: userRecord.fullName,
        email: userRecord.email,
        avatar: userRecord.avatar ? `/uploads/${userRecord.avatar}` : '',
      }

      return c.json({ success: true, data: profileData })
    } catch (error) {
      console.error('Get profile error:', error)
      return c.json({ success: false, error: 'Internal server error' }, 500)
    }
  })

  // Update profile settings
  .patch('/profile', zValidator('json', profileSettingsSchema), async c => {
    try {
      const coreDb = createCoreConnection()
      const user = c.get('user') as any
      if (!user) {
        return c.json({ success: false, error: 'Unauthorized' }, 401)
      }
      const userId = user.id

      const { fullName, avatar } = c.req.valid('json')
      // Note: email is intentionally excluded - users cannot change their email

      // Update user profile (excluding email)
      await coreDb
        .update(coreUsers)
        .set({
          fullName,
          avatar,
          updatedAt: new Date(),
        })
        .where(eq(coreUsers.id, userId))

      return c.json({ success: true, message: 'Profile updated successfully' })
    } catch (error) {
      console.error('Update profile error:', error)
      return c.json({ success: false, error: 'Internal server error' }, 500)
    }
  })

  // Update personal settings
  .patch('/personal', zValidator('json', personalSettingsSchema), async c => {
    try {
      const coreDb = createCoreConnection()
      const user = c.get('user') as any
      if (!user) {
        return c.json({ success: false, error: 'Unauthorized' }, 401)
      }
      const userId = user.id

      const body = await c.req.json()
      const result = personalSettingsSchema.safeParse(body)

      if (!result.success) {
        return c.json(
          {
            success: false,
            error: 'Validation failed',
            details: result.error.flatten().fieldErrors,
          },
          400
        )
      }

      const { gender, dateOfBirth, timezone, language } = result.data

      // Upsert user settings
      const existingSettings = await coreDb
        .select()
        .from(coreUserSettings)
        .where(eq(coreUserSettings.userId, userId))
        .then(rows => rows[0])

      if (existingSettings) {
        await coreDb
          .update(coreUserSettings)
          .set({
            gender,
            dateOfBirth,
            timezone,
            language,
            updatedAt: new Date(),
          })
          .where(eq(coreUserSettings.userId, userId))
      } else {
        await coreDb.insert(coreUserSettings).values({
          userId,
          gender,
          dateOfBirth,
          timezone,
          language,
        })
      }

      return c.json({ success: true, message: 'Personal settings updated successfully' })
    } catch (error) {
      console.error('Update personal settings error:', error)
      return c.json({ success: false, error: 'Internal server error' }, 500)
    }
  })

  // Update contact settings
  .patch('/contact', zValidator('json', contactSettingsSchema), async c => {
    try {
      const coreDb = createCoreConnection()
      const user = c.get('user') as any
      if (!user) {
        return c.json({ success: false, error: 'Unauthorized' }, 401)
      }
      const userId = user.id

      const body = await c.req.json()
      const result = contactSettingsSchema.safeParse(body)

      if (!result.success) {
        return c.json(
          {
            success: false,
            error: 'Validation failed',
            details: result.error.flatten().fieldErrors,
          },
          400
        )
      }

      const { phone, address } = result.data

      // Upsert user settings
      const existingSettings = await coreDb
        .select()
        .from(coreUserSettings)
        .where(eq(coreUserSettings.userId, userId))
        .then(rows => rows[0])

      const updateData = {
        phone,
        address,
        updatedAt: new Date(),
      }

      if (existingSettings) {
        await coreDb
          .update(coreUserSettings)
          .set(updateData)
          .where(eq(coreUserSettings.userId, userId))
      } else {
        await coreDb.insert(coreUserSettings).values({ userId, ...updateData })
      }

      return c.json({ success: true, message: 'Contact settings updated successfully' })
    } catch (error) {
      console.error('Update contact settings error:', error)
      return c.json({ success: false, error: 'Internal server error' }, 500)
    }
  })

  // Update appearance settings
  .patch('/appearance', zValidator('json', appearanceSettingsSchema), async c => {
    try {
      const coreDb = createCoreConnection()
      const user = c.get('user') as any
      if (!user) {
        return c.json({ success: false, error: 'Unauthorized' }, 401)
      }
      const userId = user.id

      const body = await c.req.json()
      const result = appearanceSettingsSchema.safeParse(body)

      if (!result.success) {
        return c.json(
          {
            success: false,
            error: 'Validation failed',
            details: result.error.flatten().fieldErrors,
          },
          400
        )
      }

      const { theme } = result.data

      // Upsert user settings
      const existingSettings = await coreDb
        .select()
        .from(coreUserSettings)
        .where(eq(coreUserSettings.userId, userId))
        .then(rows => rows[0])

      const updateData = {
        theme,
        updatedAt: new Date(),
      }

      if (existingSettings) {
        await coreDb
          .update(coreUserSettings)
          .set(updateData)
          .where(eq(coreUserSettings.userId, userId))
      } else {
        await coreDb.insert(coreUserSettings).values({ userId, ...updateData })
      }

      return c.json({ success: true, message: 'Appearance settings updated successfully' })
    } catch (error) {
      console.error('Update appearance settings error:', error)
      return c.json({ success: false, error: 'Internal server error' }, 500)
    }
  })

  // Change password
  .patch('/password', zValidator('json', passwordChangeSchema), async c => {
    try {
      const coreDb = createCoreConnection()
      const user = c.get('user') as any
      if (!user) {
        return c.json({ success: false, error: 'Unauthorized' }, 401)
      }
      const userId = user.id

      const body = await c.req.json()
      console.log('Password change request body:', { ...body, currentPassword: '[HIDDEN]', newPassword: '[HIDDEN]', confirmPassword: '[HIDDEN]' })
      
      const result = passwordChangeSchema.safeParse(body)

      if (!result.success) {
        console.error('Password change validation failed:', result.error.issues)
        return c.json(
          {
            success: false,
            error: 'Validation failed',
            details: result.error.flatten().fieldErrors,
            issues: result.error.issues,
          },
          400
        )
      }

      const { currentPassword, newPassword, confirmPassword } = result.data
      
      // Double-check password confirmation (frontend should already validate this)
      if (newPassword !== confirmPassword) {
        return c.json({ success: false, error: 'Password confirmation does not match' }, 400)
      }

      // Get current user record
      const userRecord = await coreDb
        .select()
        .from(coreUsers)
        .where(eq(coreUsers.id, userId))
        .then(rows => rows[0])

      if (!userRecord) {
        return c.json({ success: false, error: 'User not found' }, 404)
      }

      // Verify current password using Bun's password methods
      const isValidPassword = await Bun.password.verify(currentPassword, userRecord.passwordHash)

      if (!isValidPassword) {
        return c.json({ success: false, error: 'Current password is incorrect' }, 400)
      }

      // Hash new password using Bun's password methods
      const hashedPassword = await Bun.password.hash(newPassword)

      // Update password
      await coreDb
        .update(coreUsers)
        .set({
          passwordHash: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(coreUsers.id, userId))

      return c.json({ success: true, message: 'Password changed successfully' })
    } catch (error) {
      console.error('Change password error:', error)
      return c.json({ success: false, error: 'Internal server error' }, 500)
    }
  })
