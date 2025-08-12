import type { LoginData, ResetPasswordData, TwoFactorCodeData } from '@/shared'
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle'
import crypto from 'crypto'
import { eq, and } from 'drizzle-orm'
import { Lucia } from 'lucia'
import { createCoreConnection, createTenantConnection } from './database.settings'
import * as coreSchema from './db/schemas/core.drizzle'
import * as tenantSchema from './db/schemas/tenant.drizzle'
import { TwoFactorService } from './two-factor.service'
import { EmailService } from './email.settings'

// Core authentication for admin users
export function createCoreAuth() {
  const db = createCoreConnection()

  const adapter = new DrizzlePostgreSQLAdapter(db, coreSchema.coreSessions, coreSchema.coreUsers)

  return new Lucia(adapter, {
    sessionCookie: {
      attributes: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? '.ankey.com' : 'localhost',
      },
    },
    getUserAttributes: attributes => {
      return {
        id: attributes.id,
        email: attributes.email,
        fullName: attributes.fullName,
        avatar: attributes.avatar,
        isActive: attributes.isActive,
        emailVerified: attributes.emailVerified,
        twoFactorEnabled: attributes.twoFactorEnabled,
        passwordExpiryDays: attributes.passwordExpiryDays,
        passwordChangedAt: attributes.passwordChangedAt,
      }
    },
  })
}

// Tenant authentication for workspace users
export function createTenantAuth(tenantDatabase: string) {
  const db = createTenantConnection(tenantDatabase)

  const adapter = new DrizzlePostgreSQLAdapter(db, tenantSchema.sessions, tenantSchema.users)

  return new Lucia(adapter, {
    sessionCookie: {
      attributes: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    },
    getUserAttributes: attributes => {
      return {
        id: attributes.id,
        email: attributes.email,
        fullName: attributes.fullName,
        avatar: attributes.avatar,
        isActive: attributes.isActive,
        emailVerified: attributes.emailVerified,
        twoFactorEnabled: attributes.twoFactorEnabled,
        passwordExpiryDays: attributes.passwordExpiryDays,
        passwordChangedAt: attributes.passwordChangedAt,
        isApproved: attributes.isApproved,
      }
    },
  })
}

// Utility functions
export const hashPassword = async (password: string): Promise<string> => {
  // Use Bun if available, otherwise use a fallback for Node.js
  if (typeof Bun !== 'undefined') {
    return await Bun.password.hash(password, {
      algorithm: 'argon2id',
      memoryCost: 4096,
      timeCost: 3,
    })
  } else {
    // Fallback for Node.js - use crypto with a simple hash
    // Note: In production, you should use a proper password hashing library like bcrypt or argon2
    const crypto = await import('crypto')
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
    return `${salt}:${hash}`
  }
}

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  // Use Bun if available, otherwise use a fallback for Node.js
  if (typeof Bun !== 'undefined') {
    return await Bun.password.verify(password, hash)
  } else {
    // Fallback for Node.js
    const crypto = await import('crypto')
    const [salt, storedHash] = hash.split(':')
    const newHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
    return newHash === storedHash
  }
}

export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

// Core authentication service
export class CoreAuthService {
  private db = createCoreConnection()
  private lucia = createCoreAuth()

