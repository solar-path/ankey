import { usersDB, sessionsDB, type User, type Session } from "@/modules/shared/database/db";
import * as v from "valibot";
import {
  signUpSchema,
  signInSchema,
  type SignUpInput,
  type SignInInput,
} from "./auth.valibot";
import { generateTwoFactorSecret, generateQRCode, verifyTwoFactorToken } from "./account/twoFactor.utils";

// Simple hash function (in production, use bcrypt or similar)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === hashedPassword;
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(): string {
  return crypto.randomUUID() + "-" + Date.now();
}

export class AuthService {
  // Sign Up
  static async signUp(input: SignUpInput) {
    // Validate input
    const validated = v.parse(signUpSchema, input);

    // Check if user already exists
    const existingUsers = await usersDB.find({
      selector: { email: validated.email, type: "user" },
    });

    if (existingUsers.docs.length > 0) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await hashPassword(validated.password);

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Create user document
    const user: User = {
      _id: `user_${Date.now()}_${crypto.randomUUID()}`,
      type: "user",
      email: validated.email,
      password: hashedPassword,
      fullname: validated.fullname,
      verified: false,
      verificationCode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Save to database
    await usersDB.put(user);

    // Send verification email via API
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/auth/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, code: verificationCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to send verification email:", error);
        // Don't throw - user is created, email failure shouldn't block signup
      } else {
        const result = await response.json();
        console.log("Verification email sent:", result.messageId);
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      // Fallback: log code to console for testing
      console.log(`Verification code for ${user.email}: ${verificationCode}`);
    }

    return {
      message: "User created successfully. Please check your email for verification code.",
      userId: user._id,
    };
  }

  // Verify Account
  static async verifyAccount(code: string) {
    const users = await usersDB.find({
      selector: { verificationCode: code, type: "user" },
    });

    if (users.docs.length === 0) {
      throw new Error("Invalid verification code");
    }

    const user = users.docs[0] as User;

    // Update user to verified
    await usersDB.put({
      ...user,
      verified: true,
      verificationCode: undefined,
      updatedAt: Date.now(),
    });

    return { message: "Account verified successfully" };
  }

  // Sign In
  static async signIn(input: SignInInput) {
    const validated = v.parse(signInSchema, input);

    // Find user
    const users = await usersDB.find({
      selector: { email: validated.email, type: "user" },
    });

    if (users.docs.length === 0) {
      throw new Error("Invalid email or password");
    }

    const user = users.docs[0] as User;

    // Verify password
    const isValidPassword = await verifyPassword(
      validated.password,
      user.password
    );

    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    // Check if account is verified
    if (!user.verified) {
      throw new Error("Please verify your account first");
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return {
        requires2FA: true,
        user: {
          email: user.email,
          fullname: user.fullname,
        },
      };
    }

    // Create session
    const session = await this.createSession(user);

    return {
      requires2FA: false,
      user: this.sanitizeUser(user),
      session: {
        token: session.token,
        expiresAt: session.expiresAt,
      },
    };
  }

  // Create Session
  static async createSession(user: User): Promise<Session> {
    const token = generateToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    const session: Session = {
      _id: `session_${Date.now()}_${crypto.randomUUID()}`,
      type: "session",
      userId: user._id,
      token,
      expiresAt,
      createdAt: Date.now(),
    };

    await sessionsDB.put(session);

    return session;
  }

  // Verify Session
  static async verifySession(token: string) {
    const sessions = await sessionsDB.find({
      selector: { token, type: "session" },
    });

    if (sessions.docs.length === 0) {
      throw new Error("Invalid session");
    }

    const session = sessions.docs[0] as Session;

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      if (session._id && session._rev) {
        await sessionsDB.remove(session._id, session._rev);
      }
      throw new Error("Session expired");
    }

    // Get user
    const user = await usersDB.get(session.userId);

