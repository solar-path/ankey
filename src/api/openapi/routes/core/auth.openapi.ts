import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { CoreAuthService } from '@/api/auth.settings'
import { TenantService } from '@/api/tenant.settings'
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '@/shared'
import { z } from '@hono/zod-openapi'

const authService = new CoreAuthService()
const tenantService = new TenantService()

// Simple route definitions matching exactly the original controller
const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  summary: 'User login',
  description: 'Authenticate user with email and password',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: loginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              id: z.string(),
              email: z.string(),
              fullName: z.string(),
            }).optional(),
            error: z.string().optional(),
            requiresTwoFactor: z.boolean().optional(),
          }),
        },
      },
    },
    401: {
      description: 'Authentication failed',
    },
  },
})

const logoutRoute = createRoute({
  method: 'post',
  path: '/logout',
  summary: 'User logout',
  description: 'Invalidate current session',
  tags: ['Authentication'],
  responses: {
    200: {
      description: 'Logout successful',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
  },
})

const checkWorkspaceRoute = createRoute({
  method: 'get',
  path: '/check-workspace/{workspace}',
  summary: 'Check workspace availability',
  description: 'Check if a workspace name is available',
  tags: ['Authentication'],
  request: {
    params: z.object({
      workspace: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Workspace availability checked',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            available: z.boolean(),
            workspace: z.string(),
            message: z.string(),
          }),
        },
      },
    },
  },
})

const registerWorkspaceRoute = createRoute({
  method: 'post',
  path: '/register-workspace',
  summary: 'Register new workspace',
  description: 'Create a new tenant workspace',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: registerSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Workspace created successfully',
    },
    400: {
      description: 'Validation error',
    },
  },
})

const getMeRoute = createRoute({
  method: 'get',
  path: '/me',
  summary: 'Get current user',
  description: 'Retrieve authenticated user information',
  tags: ['Authentication'],
  responses: {
    200: {
      description: 'User information retrieved',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              id: z.string(),
              email: z.string(),
              fullName: z.string(),
            }).optional(),
          }),
        },
      },
    },
    401: {
      description: 'Not authenticated',
    },
  },
})

const forgotPasswordRoute = createRoute({
  method: 'post',
  path: '/forgot-password',
  summary: 'Forgot password',
  description: 'Request password reset',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: forgotPasswordSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password reset requested',
    },
  },
})

const resetPasswordRoute = createRoute({
  method: 'post',
  path: '/reset-password',
  summary: 'Reset password',
  description: 'Reset password with token',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: resetPasswordSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password reset successful',
    },
    400: {
      description: 'Invalid token or password',
    },
  },
})

const setup2FARoute = createRoute({
  method: 'post',
  path: '/2fa/setup',
  summary: 'Setup 2FA',
  description: 'Initialize two-factor authentication',
  tags: ['Authentication', '2FA'],
  responses: {
    200: {
      description: '2FA setup initiated',
    },
    401: {
      description: 'Not authenticated',
    },
  },
})

const enable2FARoute = createRoute({
  method: 'post',
  path: '/2fa/enable',
  summary: 'Enable 2FA',
  description: 'Enable two-factor authentication',
  tags: ['Authentication', '2FA'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            secret: z.string(),
            code: z.string().length(6),
            backupCodes: z.array(z.string()),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: '2FA enabled successfully',
    },
    400: {
      description: 'Invalid verification code',
    },
    401: {
      description: 'Not authenticated',
    },
  },
})

const disable2FARoute = createRoute({
  method: 'post',
  path: '/2fa/disable',
  summary: 'Disable 2FA',
  description: 'Disable two-factor authentication',
  tags: ['Authentication', '2FA'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            password: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: '2FA disabled successfully',
    },
    400: {
      description: 'Invalid password',
    },
    401: {
      description: 'Not authenticated',
    },
  },
})

const email2FASendRoute = createRoute({
  method: 'post',
  path: '/2fa/email/send',
  summary: 'Send email 2FA code',
  description: 'Send 2FA code via email',
  tags: ['Authentication', '2FA'],
  responses: {
    200: {
      description: 'Email 2FA code sent',
    },
    401: {
      description: 'Not authenticated',
    },
  },
})

const email2FAVerifyRoute = createRoute({
  method: 'post',
  path: '/2fa/email/verify',
  summary: 'Verify email 2FA code',
  description: 'Verify 2FA code sent via email',
  tags: ['Authentication', '2FA'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            code: z.string().length(6),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Email 2FA code verified',
    },
    400: {
      description: 'Invalid verification code',
    },
    401: {
      description: 'Not authenticated',
    },
  },
})