  async login(data: LoginData) {
    try {
      const user = await this.db
        .select()
        .from(coreSchema.coreUsers)
        .where(eq(coreSchema.coreUsers.email, data.email))
        .limit(1)
        .then(rows => rows[0])

      if (!user || !user.isActive) {
        return { success: false, error: 'Invalid credentials' }
      }

      const validPassword = await verifyPassword(data.password, user.passwordHash!)
      if (!validPassword) {
        return { success: false, error: 'Invalid credentials' }
      }

      if (!user.emailVerified) {
        return { success: false, error: 'Email not verified' }
      }

      // Handle two-factor authentication if enabled
      if (user.twoFactorEnabled && !data.twoFactorCode) {
        return { success: false, error: 'Two-factor code required', requiresTwoFactor: true }
      }

      if (user.twoFactorEnabled && data.twoFactorCode) {
        const isValidCode = await this.verify2FACode(user.id, data.twoFactorCode)
        if (!isValidCode) {
          return { success: false, error: 'Invalid two-factor code' }
        }
      }

      const session = await this.lucia.createSession(user.id as string, {})
      const sessionCookie = this.lucia.createSessionCookie(session.id)

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            avatar: user.avatar,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            twoFactorEnabled: user.twoFactorEnabled,
          },
          sessionCookie: sessionCookie.serialize(),
        },
      }
    } catch (error) {
      console.error('Core login error:', error)
      return { success: false, error: 'Login failed' }
    }
  }

  async logout(sessionId: string) {
    try {
      await this.lucia.invalidateSession(sessionId)
      const sessionCookie = this.lucia.createBlankSessionCookie()
      return {
        success: true,
        sessionCookie: sessionCookie.serialize(),
      }
    } catch (error) {
      console.error('Core logout error:', error)
      return { success: false, error: 'Logout failed' }
    }
  }

  async validateSession(sessionId: string) {
    try {
      const { session, user } = await this.lucia.validateSession(sessionId)

      // If session is valid but user is missing email, fetch it manually from database
      // This ensures we always have complete user data even if Lucia's getUserAttributes isn't working properly
      if (session && user && !user.email && user.id) {
        const dbUser = await this.db
          .select()
          .from(coreSchema.coreUsers)
          .where(eq(coreSchema.coreUsers.id, user.id))
          .limit(1)
          .then(rows => rows[0])

        if (dbUser) {
          // Return user with complete data from database
          const completeUser = {
            id: dbUser.id,
            email: dbUser.email,
            fullName: dbUser.fullName,
            avatar: dbUser.avatar,
            isActive: dbUser.isActive,
            emailVerified: dbUser.emailVerified,
            twoFactorEnabled: dbUser.twoFactorEnabled,
          }

          return { session, user: completeUser }
        }
      }

      return { session, user }
    } catch (error) {
      console.error('Session validation error:', error)
      return { session: null, user: null }
    }
  }

  async createPasswordResetToken(email: string) {
    try {
      const user = await this.db
        .select()
        .from(coreSchema.coreUsers)
        .where(eq(coreSchema.coreUsers.email, email))
        .limit(1)
        .then(rows => rows[0])

      if (!user) {
        // Don't reveal if user exists or not
        return { success: true, message: 'If the email exists, a reset link has been sent' }
      }

      const token = generateSecureToken()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await this.db.insert(coreSchema.passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      })

      return { success: true, token, userId: user.id }
    } catch (error) {
      console.error('Password reset token creation error:', error)
      return { success: false, error: 'Failed to create reset token' }
    }
  }

  async resetPassword(data: ResetPasswordData) {
    try {
      const tokenRecord = await this.db
        .select()
        .from(coreSchema.passwordResetTokens)
        .where(eq(coreSchema.passwordResetTokens.token, data.token))
        .leftJoin(
          coreSchema.coreUsers,
          eq(coreSchema.passwordResetTokens.userId, coreSchema.coreUsers.id)
        )
        .limit(1)
        .then(rows =>
          rows[0] ? { ...rows[0].password_reset_tokens, user: rows[0].core_users } : undefined
        )

      if (!tokenRecord || tokenRecord.used || tokenRecord.expiresAt < new Date()) {
        return { success: false, error: 'Invalid or expired token' }
      }

      const passwordHash = await hashPassword(data.password)

      await this.db.transaction(async tx => {
        // Update password
        await tx
          .update(coreSchema.coreUsers)
          .set({ passwordHash, updatedAt: new Date() })
          .where(eq(coreSchema.coreUsers.id, tokenRecord.userId))

        // Mark token as used
        await tx
          .update(coreSchema.passwordResetTokens)
          .set({ used: true })
          .where(eq(coreSchema.passwordResetTokens.id, tokenRecord.id))

        // Invalidate all sessions
        await tx
          .delete(coreSchema.coreSessions)
          .where(eq(coreSchema.coreSessions.userId, tokenRecord.userId))
      })

      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      return { success: false, error: 'Password reset failed' }
    }
  }

  async setup2FA(userId: string, userEmail: string) {
    try {
      const setupData = await TwoFactorService.generateTOTPSetup(userEmail)

      return {
        success: true,
        data: setupData,
      }
    } catch (error) {
      console.error('2FA setup error:', error)
      return { success: false, error: 'Failed to setup 2FA' }
    }
  }

  async enable2FA(userId: string, secret: string, code: string, backupCodes: string[]) {
    try {
      // Verify the TOTP code before enabling
      const isValidCode = TwoFactorService.verifyTOTP(secret, code)
      if (!isValidCode) {
        return { success: false, error: 'Invalid verification code' }
      }

      // Hash backup codes
      const hashedBackupCodes = TwoFactorService.hashBackupCodes(backupCodes)

      // Enable 2FA in database
      await this.db
        .update(coreSchema.coreUsers)
        .set({
          twoFactorEnabled: true,
          twoFactorSecret: secret,
          twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
          updatedAt: new Date(),
        })
        .where(eq(coreSchema.coreUsers.id, userId))

      return { success: true }
    } catch (error) {
      console.error('2FA enable error:', error)
      return { success: false, error: 'Failed to enable 2FA' }
    }
  }

  async disable2FA(userId: string, password: string) {
    try {
      // Verify current password
      const user = await this.db
        .select()
        .from(coreSchema.coreUsers)
        .where(eq(coreSchema.coreUsers.id, userId))
        .limit(1)
        .then(rows => rows[0])

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      const validPassword = await verifyPassword(password, user.passwordHash)
      if (!validPassword) {
        return { success: false, error: 'Invalid password' }
      }

      // Disable 2FA
      await this.db
        .update(coreSchema.coreUsers)
        .set({
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: null,
          updatedAt: new Date(),
        })
        .where(eq(coreSchema.coreUsers.id, userId))

      return { success: true }
    } catch (error) {
      console.error('2FA disable error:', error)
      return { success: false, error: 'Failed to disable 2FA' }
    }
  }

  async verify2FACode(userId: string, code: string) {
    try {
      const user = await this.db
        .select({
          twoFactorSecret: coreSchema.coreUsers.twoFactorSecret,
          twoFactorBackupCodes: coreSchema.coreUsers.twoFactorBackupCodes,
        })
        .from(coreSchema.coreUsers)
        .where(eq(coreSchema.coreUsers.id, userId))
        .limit(1)
        .then(rows => rows[0])

      if (!user || !user.twoFactorSecret) {
        return false
      }

      // First try TOTP verification
      const isValidTOTP = TwoFactorService.verifyTOTP(user.twoFactorSecret, code)
      if (isValidTOTP) {
        return true
      }

      // If TOTP fails, try backup codes
      if (user.twoFactorBackupCodes) {
        const backupCodes = JSON.parse(user.twoFactorBackupCodes)
        const isValidBackupCode = TwoFactorService.verifyBackupCode(backupCodes, code)

        if (isValidBackupCode) {
          // Remove used backup code
          const remainingCodes = TwoFactorService.removeUsedBackupCode(backupCodes, code)

          await this.db
            .update(coreSchema.coreUsers)
            .set({
              twoFactorBackupCodes: JSON.stringify(remainingCodes),
              updatedAt: new Date(),
            })
            .where(eq(coreSchema.coreUsers.id, userId))

          return true
        }
      }

      return false
    } catch (error) {
      console.error('2FA verification error:', error)
      return false
    }
  }

  async sendEmail2FA(userId: string) {
    try {
      const user = await this.db
        .select({
          email: coreSchema.coreUsers.email,
          fullName: coreSchema.coreUsers.fullName,
        })
        .from(coreSchema.coreUsers)
        .where(eq(coreSchema.coreUsers.id, userId))
        .limit(1)
        .then(rows => rows[0])

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      const { token, expiresAt } = TwoFactorService.generateEmailToken()

      // Store token in database
      await this.db.insert(coreSchema.emailTwoFactorTokens).values({
        userId,
        token,
        expiresAt,
      })

      // Send email
      const emailService = new EmailService()
      await emailService.sendTwoFactorCode({
        to: user.email,
        fullName: user.fullName,
        code: token,
      })

      return { success: true, expiresAt }
    } catch (error) {
      console.error('Email 2FA error:', error)
      return { success: false, error: 'Failed to send email 2FA code' }
    }
  }

  async verifyEmail2FA(userId: string, code: string) {
    try {
      const tokenRecord = await this.db
        .select()
        .from(coreSchema.emailTwoFactorTokens)
        .where(
          and(
            eq(coreSchema.emailTwoFactorTokens.userId, userId),
            eq(coreSchema.emailTwoFactorTokens.token, code),
            eq(coreSchema.emailTwoFactorTokens.used, false)
          )
        )
        .limit(1)
        .then(rows => rows[0])

      if (!tokenRecord) {
        return { success: false, error: 'Invalid code' }
      }

      const isValid = TwoFactorService.verifyEmailToken(
        tokenRecord.token,
        code,
        tokenRecord.expiresAt,
        tokenRecord.used
      )

      if (!isValid) {
        return { success: false, error: 'Invalid or expired code' }
      }

      // Mark token as used
      await this.db
        .update(coreSchema.emailTwoFactorTokens)
        .set({ used: true })
        .where(eq(coreSchema.emailTwoFactorTokens.id, tokenRecord.id))

      return { success: true }
    } catch (error) {
      console.error('Email 2FA verification error:', error)
      return { success: false, error: 'Failed to verify email 2FA code' }
    }
  }

  async regenerateBackupCodes(userId: string) {
    try {
      const backupCodes = Array.from({ length: 10 }, () =>
        crypto.randomBytes(4).toString('hex').toUpperCase()
      )

      const hashedBackupCodes = TwoFactorService.hashBackupCodes(backupCodes)

      await this.db
        .update(coreSchema.coreUsers)
        .set({
          twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
          updatedAt: new Date(),
        })
        .where(eq(coreSchema.coreUsers.id, userId))

      return { success: true, backupCodes }
    } catch (error) {
      console.error('Backup codes regeneration error:', error)
      return { success: false, error: 'Failed to regenerate backup codes' }
    }
  }

  async updatePasswordExpirySettings(userId: string, passwordExpiryDays: number) {
    try {
      await this.db
        .update(coreSchema.coreUsers)
        .set({
          passwordExpiryDays,
          updatedAt: new Date(),
        })
        .where(eq(coreSchema.coreUsers.id, userId))

      return { success: true, message: 'Password expiry settings updated successfully' }
    } catch (error) {
      console.error('Password expiry settings update error:', error)
      return { success: false, error: 'Failed to update password expiry settings' }
    }
  }

  async getPasswordStatus(userId: string) {
    try {
      const user = await this.db.query.coreUsers.findFirst({
        where: eq(coreSchema.coreUsers.id, userId),
        columns: {
          passwordExpiryDays: true,
          passwordChangedAt: true,
        },
      })

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      if (user.passwordExpiryDays === 0) {
        return {
          success: true,
          data: {
            passwordExpiryDays: user.passwordExpiryDays,
            passwordChangedAt: user.passwordChangedAt,
            isExpired: false,
            daysUntilExpiry: null,
            showWarning: false,
          },
        }
      }

      const passwordChangedAt = new Date(user.passwordChangedAt)
      const expiryDate = new Date(passwordChangedAt.getTime() + user.passwordExpiryDays * 24 * 60 * 60 * 1000)
      const now = new Date()
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

      return {
        success: true,
        data: {
          passwordExpiryDays: user.passwordExpiryDays,
          passwordChangedAt: user.passwordChangedAt,
          expiryDate,
          isExpired: daysUntilExpiry <= 0,
          daysUntilExpiry,
          showWarning: daysUntilExpiry <= 7 && daysUntilExpiry > 0,
        },
      }
    } catch (error) {
      console.error('Password status check error:', error)
      return { success: false, error: 'Failed to check password status' }
    }
  }
}

