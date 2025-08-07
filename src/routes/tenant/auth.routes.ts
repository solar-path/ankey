import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { TenantAuthService } from '@/api/auth.settings';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema, letMeInSchema } from '@/types';

const tenantAuthRoutes = new Hono();

// Middleware to get tenant database from request context
const getTenantDatabase = (c: any): string => {
  const tenantDatabase = c.get('tenantDatabase');
  if (!tenantDatabase) {
    throw new Error('Tenant database not found');
  }
  return tenantDatabase;
};

// Tenant user login
tenantAuthRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const tenantDatabase = getTenantDatabase(c);
    const authService = new TenantAuthService(tenantDatabase);
    
    const result = await authService.login(data);

    if (result.success && result.data) {
      c.header('Set-Cookie', result.data.sessionCookie);
      return c.json({
        success: true,
        data: result.data.user,
      });
    }

    return c.json(result, result.requiresTwoFactor ? 200 : 401);
  } catch (error) {
    return c.json({ success: false, error: 'Authentication failed' }, 500);
  }
});

// Tenant user logout
tenantAuthRoutes.post('/logout', async (c) => {
  try {
    const tenantDatabase = getTenantDatabase(c);
    const authService = new TenantAuthService(tenantDatabase);
    const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1];
    
    if (sessionId) {
      const result = await authService.logout(sessionId);
      if (result.success && result.sessionCookie) {
        c.header('Set-Cookie', result.sessionCookie);
      }
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: 'Logout failed' }, 500);
  }
});

// Get current user
tenantAuthRoutes.get('/me', async (c) => {
  try {
    const tenantDatabase = getTenantDatabase(c);
    const authService = new TenantAuthService(tenantDatabase);
    const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1];
    
    if (!sessionId) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const { session, user } = await authService.validateSession(sessionId);
    
    if (!session || !user) {
      return c.json({ success: false, error: 'Invalid session' }, 401);
    }

    return c.json({ success: true, data: user });
  } catch (error) {
    return c.json({ success: false, error: 'Authentication check failed' }, 500);
  }
});

// Forgot password
tenantAuthRoutes.post('/forgot-password', zValidator('json', forgotPasswordSchema), async (c) => {
  try {
    const { email } = c.req.valid('json');
    const tenantDatabase = getTenantDatabase(c);
    const authService = new TenantAuthService(tenantDatabase);
    
    const result = await authService.createPasswordResetToken(email);

    if (result.success && result.token) {
      // Log token for development (in production, send via email)
      console.log(`Password reset token for ${email}: ${result.token}`);
    }

    // Always return success to prevent email enumeration
    return c.json({ 
      success: true, 
      message: 'If the email exists, a reset link has been sent' 
    });
  } catch (error) {
    return c.json({ success: false, error: 'Password reset failed' }, 500);
  }
});

// Reset password
tenantAuthRoutes.post('/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const tenantDatabase = getTenantDatabase(c);
    const authService = new TenantAuthService(tenantDatabase);
    
    const result = await authService.resetPassword(data);

    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    return c.json({ success: false, error: 'Password reset failed' }, 500);
  }
});

// "Let me in" form - for users requesting access
tenantAuthRoutes.post('/let-me-in', zValidator('json', letMeInSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const tenantDatabase = getTenantDatabase(c);
    
    // TODO: Implement the logic to create access request
    // This would involve:
    // 1. Creating a pending user record
    // 2. Sending notification to admins
    // 3. Returning success response
    
    return c.json({
      success: true,
      message: 'Your access request has been submitted and will be reviewed by administrators.',
    });
  } catch (error) {
    return c.json({ success: false, error: 'Request submission failed' }, 500);
  }
});

export { tenantAuthRoutes };