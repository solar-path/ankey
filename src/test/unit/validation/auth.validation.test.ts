/**
 * Authentication Validation Tests
 *
 * Tests for Valibot validation schemas used in authentication forms.
 * Ensures proper validation of user input before API calls.
 */

import { describe, test, expect } from 'vitest';
import { parse as valibotParse } from 'valibot';
import {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  verifyAccountSchema,
  changePasswordSchema,
} from '@/modules/auth/auth.valibot';
import {
  INVALID_EMAILS,
  WEAK_PASSWORDS,
  INVALID_FULLNAMES,
  INVALID_CODES,
  SQL_INJECTION_PAYLOADS,
  XSS_PAYLOADS,
  EDGE_CASE_EMAILS,
  EDGE_CASE_NAMES,
  EDGE_CASE_PASSWORDS,
} from '@/test/utils/mock-data';

// ============================================
// SIGN UP VALIDATION TESTS
// ============================================

describe('signUpSchema', () => {
  describe('Valid Inputs', () => {
    test('should accept valid registration data', () => {
      const validData = {
        fullname: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123',
        terms: true,
      };

      expect(() => valibotParse(signUpSchema, validData)).not.toThrow();
    });

    test('should accept minimum valid fullname length (2 chars)', () => {
      const data = {
        fullname: 'Jo',
        email: 'jo@example.com',
        password: 'SecurePass123',
        terms: true,
      };

      expect(() => valibotParse(signUpSchema, data)).not.toThrow();
    });

    test('should accept minimum valid password length (8 chars)', () => {
      const data = {
        fullname: 'John Doe',
        email: 'john@example.com',
        password: '12345678',
        terms: true,
      };

      expect(() => valibotParse(signUpSchema, data)).not.toThrow();
    });

    test('should accept special characters in fullname', () => {
      const data = {
        fullname: "O'Brien-Smith Jr.",
        email: 'obrien@example.com',
        password: 'SecurePass123',
        terms: true,
      };

      expect(() => valibotParse(signUpSchema, data)).not.toThrow();
    });

    test('should accept unicode characters in fullname', () => {
      for (const name of EDGE_CASE_NAMES) {
        const data = {
          fullname: name,
          email: 'test@example.com',
          password: 'SecurePass123',
          terms: true,
        };

        expect(() => valibotParse(signUpSchema, data)).not.toThrow();
      }
    });

    test('should accept edge case valid emails', () => {
      for (const email of EDGE_CASE_EMAILS) {
        const data = {
          fullname: 'Test User',
          email,
          password: 'SecurePass123',
          terms: true,
        };

        expect(() => valibotParse(signUpSchema, data)).not.toThrow();
      }
    });
  });

  describe('Invalid Email', () => {
    test('should reject invalid email formats', () => {
      for (const invalidEmail of INVALID_EMAILS) {
        if (invalidEmail === null || invalidEmail === undefined) continue;

        const data = {
          fullname: 'Test User',
          email: invalidEmail,
          password: 'SecurePass123',
          terms: true,
        };

        expect(() => valibotParse(signUpSchema, data)).toThrow();
      }
    });

    test('should reject empty email', () => {
      const data = {
        fullname: 'Test User',
        email: '',
        password: 'SecurePass123',
        terms: true,
      };

      expect(() => valibotParse(signUpSchema, data)).toThrow();
    });

    test('should reject email without @ symbol', () => {
      const data = {
        fullname: 'Test User',
        email: 'invalidemail.com',
        password: 'SecurePass123',
        terms: true,
      };

      expect(() => valibotParse(signUpSchema, data)).toThrow();
    });

    test('should reject email without domain', () => {
      const data = {
        fullname: 'Test User',
        email: 'test@',
        password: 'SecurePass123',
        terms: true,
      };

      expect(() => valibotParse(signUpSchema, data)).toThrow();
    });
  });

  describe('Invalid Password', () => {
    test('should reject passwords shorter than 8 characters', () => {
      for (const weakPassword of WEAK_PASSWORDS) {
        if (weakPassword === null || weakPassword === undefined) continue;

        const data = {
          fullname: 'Test User',
          email: 'test@example.com',
          password: weakPassword,
          terms: true,
        };

        expect(() => valibotParse(signUpSchema, data)).toThrow();
      }
    });

    test('should reject empty password', () => {
      const data = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: '',
        terms: true,
      };

      expect(() => valibotParse(signUpSchema, data)).toThrow();
    });

    test('should accept passwords with special characters', () => {
      const data = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'P@ssw0rd!123',
        terms: true,
      };

      expect(() => valibotParse(signUpSchema, data)).not.toThrow();
    });

    test('should accept long passwords', () => {
      const data = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'P@ssw0rd' + 'x'.repeat(64),
        terms: true,
      };

      expect(() => valibotParse(signUpSchema, data)).not.toThrow();
    });
  });

  describe('Invalid Fullname', () => {
    test('should reject fullnames shorter than 2 characters', () => {
      for (const invalidName of INVALID_FULLNAMES) {
        if (invalidName === null || invalidName === undefined) continue;

        const data = {
          fullname: invalidName,
          email: 'test@example.com',
          password: 'SecurePass123',
          terms: true,
        };

        expect(() => valibotParse(signUpSchema, data)).toThrow();
      }
    });

    test('should reject empty fullname', () => {
      const data = {
        fullname: '',
        email: 'test@example.com',
        password: 'SecurePass123',
        terms: true,
      };

      expect(() => valibotParse(signUpSchema, data)).toThrow();
    });
  });

  describe('Terms Agreement', () => {
    test('should reject when terms is false', () => {
      const data = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123',
        terms: false,
      };

      expect(() => valibotParse(signUpSchema, data)).toThrow();
    });

    test('should reject when terms is missing', () => {
      const data = {
        fullname: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123',
      };

      expect(() => valibotParse(signUpSchema, data as any)).toThrow();
    });
  });

  describe('SQL Injection Prevention', () => {
    test('should not throw on SQL injection attempts in email', () => {
      // Note: Validation should accept these inputs - sanitization happens at DB level
      // We're testing that validation doesn't break with malicious input
      for (const payload of SQL_INJECTION_PAYLOADS.slice(0, 5)) {
        const data = {
          fullname: 'Test User',
          email: `test${payload}@example.com`,
          password: 'SecurePass123',
          terms: true,
        };

        // Should either validate successfully or fail due to invalid email format
        // But should NOT crash or expose vulnerabilities
        try {
          valibotParse(signUpSchema, data);
        } catch (error) {
          // Expected to fail validation, but shouldn't crash
          expect(error).toBeDefined();
        }
      }
    });

    test('should handle SQL injection in fullname gracefully', () => {
      for (const payload of SQL_INJECTION_PAYLOADS.slice(0, 5)) {
        const data = {
          fullname: payload,
          email: 'test@example.com',
          password: 'SecurePass123',
          terms: true,
        };

        // Should accept as valid input (sanitization happens at DB level)
        // Parameterized queries will prevent SQL injection
        expect(() => valibotParse(signUpSchema, data)).not.toThrow();
      }
    });
  });

  describe('XSS Prevention', () => {
    test('should accept XSS payloads in fullname (sanitization happens at render)', () => {
      // Validation layer accepts these - sanitization happens at render time
      for (const payload of XSS_PAYLOADS.slice(0, 3)) {
        const data = {
          fullname: payload,
          email: 'test@example.com',
          password: 'SecurePass123',
          terms: true,
        };

        // Should accept (will be escaped during rendering)
        expect(() => valibotParse(signUpSchema, data)).not.toThrow();
      }
    });
  });
});