const regenerateBackupCodesRoute = createRoute({
  method: 'post',
  path: '/2fa/backup-codes/regenerate',
  summary: 'Regenerate backup codes',
  description: 'Generate new 2FA backup codes',
  tags: ['Authentication', '2FA'],
  responses: {
    200: {
      description: 'Backup codes regenerated',
    },
    401: {
      description: 'Not authenticated',
    },
  },
})

const loginHistoryRoute = createRoute({
  method: 'get',
  path: '/login-history',
  summary: 'Get login history',
  description: 'Retrieve user login history',
  tags: ['Authentication'],
  responses: {
    200: {
      description: 'Login history retrieved',
    },
    401: {
      description: 'Not authenticated',
    },
  },
})

const passwordExpirySettingsRoute = createRoute({
  method: 'post',
  path: '/password-expiry-settings',
  summary: 'Update password expiry settings',
  description: 'Configure password expiration',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            passwordExpiryDays: z.number().min(0).max(365),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password expiry settings updated',
    },
    400: {
      description: 'Invalid settings',
    },
    401: {
      description: 'Not authenticated',
    },
  },
})

const passwordStatusRoute = createRoute({
  method: 'get',
  path: '/password-status',
  summary: 'Get password status',
  description: 'Check password expiration status',
  tags: ['Authentication'],
  responses: {
    200: {
      description: 'Password status retrieved',
    },
    401: {
      description: 'Not authenticated',
    },
  },
})

// Create the OpenAPI app and register routes
export const authOpenAPIRoutes = new OpenAPIHono()

// Implement all route handlers exactly like the original controller
authOpenAPIRoutes.openapi(loginRoute, async (c) => {
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

authOpenAPIRoutes.openapi(logoutRoute, async (c) => {
  const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

  if (sessionId) {
    const result = await authService.logout(sessionId)
    if (result.success && result.sessionCookie) {
      c.header('Set-Cookie', result.sessionCookie)
    }
  }

  return c.json({ success: true })
})

authOpenAPIRoutes.openapi(checkWorkspaceRoute, async (c) => {
  const { workspace } = c.req.valid('param')

  if (!workspace) {
    return c.json({ success: false, error: 'Workspace name required' }, 400)
  }

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

authOpenAPIRoutes.openapi(registerWorkspaceRoute, async (c) => {
  const data = c.req.valid('json')
  const result = await tenantService.createTenant(data)

  return c.json(result, result.success ? 201 : 400)
})

authOpenAPIRoutes.openapi(getMeRoute, async (c) => {
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

authOpenAPIRoutes.openapi(forgotPasswordRoute, async (c) => {
  const { email } = c.req.valid('json')
  const result = await authService.createPasswordResetToken(email)

  if (result.success && result.token) {
    console.log(`Password reset token for ${email}: ${result.token}`)
  }

  return c.json({
    success: true,
    message: 'If the email exists, a reset link has been sent',
  })
})

authOpenAPIRoutes.openapi(resetPasswordRoute, async (c) => {
  const data = c.req.valid('json')
  const result = await authService.resetPassword(data)

  return c.json(result, result.success ? 200 : 400)
})

authOpenAPIRoutes.openapi(setup2FARoute, async (c) => {
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

authOpenAPIRoutes.openapi(enable2FARoute, async (c) => {
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
})

authOpenAPIRoutes.openapi(disable2FARoute, async (c) => {
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
})

authOpenAPIRoutes.openapi(email2FASendRoute, async (c) => {
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

authOpenAPIRoutes.openapi(email2FAVerifyRoute, async (c) => {
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
})

authOpenAPIRoutes.openapi(regenerateBackupCodesRoute, async (c) => {
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

authOpenAPIRoutes.openapi(loginHistoryRoute, async (c) => {
  const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

  if (!sessionId) {
    return c.json({ success: false, error: 'Not authenticated' }, 401)
  }

  const { session, user } = await authService.validateSession(sessionId)

  if (!session || !user) {
    return c.json({ success: false, error: 'Invalid session' }, 401)
  }

  try {
    const { AuditService } = await import('@/api/audit.settings')
    const auditLogs = await AuditService.getAuditLogs(null, {
      userId: user.id,
      action: 'CREATE',
      resource: 'login',
      limit: 20,
    })

    if (!auditLogs.success || !auditLogs.data) {
      return c.json({ success: true, data: [] })
    }

    const loginHistory = auditLogs.data.map((log: any) => {
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

      const location =
        log.ipAddress && log.ipAddress !== 'unknown' ? `IP: ${log.ipAddress}` : 'Unknown Location'

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

authOpenAPIRoutes.openapi(passwordExpirySettingsRoute, async (c) => {
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
})

authOpenAPIRoutes.openapi(passwordStatusRoute, async (c) => {
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