// Tenant authentication service
export class TenantAuthService {
  private db
  private lucia

  constructor(tenantDatabase: string) {
    this.db = createTenantConnection(tenantDatabase)
    this.lucia = createTenantAuth(tenantDatabase)
  }

  async login(data: LoginData) {
    try {
      const user = await this.db.query.users.findFirst({
        where: eq(tenantSchema.users.email, data.email),
      })

      if (!user || !user.isActive || !user.isApproved) {
        return { success: false, error: 'Invalid credentials or account not approved' }
      }

      if (!user.passwordHash) {
        return { success: false, error: 'Account setup not completed' }
      }

      const validPassword = await verifyPassword(data.password, user.passwordHash!)
      if (!validPassword) {
        return { success: false, error: 'Invalid credentials' }
      }

      if (!user.emailVerified) {
        return { success: false, error: 'Email not verified' }
      }

      // Handle two-factor authentication if enabled
      if (user.twoFactorEnabled && !data.twoFactorCode) {
        return { success: false, error: 'Two-factor code required', requiresTwoFactor: true }
      }

      if (user.twoFactorEnabled && data.twoFactorCode) {
        const isValidCode = await this.verify2FACode(user.id, data.twoFactorCode)
        if (!isValidCode) {
          return { success: false, error: 'Invalid two-factor code' }
        }
      }

      const session = await this.lucia.createSession(user.id as string, {})
      const sessionCookie = this.lucia.createSessionCookie(session.id)

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            twoFactorEnabled: user.twoFactorEnabled,
            isApproved: user.isApproved,
          },
          sessionCookie: sessionCookie.serialize(),
        },
      }
    } catch (error) {
      console.error('Tenant login error:', error)
      return { success: false, error: 'Login failed' }
    }
  }

  async logout(sessionId: string) {
    try {
      await this.lucia.invalidateSession(sessionId)
      const sessionCookie = this.lucia.createBlankSessionCookie()
      return {
        success: true,
        sessionCookie: sessionCookie.serialize(),
      }
    } catch (error) {
      console.error('Tenant logout error:', error)
      return { success: false, error: 'Logout failed' }
    }
  }

  async validateSession(sessionId: string) {
    try {
      const { session, user } = await this.lucia.validateSession(sessionId)
      return { session, user }
    } catch (error) {
      console.error('Session validation error:', error)
      return { session: null, user: null }
    }
  }

  async createPasswordResetToken(email: string) {
    try {
      const user = await this.db.query.users.findFirst({
        where: eq(tenantSchema.users.email, email),
      })

      if (!user) {
        return { success: true, message: 'If the email exists, a reset link has been sent' }
      }

      const token = generateSecureToken()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await this.db.insert(tenantSchema.tenantPasswordResetTokens).values({
        userId: user.id as string,
        token,
        expiresAt,
      })

      return { success: true, token, userId: user.id }
    } catch (error) {
      console.error('Tenant password reset token creation error:', error)
      return { success: false, error: 'Failed to create reset token' }
    }
  }

  async resetPassword(data: ResetPasswordData) {
    try {
      const tokenRecord = await this.db
        .select()
        .from(tenantSchema.tenantPasswordResetTokens)
        .where(eq(tenantSchema.tenantPasswordResetTokens.token, data.token))
        .leftJoin(
          tenantSchema.users,
          eq(tenantSchema.tenantPasswordResetTokens.userId, tenantSchema.users.id)
        )
        .limit(1)
        .then(rows =>
          rows[0] ? { ...rows[0].password_reset_tokens, user: rows[0].users } : undefined
        )

      if (!tokenRecord || tokenRecord.used || tokenRecord.expiresAt < new Date()) {
        return { success: false, error: 'Invalid or expired token' }
      }

      const passwordHash = await hashPassword(data.password)

      await this.db.transaction(async tx => {
        // Update password
        await tx
          .update(tenantSchema.users)
          .set({ passwordHash, updatedAt: new Date() })
          .where(eq(tenantSchema.users.id, tokenRecord.userId))

        // Mark token as used
        await tx
          .update(tenantSchema.tenantPasswordResetTokens)
          .set({ used: true })
          .where(eq(tenantSchema.tenantPasswordResetTokens.id, tokenRecord.id))

        // Invalidate all sessions
        await tx
          .delete(tenantSchema.sessions)
          .where(eq(tenantSchema.sessions.userId, tokenRecord.userId))
      })

      return { success: true }
    } catch (error) {
      console.error('Tenant password reset error:', error)
      return { success: false, error: 'Password reset failed' }
    }
  }

  // 2FA methods for tenant users (similar to core but using tenant schema)
  async setup2FA(userId: string, userEmail: string) {
    try {
      const setupData = await TwoFactorService.generateTOTPSetup(userEmail)

      return {
        success: true,
        data: setupData,
      }
    } catch (error) {
      console.error('Tenant 2FA setup error:', error)
      return { success: false, error: 'Failed to setup 2FA' }
    }
  }

  async enable2FA(userId: string, secret: string, code: string, backupCodes: string[]) {
    try {
      const isValidCode = TwoFactorService.verifyTOTP(secret, code)
      if (!isValidCode) {
        return { success: false, error: 'Invalid verification code' }
      }

      const hashedBackupCodes = TwoFactorService.hashBackupCodes(backupCodes)

      await this.db
        .update(tenantSchema.users)
        .set({
          twoFactorEnabled: true,
          twoFactorSecret: secret,
          twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
          updatedAt: new Date(),
        })
        .where(eq(tenantSchema.users.id, userId))

      return { success: true }
    } catch (error) {
      console.error('Tenant 2FA enable error:', error)
      return { success: false, error: 'Failed to enable 2FA' }
    }
  }

  async disable2FA(userId: string, password: string) {
    try {
      const user = await this.db.query.users.findFirst({
        where: eq(tenantSchema.users.id, userId),
      })

      if (!user || !user.passwordHash) {
        return { success: false, error: 'User not found or no password set' }
      }

      const validPassword = await verifyPassword(password, user.passwordHash)
      if (!validPassword) {
        return { success: false, error: 'Invalid password' }
      }

      await this.db
        .update(tenantSchema.users)
        .set({
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: null,
          updatedAt: new Date(),
        })
        .where(eq(tenantSchema.users.id, userId))

      return { success: true }
    } catch (error) {
      console.error('Tenant 2FA disable error:', error)
      return { success: false, error: 'Failed to disable 2FA' }
    }
  }

  async verify2FACode(userId: string, code: string) {
    try {
      const user = await this.db
        .select({
          twoFactorSecret: tenantSchema.users.twoFactorSecret,
          twoFactorBackupCodes: tenantSchema.users.twoFactorBackupCodes,
        })
        .from(tenantSchema.users)
        .where(eq(tenantSchema.users.id, userId))
        .limit(1)
        .then(rows => rows[0])

      if (!user || !user.twoFactorSecret) {
        return false
      }

      // First try TOTP verification
      const isValidTOTP = TwoFactorService.verifyTOTP(user.twoFactorSecret, code)
      if (isValidTOTP) {
        return true
      }

      // If TOTP fails, try backup codes
      if (user.twoFactorBackupCodes) {
        const backupCodes = JSON.parse(user.twoFactorBackupCodes)
        const isValidBackupCode = TwoFactorService.verifyBackupCode(backupCodes, code)

        if (isValidBackupCode) {
          const remainingCodes = TwoFactorService.removeUsedBackupCode(backupCodes, code)

          await this.db
            .update(tenantSchema.users)
            .set({
              twoFactorBackupCodes: JSON.stringify(remainingCodes),
              updatedAt: new Date(),
            })
            .where(eq(tenantSchema.users.id, userId))

          return true
        }
      }

      return false
    } catch (error) {
      console.error('Tenant 2FA verification error:', error)
      return false
    }
  }

  async sendEmail2FA(userId: string) {
    try {
      const user = await this.db
        .select({
          email: tenantSchema.users.email,
          fullName: tenantSchema.users.fullName,
        })
        .from(tenantSchema.users)
        .where(eq(tenantSchema.users.id, userId))
        .limit(1)
        .then(rows => rows[0])

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      const { token, expiresAt } = TwoFactorService.generateEmailToken()

      await this.db.insert(tenantSchema.tenantEmailTwoFactorTokens).values({
        userId,
        token,
        expiresAt,
      })

      const emailService = new EmailService()
      await emailService.sendTwoFactorCode({
        to: user.email,
        fullName: user.fullName,
        code: token,
      })

      return { success: true, expiresAt }
    } catch (error) {
      console.error('Tenant Email 2FA error:', error)
      return { success: false, error: 'Failed to send email 2FA code' }
    }
  }

  async verifyEmail2FA(userId: string, code: string) {
    try {
      const tokenRecord = await this.db
        .select()
        .from(tenantSchema.tenantEmailTwoFactorTokens)
        .where(
          and(
            eq(tenantSchema.tenantEmailTwoFactorTokens.userId, userId),
            eq(tenantSchema.tenantEmailTwoFactorTokens.token, code),
            eq(tenantSchema.tenantEmailTwoFactorTokens.used, false)
          )
        )
        .limit(1)
        .then(rows => rows[0])

      if (!tokenRecord) {
        return { success: false, error: 'Invalid code' }
      }

      const isValid = TwoFactorService.verifyEmailToken(
        tokenRecord.token,
        code,
        tokenRecord.expiresAt,
        tokenRecord.used
      )

      if (!isValid) {
        return { success: false, error: 'Invalid or expired code' }
      }

      await this.db
        .update(tenantSchema.tenantEmailTwoFactorTokens)
        .set({ used: true })
        .where(eq(tenantSchema.tenantEmailTwoFactorTokens.id, tokenRecord.id))

      return { success: true }
    } catch (error) {
      console.error('Tenant Email 2FA verification error:', error)
      return { success: false, error: 'Failed to verify email 2FA code' }
    }
  }

  async regenerateBackupCodes(userId: string) {
    try {
      const backupCodes = Array.from({ length: 10 }, () =>
        crypto.randomBytes(4).toString('hex').toUpperCase()
      )

      const hashedBackupCodes = TwoFactorService.hashBackupCodes(backupCodes)

      await this.db
        .update(tenantSchema.users)
        .set({
          twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
          updatedAt: new Date(),
        })
        .where(eq(tenantSchema.users.id, userId))

      return { success: true, backupCodes }
    } catch (error) {
      console.error('Tenant backup codes regeneration error:', error)
      return { success: false, error: 'Failed to regenerate backup codes' }
    }
  }
}

// Type declarations for Lucia
declare module 'lucia' {
  interface Register {
    Lucia: ReturnType<typeof createCoreAuth> | ReturnType<typeof createTenantAuth>
    DatabaseUserAttributes: {
      id: string
      email: string
      fullName: string
      avatar: string | null
      isActive: boolean
      emailVerified: boolean
      twoFactorEnabled: boolean
      passwordExpiryDays: number
      passwordChangedAt: Date
      isApproved?: boolean
    }
  }
}
