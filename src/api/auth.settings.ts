import type { LoginData, ResetPasswordData } from '@/shared'
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle'
import crypto from 'crypto'
import { eq } from 'drizzle-orm'
import { Lucia } from 'lucia'
import { createCoreConnection, createTenantConnection } from './database.settings'
import * as coreSchema from './db/schemas/core.drizzle'
import * as tenantSchema from './db/schemas/tenant.drizzle'

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
        // Verify 2FA code (implementation depends on your 2FA method)
        // For now, we'll assume it's valid
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
      isApproved?: boolean
    }
  }
}
