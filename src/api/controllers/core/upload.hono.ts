import { requireCoreAuth } from '@/api/middleware'
import { FileUploadService } from '@/api/file-upload.settings'
import { createCoreConnection } from '@/api/database.settings'
import { coreUsers } from '@/api/db/schemas/core.drizzle'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

export const coreUploadRoutes = new Hono()
  .use('*', requireCoreAuth)

  // Upload avatar
  .post('/avatar', async c => {
    try {
      const user = c.get('user')
      if (!user) {
        return c.json({ success: false, error: 'User not found' }, 401)
      }

      const formData = await c.req.formData()
      const file = formData.get('avatar') as File

      if (!file) {
        return c.json({ success: false, error: 'No file provided' }, 400)
      }

      const fileUploadService = new FileUploadService()
      const coreDb = createCoreConnection()

      // Get current user's avatar to potentially delete old one
      const currentUser = await coreDb.select().from(coreUsers)
        .where(eq(coreUsers.id, user.id))
        .limit(1)
        .then(rows => rows[0])

      // Upload new avatar (this will also delete old one if exists)
      const uploadResult = await fileUploadService.replaceAvatar(
        currentUser?.avatar || null,
        file
      )

      if (!uploadResult.success) {
        return c.json({ 
          success: false, 
          error: uploadResult.error || 'Upload failed' 
        }, 400)
      }

      // Update user's avatar in database
      await coreDb
        .update(coreUsers)
        .set({ 
          avatar: uploadResult.filePath,
          updatedAt: new Date() 
        })
        .where(eq(coreUsers.id, user.id))

      return c.json({
        success: true,
        data: {
          filePath: uploadResult.filePath,
          url: uploadResult.url,
        },
      })
    } catch (error) {
      console.error('Avatar upload error:', error)
      return c.json({ 
        success: false, 
        error: 'Internal server error' 
      }, 500)
    }
  })

  // Delete avatar
  .delete('/avatar', async c => {
    try {
      const user = c.get('user')
      if (!user) {
        return c.json({ success: false, error: 'User not found' }, 401)
      }

      const coreDb = createCoreConnection()
      const fileUploadService = new FileUploadService()

      // Get current user's avatar
      const currentUser = await coreDb.select().from(coreUsers)
        .where(eq(coreUsers.id, user.id))
        .limit(1)
        .then(rows => rows[0])

      if (currentUser?.avatar) {
        // Delete physical file
        await fileUploadService.deleteFile(currentUser.avatar)
      }

      // Remove avatar reference from database
      await coreDb
        .update(coreUsers)
        .set({ 
          avatar: null,
          updatedAt: new Date() 
        })
        .where(eq(coreUsers.id, user.id))

      return c.json({ success: true })
    } catch (error) {
      console.error('Avatar deletion error:', error)
      return c.json({ 
        success: false, 
        error: 'Internal server error' 
      }, 500)
    }
  })