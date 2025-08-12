import { z } from '@hono/zod-openapi'

// User schema
export const UserSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  email: z.string().email().openapi({
    description: 'User email address',
    example: 'user@example.com',
  }),
  fullName: z.string().openapi({
    description: 'User full name',
    example: 'John Doe',
  }),
  avatar: z.string().nullable().openapi({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
  }),
  isActive: z.boolean().openapi({
    description: 'Whether the user account is active',
    example: true,
  }),
  emailVerified: z.boolean().openapi({
    description: 'Whether the email is verified',
    example: true,
  }),
  twoFactorEnabled: z.boolean().openapi({
    description: 'Whether 2FA is enabled',
    example: false,
  }),
  passwordExpiryDays: z.number().openapi({
    description: 'Days until password expires (0 = never)',
    example: 45,
  }),
  passwordChangedAt: z.string().datetime().openapi({
    description: 'Last password change timestamp',
    example: '2024-01-01T00:00:00Z',
  }),
  createdAt: z.string().datetime().openapi({
    description: 'Account creation timestamp',
    example: '2024-01-01T00:00:00Z',
  }),
  updatedAt: z.string().datetime().openapi({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00Z',
  }),
})

// Login request
export const LoginRequestSchema = z.object({
  email: z.string().email().openapi({
    description: 'User email address',
    example: 'admin@example.com',
  }),
  password: z.string().min(8).openapi({
    description: 'User password',
    example: 'SecurePass123!',
  }),
  twoFactorCode: z.string().length(6).optional().openapi({
    description: 'Two-factor authentication code',
    example: '123456',
  }),
})

// Login response
export const LoginResponseSchema = z.object({
  success: z.boolean(),
  data: UserSchema.optional(),
  requiresTwoFactor: z.boolean().optional().openapi({
    description: 'Indicates if 2FA code is required',
  }),
  error: z.string().optional(),
})

// Register request
export const RegisterRequestSchema = z.object({
  workspace: z.string().min(3).max(30).regex(/^[a-zA-Z0-9-_]+$/).openapi({
    description: 'Workspace subdomain',
    example: 'mycompany',
  }),
  fullName: z.string().min(2).openapi({
    description: 'User full name',
    example: 'John Doe',
  }),
  email: z.string().email().openapi({
    description: 'User email address',
    example: 'admin@mycompany.com',
  }),
  password: z.string().min(8).openapi({
    description: 'Password (min 8 chars, must include uppercase, lowercase, number)',
    example: 'SecurePass123!',
  }),
  acceptTerms: z.boolean().openapi({
    description: 'Terms and conditions acceptance',
    example: true,
  }),
})

// Password reset request
export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email().openapi({
    description: 'Email address for password reset',
    example: 'user@example.com',
  }),
})

export const ResetPasswordRequestSchema = z.object({
  token: z.string().openapi({
    description: 'Password reset token',
    example: 'reset-token-123',
  }),
  password: z.string().min(8).openapi({
    description: 'New password',
    example: 'NewSecurePass123!',
  }),
})

// 2FA schemas
export const TwoFactorSetupResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    secret: z.string().openapi({
      description: 'TOTP secret key',
    }),
    qrCodeUrl: z.string().openapi({
      description: 'QR code data URL for scanning',
    }),
    manualEntryKey: z.string().openapi({
      description: 'Manual entry key for authenticator apps',
    }),
    backupCodes: z.array(z.string()).openapi({
      description: 'Backup recovery codes',
      example: ['ABC123', 'DEF456', 'GHI789'],
    }),
  }),
})

export const EnableTwoFactorRequestSchema = z.object({
  secret: z.string().openapi({
    description: 'TOTP secret from setup',
  }),
  code: z.string().length(6).openapi({
    description: 'Verification code from authenticator app',
    example: '123456',
  }),
  backupCodes: z.array(z.string()).openapi({
    description: 'Backup codes to store',
  }),
})

export const DisableTwoFactorRequestSchema = z.object({
  password: z.string().openapi({
    description: 'Current password for verification',
  }),
})

// Session info
export const SessionSchema = z.object({
  id: z.string().openapi({
    description: 'Session ID',
  }),
  userId: z.string().uuid().openapi({
    description: 'User ID',
  }),
  expiresAt: z.string().datetime().openapi({
    description: 'Session expiration time',
  }),
  ipAddress: z.string().optional().openapi({
    description: 'IP address of session',
  }),
  userAgent: z.string().optional().openapi({
    description: 'User agent of session',
  }),
})

// Login history
export const LoginHistoryItemSchema = z.object({
  device: z.string().openapi({
    description: 'Device/browser information',
    example: 'Chrome Browser',
  }),
  location: z.string().openapi({
    description: 'Login location',
    example: 'IP: 192.168.1.1',
  }),
  date: z.string().datetime().openapi({
    description: 'Login timestamp',
  }),
  success: z.boolean().openapi({
    description: 'Whether login was successful',
  }),
  ipAddress: z.string().openapi({
    description: 'IP address',
  }),
  userAgent: z.string().openapi({
    description: 'User agent string',
  }),
})

// Password status
export const PasswordStatusSchema = z.object({
  passwordExpiryDays: z.number().openapi({
    description: 'Password expiry policy in days',
  }),
  passwordChangedAt: z.string().datetime().openapi({
    description: 'Last password change',
  }),
  expiryDate: z.string().datetime().optional().openapi({
    description: 'Password expiration date',
  }),
  isExpired: z.boolean().openapi({
    description: 'Whether password is expired',
  }),
  daysUntilExpiry: z.number().nullable().openapi({
    description: 'Days until password expires',
  }),
  showWarning: z.boolean().openapi({
    description: 'Whether to show expiry warning',
  }),
})

// Password expiry settings
export const PasswordExpirySettingsSchema = z.object({
  passwordExpiryDays: z.number().min(0).max(365).openapi({
    description: 'Days until password expires (0 = never)',
    example: 45,
  }),
})

export const AuthSchemas = {
  User: UserSchema,
  LoginRequest: LoginRequestSchema,
  LoginResponse: LoginResponseSchema,
  RegisterRequest: RegisterRequestSchema,
  ForgotPasswordRequest: ForgotPasswordRequestSchema,
  ResetPasswordRequest: ResetPasswordRequestSchema,
  TwoFactorSetupResponse: TwoFactorSetupResponseSchema,
  EnableTwoFactorRequest: EnableTwoFactorRequestSchema,
  DisableTwoFactorRequest: DisableTwoFactorRequestSchema,
  Session: SessionSchema,
  LoginHistoryItem: LoginHistoryItemSchema,
  PasswordStatus: PasswordStatusSchema,
  PasswordExpirySettings: PasswordExpirySettingsSchema,
}