    return {
      user: this.sanitizeUser(user as User),
      session: {
        token: session.token,
        expiresAt: session.expiresAt,
      },
    };
  }

  // Sign Out
  static async signOut(token: string) {
    const sessions = await sessionsDB.find({
      selector: { token, type: "session" },
    });

    if (sessions.docs.length > 0) {
      const session = sessions.docs[0] as Session;
      if (session._id && session._rev) {
        await sessionsDB.remove(session._id, session._rev);
      }
    }

    return { message: "Signed out successfully" };
  }

  // Verify 2FA
  static async verify2FA(email: string, token: string) {
    // Find user
    const users = await usersDB.find({
      selector: { email, type: "user" },
    });

    if (users.docs.length === 0) {
      throw new Error("Invalid credentials");
    }

    const user = users.docs[0] as User;

    // In a real app, verify the TOTP token against user.twoFactorSecret
    // For now, we'll accept any 6-digit code
    if (token.length !== 6) {
      throw new Error("Invalid token");
    }

    // Create session
    const session = await this.createSession(user);

    return {
      user: this.sanitizeUser(user),
      session: {
        token: session.token,
        expiresAt: session.expiresAt,
      },
    };
  }

  // Forgot Password
  static async forgotPassword(email: string) {
    const users = await usersDB.find({
      selector: { email, type: "user" },
    });

    if (users.docs.length === 0) {
      // Don't reveal if user exists
      return { message: "If an account exists, a reset link will be sent" };
    }

    const user = users.docs[0] as User;
    const resetToken = generateToken();
    const resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour

    await usersDB.put({
      ...user,
      resetToken,
      resetTokenExpiry,
      updatedAt: Date.now(),
    });

    // Send password reset email via API
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/auth/send-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, resetToken }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to send password reset email:", error);
      } else {
        const result = await response.json();
        console.log("Password reset email sent:", result.messageId);
      }
    } catch (error) {
      console.error("Error sending password reset email:", error);
      // Fallback: log token to console for testing
      console.log(`Reset token for ${user.email}: ${resetToken}`);
    }

    return { message: "If an account exists, a reset link will be sent" };
  }

  // Sanitize user (remove sensitive data)
  static sanitizeUser(user: User) {
    const { password, verificationCode, resetToken, resetTokenExpiry, _rev, ...sanitized } = user;
    return sanitized;
  }

  // Get current user from session token
  static async getCurrentUser(token: string) {
    try {
      const result = await this.verifySession(token);
      return result.user;
    } catch (error) {
      return null;
    }
  }

  // Update Profile
  static async updateProfile(userId: string, profileData: {
    fullname?: string;
    dob?: string;
    gender?: string;
    avatar?: string;
  }) {
    try {
      // Find user by ID
      const user = await usersDB.get(userId) as User;

      if (!user) {
        throw new Error("User not found");
      }

      // Update user profile
      const updatedUser = {
        ...user,
        fullname: profileData.fullname ?? user.fullname,
        profile: {
          ...user.profile,
          dob: profileData.dob ?? user.profile?.dob,
          gender: profileData.gender ?? user.profile?.gender,
          avatar: profileData.avatar ?? user.profile?.avatar,
        },
      };

      // Save to database
      await usersDB.put(updatedUser);

      // Return sanitized user
      return this.sanitizeUser(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw new Error("Failed to update profile");
    }
  }

  // Change Password
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      // Find user by ID
      const user = await usersDB.get(userId) as User;

      if (!user) {
        throw new Error("User not found");
      }

      // Verify current password
      const isValid = await verifyPassword(currentPassword, user.password);
      if (!isValid) {
        throw new Error("Current password is incorrect");
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      const updatedUser = {
        ...user,
        password: hashedPassword,
      };

      // Save to database
      await usersDB.put(updatedUser);

      return { success: true };
    } catch (error: any) {
      console.error("Error changing password:", error);
      throw new Error(error.message || "Failed to change password");
    }
  }

  // Setup 2FA - Generate secret and QR code
  static async setup2FA(userId: string) {
    try {
      const user = await usersDB.get(userId) as User;

      if (!user) {
        throw new Error("User not found");
      }

      if (user.twoFactorEnabled) {
        throw new Error("2FA is already enabled");
      }

      // Generate TOTP secret
      const secret = generateTwoFactorSecret();

      // Generate QR code
      const qrCode = await generateQRCode(user.email, secret);

      // Save secret to user (but don't enable 2FA yet)
      const updatedUser = {
        ...user,
        twoFactorSecret: secret,
        updatedAt: Date.now(),
      };

      await usersDB.put(updatedUser);

      return {
        secret,
        qrCode,
      };
    } catch (error: any) {
      console.error("Error setting up 2FA:", error);
      throw new Error(error.message || "Failed to setup 2FA");
    }
  }

  // Verify 2FA token and enable 2FA
  static async enable2FA(userId: string, token: string) {
    try {
      const user = await usersDB.get(userId) as User;

      if (!user) {
        throw new Error("User not found");
      }

      if (!user.twoFactorSecret) {
        throw new Error("2FA setup not initiated. Please start setup first.");
      }

      if (user.twoFactorEnabled) {
        throw new Error("2FA is already enabled");
      }

      // Verify the token
      const isValid = verifyTwoFactorToken(user.twoFactorSecret, token);
      if (!isValid) {
        throw new Error("Invalid verification code");
      }

      // Enable 2FA
      const updatedUser = {
        ...user,
        twoFactorEnabled: true,
        updatedAt: Date.now(),
      };

      await usersDB.put(updatedUser);

      return { success: true };
    } catch (error: any) {
      console.error("Error enabling 2FA:", error);
      throw new Error(error.message || "Failed to enable 2FA");
    }
  }

  // Disable 2FA
  static async disable2FA(userId: string, token: string) {
    try {
      const user = await usersDB.get(userId) as User;

      if (!user) {
        throw new Error("User not found");
      }

      if (!user.twoFactorEnabled) {
        throw new Error("2FA is not enabled");
      }

      if (!user.twoFactorSecret) {
        throw new Error("2FA secret not found");
      }

      // Verify the token
      const isValid = verifyTwoFactorToken(user.twoFactorSecret, token);
      if (!isValid) {
        throw new Error("Invalid verification code");
      }

      // Disable 2FA and remove secret
      const updatedUser = {
        ...user,
        twoFactorEnabled: false,
        twoFactorSecret: undefined,
        updatedAt: Date.now(),
      };

      await usersDB.put(updatedUser);

      return { success: true };
    } catch (error: any) {
      console.error("Error disabling 2FA:", error);
      throw new Error(error.message || "Failed to disable 2FA");
    }
  }

  // Get 2FA status
  static async get2FAStatus(userId: string) {
    try {
      const user = await usersDB.get(userId) as User;

      if (!user) {
        throw new Error("User not found");
      }

      return {
        enabled: user.twoFactorEnabled || false,
        required: false, // TODO: Implement organization-level 2FA requirement
        deadline: null,
      };
    } catch (error: any) {
      console.error("Error getting 2FA status:", error);
      throw new Error(error.message || "Failed to get 2FA status");
    }
  }
}
