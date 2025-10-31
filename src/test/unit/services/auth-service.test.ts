/**
 * Auth Service Unit Tests
 *
 * Tests for AuthService methods with mocked API calls.
 * Ensures service layer correctly calls API and transforms responses.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '@/modules/auth/auth-service';
import {
  MOCK_USERS,
  MOCK_SIGNUP_RESPONSE,
  MOCK_SIGNIN_RESPONSE,
  MOCK_2FA_REQUIRED_RESPONSE,
  MOCK_ERROR_RESPONSES,
} from '@/test/utils/mock-data';

// ============================================
// SETUP - Mock fetch globally
// ============================================

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================
// SIGN UP TESTS
// ============================================

describe('AuthService.signUp', () => {
  test('should call API with correct parameters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SIGNUP_RESPONSE,
    });

    // Mock verification email endpoint (second fetch call)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const input = {
      fullname: MOCK_USERS.valid.fullname,
      email: MOCK_USERS.valid.email,
      password: MOCK_USERS.valid.password,
      terms: true,
    };

    await AuthService.signUp(input);

    // Check first call (signup)
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/api/auth.signup'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: input.email,
          password: input.password,
          fullname: input.fullname,
        }),
      })
    );

    // Check second call (send verification email)
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/api/auth/send-verification'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: input.email,
          code: MOCK_SIGNUP_RESPONSE.verificationCode,
        }),
      })
    );
  });

  test('should return user data on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SIGNUP_RESPONSE,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const input = {
      fullname: MOCK_USERS.valid.fullname,
      email: MOCK_USERS.valid.email,
      password: MOCK_USERS.valid.password,
      terms: true,
    };

    const result = await AuthService.signUp(input);

    expect(result).toEqual(MOCK_SIGNUP_RESPONSE);
    expect(result.userId).toBeDefined();
    expect(result.verificationCode).toBeDefined();
  });

  test('should throw error when email already exists', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => MOCK_ERROR_RESPONSES.emailExists,
    });

    const input = {
      fullname: MOCK_USERS.valid.fullname,
      email: MOCK_USERS.valid.email,
      password: MOCK_USERS.valid.password,
      terms: true,
    };

    await expect(AuthService.signUp(input)).rejects.toThrow(
      'User with this email already exists'
    );
  });

  test('should throw error on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const input = {
      fullname: MOCK_USERS.valid.fullname,
      email: MOCK_USERS.valid.email,
      password: MOCK_USERS.valid.password,
      terms: true,
    };

    await expect(AuthService.signUp(input)).rejects.toThrow('Network error');
  });

  test('should validate input before API call', async () => {
    const invalidInput = {
      fullname: 'A', // Too short
      email: 'invalid-email',
      password: '123', // Too short
      terms: false,
    };

    await expect(AuthService.signUp(invalidInput as any)).rejects.toThrow();

    // Should not call API if validation fails
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('should continue if verification email fails', async () => {
    // Signup succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SIGNUP_RESPONSE,
    });

    // Verification email fails
    mockFetch.mockRejectedValueOnce(new Error('Email service unavailable'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const input = {
      fullname: MOCK_USERS.valid.fullname,
      email: MOCK_USERS.valid.email,
      password: MOCK_USERS.valid.password,
      terms: true,
    };

    // Should not throw error - verification email failure is non-fatal
    const result = await AuthService.signUp(input);

    expect(result).toEqual(MOCK_SIGNUP_RESPONSE);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error sending verification email:',
      expect.any(Error)
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Verification code for')
    );

    consoleSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});

// ============================================
// SIGN IN TESTS
// ============================================

describe('AuthService.signIn', () => {
  test('should call API with correct parameters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SIGNIN_RESPONSE,
    });

    const input = {
      email: MOCK_USERS.valid.email,
      password: MOCK_USERS.valid.password,
    };

    await AuthService.signIn(input);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth.signin'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: input.email,
          password: input.password,
        }),
      })
    );
  });

  test('should return user and session on successful signin', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SIGNIN_RESPONSE,
    });

    const input = {
      email: MOCK_USERS.valid.email,
      password: MOCK_USERS.valid.password,
    };

    const result = await AuthService.signIn(input);

    expect(result).toEqual(MOCK_SIGNIN_RESPONSE);
    expect(result.user).toBeDefined();
    expect(result.session).toBeDefined();
    expect(result.session.token).toBeDefined();
    expect(result.requires2FA).toBe(false);
  });

  test('should handle 2FA required scenario', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_2FA_REQUIRED_RESPONSE,
    });

    const input = {
      email: MOCK_USERS.with2FA.email,
      password: MOCK_USERS.with2FA.password,
    };

    const result = await AuthService.signIn(input);

    expect(result.requires2FA).toBe(true);
    expect(result.user.email).toBe(MOCK_USERS.with2FA.email);
    expect(result.session).toBeUndefined();
  });

  test('should throw error for invalid credentials', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => MOCK_ERROR_RESPONSES.invalidCredentials,
    });

    const input = {
      email: MOCK_USERS.valid.email,
      password: 'WrongPassword123',
    };

    await expect(AuthService.signIn(input)).rejects.toThrow(
      'Invalid email or password'
    );
  });

  test('should throw error for unverified account', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => MOCK_ERROR_RESPONSES.unverified,
    });

    const input = {
      email: MOCK_USERS.unverified.email,
      password: MOCK_USERS.unverified.password,
    };

    await expect(AuthService.signIn(input)).rejects.toThrow(
      'Please verify your account first'
    );
  });

  test('should validate input before API call', async () => {
    const invalidInput = {
      email: 'invalid',
      password: '123',
    };

    await expect(AuthService.signIn(invalidInput as any)).rejects.toThrow();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ============================================
// VERIFY ACCOUNT TESTS
// ============================================

describe('AuthService.verifyAccount', () => {
  test('should call API with verification code', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Account verified successfully' }),
    });

    const code = '123456';
    await AuthService.verifyAccount(code);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth.verify_account'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ code }),
      })
    );
  });

  test('should return success message', async () => {
    const successResponse = { message: 'Account verified successfully' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => successResponse,
    });

    const result = await AuthService.verifyAccount('123456');
    expect(result).toEqual(successResponse);
  });

  test('should throw error for invalid code', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => MOCK_ERROR_RESPONSES.invalidCode,
    });

    await expect(AuthService.verifyAccount('999999')).rejects.toThrow(
      'Invalid verification code'
    );
  });
});

// ============================================
// VERIFY SESSION TESTS
// ============================================

describe('AuthService.verifySession', () => {
  test('should call API with session token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SIGNIN_RESPONSE,
    });

    const token = 'test-session-token';
    await AuthService.verifySession(token);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth.verify_session'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ token }),
      })
    );
  });

  test('should return user and session for valid token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SIGNIN_RESPONSE,
    });

    const result = await AuthService.verifySession('valid-token');
    expect(result).toEqual(MOCK_SIGNIN_RESPONSE);
  });

  test('should throw error for invalid token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => MOCK_ERROR_RESPONSES.invalidToken,
    });

    await expect(AuthService.verifySession('invalid-token')).rejects.toThrow(
      'Invalid session'
    );
  });

  test('should throw error for expired session', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => MOCK_ERROR_RESPONSES.expiredSession,
    });

    await expect(AuthService.verifySession('expired-token')).rejects.toThrow(
      'Session expired'
    );
  });
});

// ============================================
// SIGN OUT TESTS
// ============================================

describe('AuthService.signOut', () => {
  test('should call API with session token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Signed out successfully' }),
    });

    const token = 'test-session-token';
    await AuthService.signOut(token);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth.signout'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ token }),
      })
    );
  });

  test('should return success message', async () => {
    const successResponse = { message: 'Signed out successfully' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => successResponse,
    });

    const result = await AuthService.signOut('valid-token');
    expect(result).toEqual(successResponse);
  });
});

// ============================================
// VERIFY 2FA TESTS
// ============================================

describe('AuthService.verify2FA', () => {
  test('should call API with email and token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SIGNIN_RESPONSE,
    });

    const email = MOCK_USERS.with2FA.email;
    const token = '123456';

    await AuthService.verify2FA(email, token);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth.verify_2fa'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email, token }),
      })
    );
  });

  test('should return user and session on successful verification', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SIGNIN_RESPONSE,
    });

    const result = await AuthService.verify2FA(MOCK_USERS.with2FA.email, '123456');
    expect(result).toEqual(MOCK_SIGNIN_RESPONSE);
  });

  test('should throw error for invalid 2FA token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid token' }),
    });

    await expect(
      AuthService.verify2FA(MOCK_USERS.with2FA.email, '999999')
    ).rejects.toThrow('Invalid token');
  });
});

// ============================================
// FORGOT PASSWORD TESTS
// ============================================

describe('AuthService.forgotPassword', () => {
  test('should call API with email', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'If an account exists, a reset link will be sent',
        resetToken: 'test-reset-token',
      }),
    });

    // Mock password reset email endpoint
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const email = MOCK_USERS.valid.email;
    await AuthService.forgotPassword(email);

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/api/auth.forgot_password'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    );
  });

  test('should attempt to send password reset email', async () => {
    const resetToken = 'test-reset-token-123';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'If an account exists, a reset link will be sent',
        resetToken,
      }),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const email = MOCK_USERS.valid.email;
    await AuthService.forgotPassword(email);

    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/api/auth/send-password-reset'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email, resetToken }),
      })
    );
  });

  test('should not reveal if email exists (security)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'If an account exists, a reset link will be sent',
      }),
    });

    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const result = await AuthService.forgotPassword('nonexistent@example.com');

    // Same message regardless of whether email exists
    expect(result.message).toBe('If an account exists, a reset link will be sent');
  });
});

// ============================================
// GET CURRENT USER TESTS
// ============================================

describe('AuthService.getCurrentUser', () => {
  test('should return user for valid token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_SIGNIN_RESPONSE,
    });

    const user = await AuthService.getCurrentUser('valid-token');

    expect(user).toEqual(MOCK_SIGNIN_RESPONSE.user);
  });

  test('should return null for invalid token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => MOCK_ERROR_RESPONSES.invalidToken,
    });

    const user = await AuthService.getCurrentUser('invalid-token');

    expect(user).toBeNull();
  });

  test('should return null for expired session', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => MOCK_ERROR_RESPONSES.expiredSession,
    });

    const user = await AuthService.getCurrentUser('expired-token');

    expect(user).toBeNull();
  });
});

// ============================================
// UPDATE PROFILE TESTS
// ============================================

describe('AuthService.updateProfile', () => {
  test('should call API with user ID and profile data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...MOCK_USERS.complete }),
    });

    const userId = 'user_123';
    const profileData = {
      fullname: 'Updated Name',
      phone: '+1234567890',
      city: 'New York',
    };

    await AuthService.updateProfile(userId, profileData);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth.update_profile'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          fullname: profileData.fullname,
          phone: profileData.phone,
          city: profileData.city,
          dob: undefined,
          gender: undefined,
          avatar: undefined,
          address: undefined,
          state: undefined,
          zip_code: undefined,
          country: undefined,
        }),
      })
    );
  });

  test('should transform zipCode to zip_code for API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...MOCK_USERS.complete }),
    });

    const userId = 'user_123';
    const profileData = { zipCode: '10001' };

    await AuthService.updateProfile(userId, profileData);

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.zip_code).toBe('10001');
  });
});

// ============================================
// UPDATE LANGUAGE TESTS
// ============================================

describe('AuthService.updateLanguage', () => {
  test('should call API with user ID and language', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ preferredLanguage: 'es' }),
    });

    const userId = 'user_123';
    const language = 'es';

    await AuthService.updateLanguage(userId, language);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth.update_language'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          preferred_language: language,
        }),
      })
    );
  });
});

// ============================================
// CHANGE PASSWORD TESTS
// ============================================

describe('AuthService.changePassword', () => {
  test('should call API with user ID and passwords', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const userId = 'user_123';
    const currentPassword = 'OldPass123';
    const newPassword = 'NewPass456';

    await AuthService.changePassword(userId, currentPassword, newPassword);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth.change_password'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })
    );
  });

  test('should throw error when current password is incorrect', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Current password is incorrect' }),
    });

    await expect(
      AuthService.changePassword('user_123', 'WrongPassword', 'NewPass456')
    ).rejects.toThrow('Current password is incorrect');
  });
});

// ============================================
// 2FA MANAGEMENT TESTS
// ============================================

describe('AuthService.setup2FA', () => {
  test('should call API and return secret with QR code', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ secret: 'JBSWY3DPEHPK3PXP' }),
    });

    const userId = 'user_123';
    const result = await AuthService.setup2FA(userId);

    expect(result.secret).toBeDefined();
    expect(result.qrCode).toBeDefined();
  });
});

describe('AuthService.enable2FA', () => {
  test('should call API with user ID and verification token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const userId = 'user_123';
    const token = '123456';

    await AuthService.enable2FA(userId, token);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth.enable_2fa'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ user_id: userId, token }),
      })
    );
  });
});

describe('AuthService.disable2FA', () => {
  test('should call API with user ID and verification token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const userId = 'user_123';
    const token = '123456';

    await AuthService.disable2FA(userId, token);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth.disable_2fa'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ user_id: userId, token }),
      })
    );
  });
});

describe('AuthService.get2FAStatus', () => {
  test('should call API with user ID', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ enabled: true, required: false }),
    });

    const userId = 'user_123';
    const result = await AuthService.get2FAStatus(userId);

    expect(result.enabled).toBeDefined();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth.get_2fa_status'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      })
    );
  });
});
