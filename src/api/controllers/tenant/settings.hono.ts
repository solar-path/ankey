import { createTenantConnection } from '@/api/database.settings'
import { users, userSettings } from '@/api/db/schemas/tenant.drizzle'
import {
  appearanceSettingsSchema,
  contactSettingsSchema,
  passwordChangeSchema,
  personalSettingsSchema,
  profileSettingsSchema,
} from '@/shared'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { requireTenantAuth } from '@/api/middleware'

export const tenantSettingsRoutes = new Hono()
  .use('*', requireTenantAuth)

  // Get current user's settings
  .get('/me', async c => {
    try {
      const user = c.get('user') as any
      const tenantDatabase = c.get('tenantDatabase')

      if (!user) {
        return c.json({ success: false, error: 'Unauthorized' }, 401)
      }

      if (!tenantDatabase) {
        return c.json({ success: false, error: 'Tenant context required' }, 400)
      }

      const userId = user.id
      const tenantDb = createTenantConnection(tenantDatabase)

      const userWithSettings = await tenantDb
        .select()
        .from(users)
        .leftJoin(userSettings, eq(users.id, userSettings.userId))
        .where(eq(users.id, userId))
        .then(rows => rows[0])

      if (!userWithSettings) {
        return c.json({ success: false, error: 'User not found' }, 404)
      }

      // Return settings with defaults
      const userInfo = userWithSettings.users
      const settingsInfo = userWithSettings.user_settings

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
          emergencyContact: settingsInfo?.emergencyContactName
            ? {
                name: settingsInfo.emergencyContactName,
                phone: settingsInfo.emergencyContactPhone || '',
                relationship: settingsInfo.emergencyContactRelationship || '',
              }
            : null,
        },
        appearance: {
          theme: settingsInfo?.theme || 'system',
          density: settingsInfo?.density || 'comfortable',
          primaryColor: settingsInfo?.primaryColor || '#000000',
          fontSize: settingsInfo?.fontSize || 'medium',
          sidebarCollapsed: settingsInfo?.sidebarCollapsed || false,
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
      const user = c.get('user') as any
      const tenantDatabase = c.get('tenantDatabase')

      if (!user) {
        return c.json({ success: false, error: 'Unauthorized' }, 401)
      }

      if (!tenantDatabase) {
        return c.json({ success: false, error: 'Tenant context required' }, 400)
      }

      const userId = user.id
      const tenantDb = createTenantConnection(tenantDatabase)

      const userRecord = await tenantDb
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .then(rows => rows[0])

      if (!userRecord) {
        return c.json({ success: false, error: 'User not found' }, 404)
      }

      const profileData = {
        fullName: userRecord.fullName,
        email: userRecord.email,
        avatar: userRecord.avatar || '',
      }

      return c.json({ success: true, data: profileData })
    } catch (error) {
      console.error('Get profile error:', error)
      return c.json({ success: false, error: 'Internal server error' }, 500)
    }
  })

  // Update profile settings
  .patch('/profile', async c => {
    try {
      const user = c.get('user') as any
      const tenantDatabase = c.get('tenantDatabase')

      if (!user) {
        return c.json({ success: false, error: 'Unauthorized' }, 401)
      }
      const userId = user.id

      if (!tenantDatabase) {
        return c.json({ success: false, error: 'Tenant context required' }, 400)
      }

      const body = await c.req.json()
      const result = profileSettingsSchema.safeParse(body)

      if (!result.success) {
        return c.json(
          {
            success: false,
            error: 'Validation failed',
            details: result.error.issues,
          },
          400
        )
      }

      const { fullName, email, avatar } = result.data
      const tenantDb = createTenantConnection(tenantDatabase)

      // Update user profile
      await tenantDb
        .update(users)
        .set({
          fullName,
          email,
          avatar,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))

      return c.json({ success: true, message: 'Profile updated successfully' })
    } catch (error) {
      console.error('Update profile error:', error)
      return c.json({ success: false, error: 'Internal server error' }, 500)
    }
  })

  // Update personal settings
  .patch('/personal', async c => {
    try {
      const user = c.get('user') as any
      const tenantDatabase = c.get('tenantDatabase')

      if (!user) {
        return c.json({ success: false, error: 'Unauthorized' }, 401)
      }
      const userId = user.id

      if (!tenantDatabase) {
        return c.json({ success: false, error: 'Tenant context required' }, 400)
      }

      const body = await c.req.json()
      const result = personalSettingsSchema.safeParse(body)

      if (!result.success) {
        return c.json(
          {
            success: false,
            error: 'Validation failed',
            details: result.error.issues,
          },
          400
        )
      }

      const { gender, dateOfBirth, timezone, language } = result.data
      const tenantDb = createTenantConnection(tenantDatabase)

      // Upsert user settings
      const existingSettings = await tenantDb
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .then(rows => rows[0])

      if (existingSettings) {
        await tenantDb
          .update(userSettings)
          .set({
            gender,
            dateOfBirth,
            timezone,
            language,
            updatedAt: new Date(),
          })
          .where(eq(userSettings.userId, userId))
      } else {
        await tenantDb.insert(userSettings).values({
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
  .patch('/contact', async c => {
    try {
      const user = c.get('user') as any
      const tenantDatabase = c.get('tenantDatabase')

      if (!user) {
        return c.json({ success: false, error: 'Unauthorized' }, 401)
      }
      const userId = user.id

      if (!tenantDatabase) {
        return c.json({ success: false, error: 'Tenant context required' }, 400)
      }

      const body = await c.req.json()
      const result = contactSettingsSchema.safeParse(body)

      if (!result.success) {
        return c.json(
          {
            success: false,
            error: 'Validation failed',
            details: result.error.issues,
          },
          400
        )
      }

      const { phone, address, emergencyContact } = result.data
      const tenantDb = createTenantConnection(tenantDatabase)

      // Upsert user settings
      const existingSettings = await tenantDb
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .then(rows => rows[0])

      const updateData = {
        phone,
        address,
        emergencyContactName: emergencyContact?.name || null,
        emergencyContactPhone: emergencyContact?.phone || null,
        emergencyContactRelationship: emergencyContact?.relationship || null,
        updatedAt: new Date(),
      }

      if (existingSettings) {
        await tenantDb.update(userSettings).set(updateData).where(eq(userSettings.userId, userId))
      } else {
        await tenantDb.insert(userSettings).values({ userId, ...updateData })
      }

      return c.json({ success: true, message: 'Contact settings updated successfully' })
    } catch (error) {
      console.error('Update contact settings error:', error)
      return c.json({ success: false, error: 'Internal server error' }, 500)
    }
  })

  // Update appearance settings
  .patch('/appearance', async c => {
    try {
      const user = c.get('user') as any
      const tenantDatabase = c.get('tenantDatabase')

      if (!user) {
        return c.json({ success: false, error: 'Unauthorized' }, 401)
      }
      const userId = user.id

      if (!tenantDatabase) {
        return c.json({ success: false, error: 'Tenant context required' }, 400)
      }

      const body = await c.req.json()
      const result = appearanceSettingsSchema.safeParse(body)

      if (!result.success) {
        return c.json(
          {
            success: false,
            error: 'Validation failed',
            details: result.error.issues,
          },
          400
        )
      }

      const { theme, density, primaryColor, fontSize, sidebarCollapsed } = result.data
      const tenantDb = createTenantConnection(tenantDatabase)

      // Upsert user settings
      const existingSettings = await tenantDb
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .then(rows => rows[0])

      const updateData = {
        theme,
        density,
        primaryColor,
        fontSize,
        sidebarCollapsed,
        updatedAt: new Date(),
      }

      if (existingSettings) {
        await tenantDb.update(userSettings).set(updateData).where(eq(userSettings.userId, userId))
      } else {
        await tenantDb.insert(userSettings).values({ userId, ...updateData })
      }

      return c.json({ success: true, message: 'Appearance settings updated successfully' })
    } catch (error) {
      console.error('Update appearance settings error:', error)
      return c.json({ success: false, error: 'Internal server error' }, 500)
    }
  })

  // Change password
  .patch('/password', async c => {
    try {
      const user = c.get('user') as any
      const tenantDatabase = c.get('tenantDatabase')

      if (!user) {
        return c.json({ success: false, error: 'Unauthorized' }, 401)
      }
      const userId = user.id

      if (!tenantDatabase) {
        return c.json({ success: false, error: 'Tenant context required' }, 400)
      }

      const body = await c.req.json()
      const result = passwordChangeSchema.safeParse(body)

      if (!result.success) {
        return c.json(
          {
            success: false,
            error: 'Validation failed',
            details: result.error.issues,
          },
          400
        )
      }

      const { currentPassword, newPassword } = result.data
      const tenantDb = createTenantConnection(tenantDatabase)

      // Get current user record
      const userRecord = await tenantDb
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .then(rows => rows[0])

      if (!userRecord) {
        return c.json({ success: false, error: 'User not found' }, 404)
      }

      if (!userRecord.passwordHash) {
        return c.json({ success: false, error: 'Password not set for this user' }, 400)
      }

      // Verify current password using Bun's password methods
      const isValidPassword = await Bun.password.verify(currentPassword, userRecord.passwordHash)

      if (!isValidPassword) {
        return c.json({ success: false, error: 'Current password is incorrect' }, 400)
      }

      // Hash new password using Bun's password methods
      const hashedPassword = await Bun.password.hash(newPassword)

      // Update password
      await tenantDb
        .update(users)
        .set({
          passwordHash: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))

      return c.json({ success: true, message: 'Password changed successfully' })
    } catch (error) {
      console.error('Change password error:', error)
      return c.json({ success: false, error: 'Internal server error' }, 500)
    }
  })
