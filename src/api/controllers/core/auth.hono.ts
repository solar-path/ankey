import { CoreAuthService } from '@/api/auth.settings'
import { TenantService } from '@/api/tenant.settings'
import { AuditService } from '@/api/audit.settings'
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '@/shared'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

const authService = new CoreAuthService()
const tenantService = new TenantService()

export const coreAuthRoutes = new Hono()
  .post('/login', zValidator('json', loginSchema), async c => {
    const data = c.req.valid('json')
    const result = await authService.login(data)

    if (result.success && result.data) {
      c.header('Set-Cookie', result.data.sessionCookie)
      return c.json({
        success: true,
        data: result.data.user,
      })
    }

    return c.json(result, result.requiresTwoFactor ? 200 : 401)
  })
  .post('/logout', async c => {
    const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

    if (sessionId) {
      const result = await authService.logout(sessionId)
      if (result.success && result.sessionCookie) {
        c.header('Set-Cookie', result.sessionCookie)
      }
    }

    return c.json({ success: true })
  })
  .get('/check-workspace/:workspace', async c => {
    const workspace = c.req.param('workspace')

    if (!workspace) {
      return c.json({ success: false, error: 'Workspace name required' }, 400)
    }

    // Generate slug for consistent checking
    const slug = workspace
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    const result = await tenantService.getTenantBySubdomain(slug)
    const isAvailable = !result.success

    return c.json({
      success: true,
      available: isAvailable,
      workspace: slug,
      message: isAvailable ? 'Workspace is available' : 'Workspace name is already taken',
    })
  })
  .post('/register-workspace', zValidator('json', registerSchema), async c => {
    const data = c.req.valid('json')
    const result = await tenantService.createTenant(data)

    return c.json(result, result.success ? 201 : 400)
  })
  .get('/me', async c => {
    const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

    if (!sessionId) {
      return c.json({ success: false, error: 'Not authenticated' }, 401)
    }

    const { session, user } = await authService.validateSession(sessionId)

    if (!session || !user) {
      return c.json({ success: false, error: 'Invalid session' }, 401)
    }

    return c.json({ success: true, data: user })
  })
  .post('/forgot-password', zValidator('json', forgotPasswordSchema), async c => {
    const { email } = c.req.valid('json')
    const result = await authService.createPasswordResetToken(email)

    if (result.success && result.token) {
      // In a real app, you'd send this via email
      // For development, you might want to log it or return it
      console.log(`Password reset token for ${email}: ${result.token}`)
    }

    // Always return success to prevent email enumeration
    return c.json({
      success: true,
      message: 'If the email exists, a reset link has been sent',
    })
  })
  .post('/reset-password', zValidator('json', resetPasswordSchema), async c => {
    const data = c.req.valid('json')
    const result = await authService.resetPassword(data)

    return c.json(result, result.success ? 200 : 400)
  })

  // 2FA endpoints
  .post('/2fa/setup', async c => {
    const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

    if (!sessionId) {
      return c.json({ success: false, error: 'Not authenticated' }, 401)
    }

    const { session, user } = await authService.validateSession(sessionId)

    if (!session || !user) {
      return c.json({ success: false, error: 'Invalid session' }, 401)
    }

    const result = await authService.setup2FA(user.id, user.email)
    return c.json(result, result.success ? 200 : 400)
  })

  .post(
    '/2fa/enable',
    zValidator(
      'json',
      z.object({
        secret: z.string(),
        code: z.string().length(6),
        backupCodes: z.array(z.string()),
      })
    ),
    async c => {
      const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

      if (!sessionId) {
        return c.json({ success: false, error: 'Not authenticated' }, 401)
      }

      const { session, user } = await authService.validateSession(sessionId)

      if (!session || !user) {
        return c.json({ success: false, error: 'Invalid session' }, 401)
      }

      const { secret, code, backupCodes } = c.req.valid('json')
      const result = await authService.enable2FA(user.id, secret, code, backupCodes)

      return c.json(result, result.success ? 200 : 400)
    }
  )

  .post(
    '/2fa/disable',
    zValidator(
      'json',
      z.object({
        password: z.string(),
      })
    ),
    async c => {
      const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

      if (!sessionId) {
        return c.json({ success: false, error: 'Not authenticated' }, 401)
      }

      const { session, user } = await authService.validateSession(sessionId)

      if (!session || !user) {
        return c.json({ success: false, error: 'Invalid session' }, 401)
      }

      const { password } = c.req.valid('json')
      const result = await authService.disable2FA(user.id, password)

      return c.json(result, result.success ? 200 : 400)
    }
  )

  .post('/2fa/email/send', async c => {
    const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

    if (!sessionId) {
      return c.json({ success: false, error: 'Not authenticated' }, 401)
    }

    const { session, user } = await authService.validateSession(sessionId)

    if (!session || !user) {
      return c.json({ success: false, error: 'Invalid session' }, 401)
    }

    const result = await authService.sendEmail2FA(user.id)
    return c.json(result, result.success ? 200 : 400)
  })

  .post(
    '/2fa/email/verify',
    zValidator(
      'json',
      z.object({
        code: z.string().length(6),
      })
    ),
    async c => {
      const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

      if (!sessionId) {
        return c.json({ success: false, error: 'Not authenticated' }, 401)
      }

      const { session, user } = await authService.validateSession(sessionId)

      if (!session || !user) {
        return c.json({ success: false, error: 'Invalid session' }, 401)
      }

      const { code } = c.req.valid('json')
      const result = await authService.verifyEmail2FA(user.id, code)

      return c.json(result, result.success ? 200 : 400)
    }
  )

  .post('/2fa/backup-codes/regenerate', async c => {
    const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

    if (!sessionId) {
      return c.json({ success: false, error: 'Not authenticated' }, 401)
    }

    const { session, user } = await authService.validateSession(sessionId)

    if (!session || !user) {
      return c.json({ success: false, error: 'Invalid session' }, 401)
    }

    const result = await authService.regenerateBackupCodes(user.id)
    return c.json(result, result.success ? 200 : 400)
  })

  .get('/login-history', async c => {
    const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

    if (!sessionId) {
      return c.json({ success: false, error: 'Not authenticated' }, 401)
    }

    const { session, user } = await authService.validateSession(sessionId)

    if (!session || !user) {
      return c.json({ success: false, error: 'Invalid session' }, 401)
    }

    try {
      // Get login-related audit logs for the user
      const auditLogs = await AuditService.getAuditLogs(null, {
        userId: user.id,
        action: 'CREATE', // Login attempts are logged as CREATE /login
        resource: 'login',
        limit: 20, // Last 20 login attempts
      })

      if (!auditLogs.success || !auditLogs.data) {
        return c.json({ success: true, data: [] })
      }

      // Transform audit logs to login history format
      const loginHistory = auditLogs.data.map((log: any) => {
        // Parse user agent to get device info
        const userAgent = log.userAgent || 'Unknown Device'
        const device = userAgent.includes('Mobile')
          ? 'Mobile Device'
          : userAgent.includes('Chrome')
            ? 'Chrome Browser'
            : userAgent.includes('Firefox')
              ? 'Firefox Browser'
              : userAgent.includes('Safari')
                ? 'Safari Browser'
                : 'Desktop'

        // Determine location from IP (for now just show IP, could integrate with geolocation service)
        const location =
          log.ipAddress && log.ipAddress !== 'unknown' ? `IP: ${log.ipAddress}` : 'Unknown Location'

        // Determine success from the stored status or assume success if no error
        const success =
          !log.newValues?.error && (log.newValues?.status === 200 || !log.newValues?.status)

        return {
          device,
          location,
          date: log.createdAt,
          success,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
        }
      })

      return c.json({ success: true, data: loginHistory })
    } catch (error) {
      console.error('Failed to get login history:', error)
      return c.json({ success: false, error: 'Failed to get login history' }, 500)
    }
  })

  .post(
    '/password-expiry-settings',
    zValidator(
      'json',
      z.object({
        passwordExpiryDays: z.number().min(0).max(365),
      })
    ),
    async c => {
      const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

      if (!sessionId) {
        return c.json({ success: false, error: 'Not authenticated' }, 401)
      }

      const { session, user } = await authService.validateSession(sessionId)

      if (!session || !user) {
        return c.json({ success: false, error: 'Invalid session' }, 401)
      }

      const { passwordExpiryDays } = c.req.valid('json')
      const result = await authService.updatePasswordExpirySettings(user.id, passwordExpiryDays)

      return c.json(result, result.success ? 200 : 400)
    }
  )

  .get('/password-status', async c => {
    const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

    if (!sessionId) {
      return c.json({ success: false, error: 'Not authenticated' }, 401)
    }

    const { session, user } = await authService.validateSession(sessionId)

    if (!session || !user) {
      return c.json({ success: false, error: 'Invalid session' }, 401)
    }

    const result = await authService.getPasswordStatus(user.id)
    return c.json(result, result.success ? 200 : 500)
  })