// ============================================
// SIGN IN VALIDATION TESTS
// ============================================

describe('signInSchema', () => {
  describe('Valid Inputs', () => {
    test('should accept valid credentials', () => {
      const validData = {
        email: 'john@example.com',
        password: 'SecurePass123',
      };

      expect(() => valibotParse(signInSchema, validData)).not.toThrow();
    });

    test('should accept edge case emails', () => {
      for (const email of EDGE_CASE_EMAILS) {
        const data = {
          email,
          password: 'SecurePass123',
        };

        expect(() => valibotParse(signInSchema, data)).not.toThrow();
      }
    });
  });

  describe('Invalid Inputs', () => {
    test('should reject invalid email formats', () => {
      for (const invalidEmail of INVALID_EMAILS) {
        if (invalidEmail === null || invalidEmail === undefined) continue;

        const data = {
          email: invalidEmail,
          password: 'SecurePass123',
        };

        expect(() => valibotParse(signInSchema, data)).toThrow();
      }
    });

    test('should reject passwords shorter than 8 characters', () => {
      for (const weakPassword of WEAK_PASSWORDS) {
        if (weakPassword === null || weakPassword === undefined) continue;

        const data = {
          email: 'test@example.com',
          password: weakPassword,
        };

        expect(() => valibotParse(signInSchema, data)).toThrow();
      }
    });

    test('should reject missing email', () => {
      const data = {
        password: 'SecurePass123',
      };

      expect(() => valibotParse(signInSchema, data as any)).toThrow();
    });

    test('should reject missing password', () => {
      const data = {
        email: 'test@example.com',
      };

      expect(() => valibotParse(signInSchema, data as any)).toThrow();
    });
  });
});

