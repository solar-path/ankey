import { CoreAuthService } from '@/api/auth.settings'
import { TenantService } from '@/api/tenant.settings'
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '@/shared'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

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