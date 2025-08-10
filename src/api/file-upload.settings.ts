import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

interface UploadResult {
  success: boolean
  filePath?: string
  url?: string
  error?: string
}

interface UploadOptions {
  maxSize?: number // in bytes
  allowedTypes?: string[]
  directory?: string
}

export class FileUploadService {
  private readonly baseUploadDir: string
  private readonly publicUrl: string

  constructor() {
    this.baseUploadDir = path.join(process.cwd(), 'public', 'uploads')
    this.publicUrl = '/uploads'
  }

  async uploadFile(
    file: File,
    category: string = 'general',
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      // Default options
      const {
        maxSize = 2 * 1024 * 1024, // 2MB
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        directory = category,
      } = options

      // Validate file size
      if (file.size > maxSize) {
        return {
          success: false,
          error: `File size too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`,
        }
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        }
      }

      // Generate unique filename
      const fileExtension = path.extname(file.name)
      const uniqueId = randomUUID()
      const timestamp = Date.now()
      const filename = `${timestamp}-${uniqueId}${fileExtension}`

      // Create target directory
      const targetDir = path.join(this.baseUploadDir, directory)
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }

      // Full file path
      const filePath = path.join(targetDir, filename)
      const relativePath = path.join(directory, filename).replace(/\\/g, '/') // Normalize path separators
      const publicUrl = `${this.publicUrl}/${relativePath}`

      // Write file to disk
      const buffer = await file.arrayBuffer()
      fs.writeFileSync(filePath, new Uint8Array(buffer))

      return {
        success: true,
        filePath: relativePath,
        url: publicUrl,
      }
    } catch (error) {
      console.error('File upload error:', error)
      return {
        success: false,
        error: 'Failed to upload file',
      }
    }
  }

  async deleteFile(relativePath: string): Promise<boolean> {
    try {
      if (!relativePath) return false

      const fullPath = path.join(this.baseUploadDir, relativePath)

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
        return true
      }
      return false
    } catch (error) {
      console.error('File deletion error:', error)
      return false
    }
  }

  getPublicUrl(relativePath: string): string {
    if (!relativePath) return ''
    return `${this.publicUrl}/${relativePath}`
  }

  // Clean up old avatar when user updates
  async replaceAvatar(oldPath: string | null, newFile: File): Promise<UploadResult> {
    // Upload new avatar
    const uploadResult = await this.uploadFile(newFile, 'avatars', {
      maxSize: 2 * 1024 * 1024, // 2MB for avatars
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    })

    // If upload successful and there was an old avatar, delete it
    if (uploadResult.success && oldPath) {
      await this.deleteFile(oldPath)
    }

    return uploadResult
  }
}