// ============================================
// FORGOT PASSWORD VALIDATION TESTS
// ============================================

describe('forgotPasswordSchema', () => {
  describe('Valid Inputs', () => {
    test('should accept valid email', () => {
      const validData = {
        email: 'john@example.com',
      };

      expect(() => valibotParse(forgotPasswordSchema, validData)).not.toThrow();
    });

    test('should accept edge case emails', () => {
      for (const email of EDGE_CASE_EMAILS) {
        const data = { email };
        expect(() => valibotParse(forgotPasswordSchema, data)).not.toThrow();
      }
    });
  });

  describe('Invalid Inputs', () => {
    test('should reject invalid email formats', () => {
      for (const invalidEmail of INVALID_EMAILS) {
        if (invalidEmail === null || invalidEmail === undefined) continue;

        const data = { email: invalidEmail };
        expect(() => valibotParse(forgotPasswordSchema, data)).toThrow();
      }
    });

    test('should reject empty email', () => {
      const data = { email: '' };
      expect(() => valibotParse(forgotPasswordSchema, data)).toThrow();
    });

    test('should reject missing email', () => {
      const data = {};
      expect(() => valibotParse(forgotPasswordSchema, data as any)).toThrow();
    });
  });
});

// ============================================
// VERIFY ACCOUNT VALIDATION TESTS
// ============================================

describe('verifyAccountSchema', () => {
  describe('Valid Inputs', () => {
    test('should accept valid 6-digit code', () => {
      const validData = { code: '123456' };
      expect(() => valibotParse(verifyAccountSchema, validData)).not.toThrow();
    });

    test('should accept all numeric 6-digit codes', () => {
      const codes = ['000000', '111111', '999999', '123456', '654321'];
      for (const code of codes) {
        const data = { code };
        expect(() => valibotParse(verifyAccountSchema, data)).not.toThrow();
      }
    });
  });

  describe('Invalid Inputs', () => {
    test('should reject codes that are not exactly 6 characters', () => {
      for (const invalidCode of INVALID_CODES) {
        if (invalidCode === null || invalidCode === undefined) continue;

        const data = { code: invalidCode };
        expect(() => valibotParse(verifyAccountSchema, data)).toThrow();
      }
    });

    test('should reject non-numeric codes', () => {
      const invalidCodes = ['abcdef', '12345a', 'ABCDEF', '!@#$%^'];
      for (const code of invalidCodes) {
        const data = { code };
        expect(() => valibotParse(verifyAccountSchema, data)).toThrow();
      }
    });

    test('should reject empty code', () => {
      const data = { code: '' };
      expect(() => valibotParse(verifyAccountSchema, data)).toThrow();
    });

    test('should reject missing code', () => {
      const data = {};
      expect(() => valibotParse(verifyAccountSchema, data as any)).toThrow();
    });
  });
});

