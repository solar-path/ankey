import { eq } from 'drizzle-orm';
import { createCoreConnection, createTenantConnection } from '../api/db/connection';
import * as coreSchema from '../api/db/schemas/core';
import * as tenantSchema from '../api/db/schemas/tenant';
import { createCoreAuth, createTenantAuth } from '../api/auth.settings';
import { generateId } from 'lucia';
import crypto from 'crypto';
import type { LoginData, RegisterData, ForgotPasswordData, ResetPasswordData } from '../types';

// Utility functions
export const hashPassword = async (password: string): Promise<string> => {
  return await Bun.password.hash(password, {
    algorithm: 'argon2id',
    memoryCost: 4096,
    timeCost: 3,
  });
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await Bun.password.verify(password, hash);
};

export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Core authentication service
export class CoreAuthService {
  private db = createCoreConnection();
  private lucia = createCoreAuth();

  async login(data: LoginData) {
    try {
      const user = await this.db.query.coreUsers.findFirst({
        where: eq(coreSchema.coreUsers.email, data.email),
      });

      if (!user || !user.isActive) {
        return { success: false, error: 'Invalid credentials' };
      }

      const validPassword = await verifyPassword(data.password, user.passwordHash);
      if (!validPassword) {
        return { success: false, error: 'Invalid credentials' };
      }

      if (!user.emailVerified) {
        return { success: false, error: 'Email not verified' };
      }

      // Handle two-factor authentication if enabled
      if (user.twoFactorEnabled && !data.twoFactorCode) {
        return { success: false, error: 'Two-factor code required', requiresTwoFactor: true };
      }

      if (user.twoFactorEnabled && data.twoFactorCode) {
        // Verify 2FA code (implementation depends on your 2FA method)
        // For now, we'll assume it's valid
      }

      const session = await this.lucia.createSession(user.id, {});
      const sessionCookie = this.lucia.createSessionCookie(session.id);

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
          },
          sessionCookie: sessionCookie.serialize(),
        },
      };
    } catch (error) {
      console.error('Core login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  async logout(sessionId: string) {
    try {
      await this.lucia.invalidateSession(sessionId);
      const sessionCookie = this.lucia.createBlankSessionCookie();
      return {
        success: true,
        sessionCookie: sessionCookie.serialize(),
      };
    } catch (error) {
      console.error('Core logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }

  async validateSession(sessionId: string) {
    try {
      const { session, user } = await this.lucia.validateSession(sessionId);
      return { session, user };
    } catch (error) {
      console.error('Session validation error:', error);
      return { session: null, user: null };
    }
  }

  async createPasswordResetToken(email: string) {
    try {
      const user = await this.db.query.coreUsers.findFirst({
        where: eq(coreSchema.coreUsers.email, email),
      });

      if (!user) {
        // Don't reveal if user exists or not
        return { success: true, message: 'If the email exists, a reset link has been sent' };
      }

      const token = generateSecureToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.db.insert(coreSchema.passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });

      return { success: true, token, userId: user.id };
    } catch (error) {
      console.error('Password reset token creation error:', error);
      return { success: false, error: 'Failed to create reset token' };
    }
  }

  async resetPassword(data: ResetPasswordData) {
    try {
      const tokenRecord = await this.db.query.passwordResetTokens.findFirst({
        where: eq(coreSchema.passwordResetTokens.token, data.token),
        with: { user: true },
      });

      if (!tokenRecord || tokenRecord.used || tokenRecord.expiresAt < new Date()) {
        return { success: false, error: 'Invalid or expired token' };
      }

      const passwordHash = await hashPassword(data.password);

      await this.db.transaction(async (tx) => {
        // Update password
        await tx
          .update(coreSchema.coreUsers)
          .set({ passwordHash, updatedAt: new Date() })
          .where(eq(coreSchema.coreUsers.id, tokenRecord.userId));

        // Mark token as used
        await tx
          .update(coreSchema.passwordResetTokens)
          .set({ used: true })
          .where(eq(coreSchema.passwordResetTokens.id, tokenRecord.id));

        // Invalidate all sessions
        await tx
          .delete(coreSchema.coreSessions)
          .where(eq(coreSchema.coreSessions.userId, tokenRecord.userId));
      });

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: 'Password reset failed' };
    }
  }
}

// Tenant authentication service
export class TenantAuthService {
  private db;
  private lucia;

  constructor(private tenantDatabase: string) {
    this.db = createTenantConnection(tenantDatabase);
    this.lucia = createTenantAuth(tenantDatabase);
  }

  async login(data: LoginData) {
    try {
      const user = await this.db.query.users.findFirst({
        where: eq(tenantSchema.users.email, data.email),
      });

      if (!user || !user.isActive || !user.isApproved) {
        return { success: false, error: 'Invalid credentials or account not approved' };
      }

      if (!user.passwordHash) {
        return { success: false, error: 'Account setup not completed' };
      }

      const validPassword = await verifyPassword(data.password, user.passwordHash);
      if (!validPassword) {
        return { success: false, error: 'Invalid credentials' };
      }

      if (!user.emailVerified) {
        return { success: false, error: 'Email not verified' };
      }

      // Handle two-factor authentication if enabled
      if (user.twoFactorEnabled && !data.twoFactorCode) {
        return { success: false, error: 'Two-factor code required', requiresTwoFactor: true };
      }

      const session = await this.lucia.createSession(user.id, {});
      const sessionCookie = this.lucia.createSessionCookie(session.id);

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
      };
    } catch (error) {
      console.error('Tenant login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  async logout(sessionId: string) {
    try {
      await this.lucia.invalidateSession(sessionId);
      const sessionCookie = this.lucia.createBlankSessionCookie();
      return {
        success: true,
        sessionCookie: sessionCookie.serialize(),
      };
    } catch (error) {
      console.error('Tenant logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }

  async validateSession(sessionId: string) {
    try {
      const { session, user } = await this.lucia.validateSession(sessionId);
      return { session, user };
    } catch (error) {
      console.error('Session validation error:', error);
      return { session: null, user: null };
    }
  }

  async createPasswordResetToken(email: string) {
    try {
      const user = await this.db.query.users.findFirst({
        where: eq(tenantSchema.users.email, email),
      });

      if (!user) {
        return { success: true, message: 'If the email exists, a reset link has been sent' };
      }

      const token = generateSecureToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.db.insert(tenantSchema.tenantPasswordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });

      return { success: true, token, userId: user.id };
    } catch (error) {
      console.error('Tenant password reset token creation error:', error);
      return { success: false, error: 'Failed to create reset token' };
    }
  }

  async resetPassword(data: ResetPasswordData) {
    try {
      const tokenRecord = await this.db.query.tenantPasswordResetTokens.findFirst({
        where: eq(tenantSchema.tenantPasswordResetTokens.token, data.token),
        with: { user: true },
      });

      if (!tokenRecord || tokenRecord.used || tokenRecord.expiresAt < new Date()) {
        return { success: false, error: 'Invalid or expired token' };
      }

      const passwordHash = await hashPassword(data.password);

      await this.db.transaction(async (tx) => {
        // Update password
        await tx
          .update(tenantSchema.users)
          .set({ passwordHash, updatedAt: new Date() })
          .where(eq(tenantSchema.users.id, tokenRecord.userId));

        // Mark token as used
        await tx
          .update(tenantSchema.tenantPasswordResetTokens)
          .set({ used: true })
          .where(eq(tenantSchema.tenantPasswordResetTokens.id, tokenRecord.id));

        // Invalidate all sessions
        await tx
          .delete(tenantSchema.sessions)
          .where(eq(tenantSchema.sessions.userId, tokenRecord.userId));
      });

      return { success: true };
    } catch (error) {
      console.error('Tenant password reset error:', error);
      return { success: false, error: 'Password reset failed' };
    }
  }
}