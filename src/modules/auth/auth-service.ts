/**
 * Auth Service - Thin Client Layer
 *
 * All business logic is in PostgreSQL functions (auth.sql)
 * This service just calls Hono API which executes SQL functions
 */

import * as v from "valibot";
import {
  signUpSchema,
  signInSchema,
  type SignUpInput,
  type SignInInput,
} from "./auth.valibot";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Helper function to call Postgres functions via Hono API
 */
async function callFunction(functionName: string, params: Record<string, any> = {}) {
  const response = await fetch(`${API_URL}/api/${functionName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to call ${functionName}`);
  }

  return response.json();
}

export class AuthService {
  /**
   * Sign Up - Create new user account
   */
  static async signUp(input: SignUpInput) {
    const validated = v.parse(signUpSchema, input);

    const result = await callFunction("auth.signup", {
      email: validated.email,
      password: validated.password,
      fullname: validated.fullname,
    });

    // Send verification email via API
    try {
      await fetch(`${API_URL}/api/auth/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: validated.email,
          code: result.verificationCode,
        }),
      });
    } catch (error) {
      console.error("Error sending verification email:", error);
      // Log code to console as fallback
      console.log(`Verification code for ${validated.email}: ${result.verificationCode}`);
    }

    return result;
  }

  /**
   * Verify Account with verification code
   */
  static async verifyAccount(code: string) {
    return callFunction("auth.verify_account", { code });
  }

  /**
   * Sign In - Authenticate user
   */
  static async signIn(input: SignInInput) {
    const validated = v.parse(signInSchema, input);

    return callFunction("auth.signin", {
      email: validated.email,
      password: validated.password,
    });
  }

  /**
   * Verify Session by token
   */
  static async verifySession(token: string) {
    return callFunction("auth.verify_session", { token });
  }

  /**
   * Sign Out - Invalidate session
   */
  static async signOut(token: string) {
    return callFunction("auth.signout", { token });
  }

  /**
   * Verify 2FA token
   */
  static async verify2FA(email: string, token: string) {
    return callFunction("auth.verify_2fa", { email, token });
  }

  /**
   * Forgot Password - Send reset link
   */
  static async forgotPassword(email: string) {
    const result = await callFunction("auth.forgot_password", { email });

    // Send password reset email via API
    try {
      await fetch(`${API_URL}/api/auth/send-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          resetToken: result.resetToken,
        }),
      });
    } catch (error) {
      console.error("Error sending password reset email:", error);
      console.log(`Reset token for ${email}: ${result.resetToken}`);
    }

    return result;
  }

  /**
   * Get current user from session token
   */
  static async getCurrentUser(token: string) {
    try {
      const result = await this.verifySession(token);
      return result.user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update Profile
   */
  static async updateProfile(
    userId: string,
    profileData: {
      fullname?: string;
      dob?: string;
      gender?: string;
      avatar?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    }
  ) {
    return callFunction("auth.update_profile", {
      user_id: userId,
      fullname: profileData.fullname,
      dob: profileData.dob,
      gender: profileData.gender,
      avatar: profileData.avatar,
      phone: profileData.phone,
      address: profileData.address,
      city: profileData.city,
      state: profileData.state,
      zip_code: profileData.zipCode,
      country: profileData.country,
    });
  }

  /**
   * Change Password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    return callFunction("auth.change_password", {
      user_id: userId,
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  /**
   * Setup 2FA - Generate secret and QR code
   */
  static async setup2FA(userId: string) {
    const result = await callFunction("auth.setup_2fa", { user_id: userId });

    // Generate QR code on client side using the secret
    // (QR code generation should be done client-side or via separate endpoint)
    const qrCode = await this.generateQRCode(result.secret, userId);

    return {
      secret: result.secret,
      qrCode: qrCode,
    };
  }

  /**
   * Generate QR Code for 2FA (client-side helper)
   */
  private static async generateQRCode(_secret: string, _userId: string): Promise<string> {
    // This should call a client-side QR generation library
    // For now, return a placeholder
    // In production, use libraries like 'qrcode' or call an endpoint
    return `data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=`; // placeholder
  }

  /**
   * Enable 2FA
   */
  static async enable2FA(userId: string, token: string) {
    return callFunction("auth.enable_2fa", {
      user_id: userId,
      token: token,
    });
  }

  /**
   * Disable 2FA
   */
  static async disable2FA(userId: string, token: string) {
    return callFunction("auth.disable_2fa", {
      user_id: userId,
      token: token,
    });
  }

  /**
   * Get 2FA Status
   */
  static async get2FAStatus(userId: string) {
    return callFunction("auth.get_2fa_status", { user_id: userId });
  }

  /**
   * Sanitize user - Remove sensitive data (done server-side now)
   */
  static sanitizeUser(user: any) {
    // No longer needed - PostgreSQL functions return sanitized data
    return user;
  }
}