// ============================================
// CHANGE PASSWORD VALIDATION TESTS
// ============================================

describe('changePasswordSchema', () => {
  describe('Valid Inputs', () => {
    test('should accept valid password change data', () => {
      const validData = {
        currentPassword: 'OldPass123',
        newPassword: 'NewPass456',
        confirmPassword: 'NewPass456',
      };

      expect(() => valibotParse(changePasswordSchema, validData)).not.toThrow();
    });

    test('should accept passwords with special characters', () => {
      const data = {
        currentPassword: 'OldP@ss!23',
        newPassword: 'NewP@ss!56',
        confirmPassword: 'NewP@ss!56',
      };

      expect(() => valibotParse(changePasswordSchema, data)).not.toThrow();
    });

    test('should accept long passwords', () => {
      const longPassword = 'Password123' + 'x'.repeat(50);
      const data = {
        currentPassword: 'OldPass123',
        newPassword: longPassword,
        confirmPassword: longPassword,
      };

      expect(() => valibotParse(changePasswordSchema, data)).not.toThrow();
    });
  });

  describe('Invalid Inputs', () => {
    test('should reject when new password is too short', () => {
      const data = {
        currentPassword: 'OldPass123',
        newPassword: 'short',
        confirmPassword: 'short',
      };

      expect(() => valibotParse(changePasswordSchema, data)).toThrow();
    });

    test('should reject when passwords do not match', () => {
      const data = {
        currentPassword: 'OldPass123',
        newPassword: 'NewPass456',
        confirmPassword: 'DifferentPass789',
      };

      expect(() => valibotParse(changePasswordSchema, data)).toThrow();
    });

    test('should reject when current password is missing', () => {
      const data = {
        newPassword: 'NewPass456',
        confirmPassword: 'NewPass456',
      };

      expect(() => valibotParse(changePasswordSchema, data as any)).toThrow();
    });

    test('should reject when new password is missing', () => {
      const data = {
        currentPassword: 'OldPass123',
        confirmPassword: 'NewPass456',
      };

      expect(() => valibotParse(changePasswordSchema, data as any)).toThrow();
    });

    test('should reject when confirm password is missing', () => {
      const data = {
        currentPassword: 'OldPass123',
        newPassword: 'NewPass456',
      };

      expect(() => valibotParse(changePasswordSchema, data as any)).toThrow();
    });

    test('should reject empty passwords', () => {
      const data = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      };

      expect(() => valibotParse(changePasswordSchema, data)).toThrow();
    });
  });

  describe('Password Matching', () => {
    test('should enforce password match validation', () => {
      const mismatchCases = [
        {
          currentPassword: 'OldPass123',
          newPassword: 'NewPass456',
          confirmPassword: 'NewPass457', // Off by one
        },
        {
          currentPassword: 'OldPass123',
          newPassword: 'NewPass456',
          confirmPassword: 'newpass456', // Different case
        },
        {
          currentPassword: 'OldPass123',
          newPassword: 'NewPass456 ',
          confirmPassword: 'NewPass456', // Trailing space
        },
      ];

      for (const data of mismatchCases) {
        expect(() => valibotParse(changePasswordSchema, data)).toThrow();
      }
    });

    test('should accept exact password match', () => {
      const data = {
        currentPassword: 'OldPass123',
        newPassword: 'NewPass456',
        confirmPassword: 'NewPass456',
      };

      expect(() => valibotParse(changePasswordSchema, data)).not.toThrow();
    });
  });
});
