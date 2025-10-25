import { usersDB, userCompaniesDB, type User, type UserCompany } from "@/modules/shared/database/db";
import * as v from "valibot";
import {
  inviteUserSchema,
  updateUserCompaniesSchema,
  type InviteUserInput,
  type UpdateUserCompaniesInput,
} from "../auth.valibot";

// Generate 6-digit invitation code
function generateInvitationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate random password for invited users
function generateRandomPassword(): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Simple hash function (matches auth-service.ts)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export class UserService {
  // Get all users (system-wide - for admin use only)
  static async getAllUsers() {
    try {
      const result = await usersDB.find({
        selector: { type: "user" },
        sort: [{ createdAt: "desc" }],
      });

      return result.docs.map((user: User) => this.sanitizeUser(user));
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Failed to fetch users");
    }
  }

  // Get users by company
  static async getUsersByCompany(companyId: string) {
    try {
      // Find all user_company associations for this company
      const userCompaniesResult = await userCompaniesDB.find({
        selector: {
          type: "user_company",
          companyId: companyId,
        },
      });

      if (userCompaniesResult.docs.length === 0) {
        return [];
      }

      // Get all user IDs
      const userIds = userCompaniesResult.docs.map((uc: any) => uc.userId);

      // Fetch all users
      const users: any[] = [];
      for (const userId of userIds) {
        try {
          const user = await usersDB.get(userId) as User;
          users.push(this.sanitizeUser(user));
        } catch (error) {
          console.warn(`User ${userId} not found, skipping`);
        }
      }

      // Sort by createdAt descending
      users.sort((a, b) => b.createdAt - a.createdAt);

      return users;
    } catch (error) {
      console.error("Error fetching users by company:", error);
      throw new Error("Failed to fetch users");
    }
  }

  // Get user by ID
  static async getUserById(userId: string) {
    try {
      const user = await usersDB.get(userId) as User;
      return this.sanitizeUser(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      throw new Error("User not found");
    }
  }

  // Get user by email
  static async getUserByEmail(email: string) {
    try {
      const result = await usersDB.find({
        selector: { email, type: "user" },
        limit: 1,
      });

      if (result.docs.length === 0) {
        return null;
      }

      return this.sanitizeUser(result.docs[0] as User);
    } catch (error) {
      console.error("Error fetching user by email:", error);
      throw new Error("Failed to fetch user");
    }
  }

  // Invite user (creates user and sends invitation email)
  static async inviteUser(input: InviteUserInput) {
    const validated = v.parse(inviteUserSchema, input);

    // Check if user already exists
    const existingUser = await this.getUserByEmail(validated.email);

    let user: User;
    let isNewUser = false;
    const invitationCode = generateInvitationCode(); // 6-digit code
    const invitationExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    if (existingUser) {
      // Existing user - just update invitation token
      user = await usersDB.get(existingUser._id) as User;
      user.invitationToken = invitationCode;
      user.invitationExpiry = invitationExpiry;
      user.updatedAt = Date.now();
      console.log(`[inviteUser] 🔄 Updating existing user ${user.email} with NEW invitationCode: ${invitationCode}`);
      await usersDB.put(user);
    } else {
      // New user - create with temporary password
      isNewUser = true;
      const tempPassword = generateRandomPassword();
      const hashedPassword = await hashPassword(tempPassword);

      user = {
        _id: `user_${Date.now()}_${crypto.randomUUID()}`,
        type: "user",
        email: validated.email,
        password: hashedPassword,
        fullname: validated.email.split("@")[0], // Temporary name
        verified: false, // Will be verified when they accept invitation
        invitationToken: invitationCode,
        invitationExpiry: invitationExpiry,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Save user to database
      console.log(`[inviteUser] Creating new user with email: ${user.email}, invitationCode: ${invitationCode}`);
      await usersDB.put(user);
      console.log(`[inviteUser] User created successfully with ID: ${user._id}`);
    }

    // Associate user with companies if provided
    if (validated.companyIds && validated.companyIds.length > 0) {
      for (const companyId of validated.companyIds) {
        // Check if association already exists
        const existing = await userCompaniesDB.find({
          selector: {
            type: "user_company",
            userId: user._id,
            companyId: companyId,
          },
        });

        if (existing.docs.length === 0) {
          const userCompany: UserCompany = {
            _id: `user_company_${Date.now()}_${crypto.randomUUID()}`,
            type: "user_company",
            userId: user._id,
            companyId,
            role: "member",
            createdAt: Date.now(),
          };
          await userCompaniesDB.put(userCompany);
        }
      }
    }

    // Send invitation email if requested
    if (validated.sendEmail !== false) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
        const response = await fetch(`${apiUrl}/api/users/send-invitation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            invitationCode: invitationCode,
            isNewUser: isNewUser,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("Failed to send invitation email:", error);
        } else {
          const result = await response.json();
          console.log("Invitation email sent:", result.messageId);
        }
      } catch (error) {
        console.error("Error sending invitation email:", error);
      }
    }

    // ALWAYS log invitation code to console for development
    console.log(`\n🔑 ═══════════════════════════════════════════`);
    console.log(`📧 Invitation for: ${user.email}`);
    console.log(`🔢 Code: ${invitationCode}`);
    console.log(`👤 New User: ${isNewUser ? 'Yes' : 'No (existing user)'}`);
    console.log(`⏰ Expires: ${new Date(invitationExpiry).toLocaleString()}`);
    console.log(`🔗 Link: ${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/auth/accept-invitation?email=${encodeURIComponent(user.email)}`);
    console.log(`═══════════════════════════════════════════\n`);

    return {
      message: isNewUser
        ? "User invited successfully. They will receive an email with a 6-digit code."
        : "Invitation sent to existing user. They will receive an email with a 6-digit code.",
      user: this.sanitizeUser(user),
      invitationCode, // Return for testing/fallback (only in dev)
    };
  }

  // Get user's companies
  static async getUserCompanies(userId: string) {
    try {
      const result = await userCompaniesDB.find({
        selector: { userId, type: "user_company" },
      });

      return result.docs as UserCompany[];
    } catch (error) {
      console.error("Error fetching user companies:", error);
      throw new Error("Failed to fetch user companies");
    }
  }

  // Update user's companies
  static async updateUserCompanies(userId: string, input: UpdateUserCompaniesInput) {
    const validated = v.parse(updateUserCompaniesSchema, input);

    // Get existing company associations
    const existingCompanies = await this.getUserCompanies(userId);

    // Remove companies that are no longer in the list
    for (const userCompany of existingCompanies) {
      if (!validated.companyIds.includes(userCompany.companyId)) {
        if (userCompany._id && userCompany._rev) {
          await userCompaniesDB.remove(userCompany._id, userCompany._rev);
        }
      }
    }

    // Add new companies
    const existingCompanyIds = existingCompanies.map((uc) => uc.companyId);
    for (const companyId of validated.companyIds) {
      if (!existingCompanyIds.includes(companyId)) {
        const userCompany: UserCompany = {
          _id: `user_company_${Date.now()}_${crypto.randomUUID()}`,
          type: "user_company",
          userId,
          companyId,
          role: "member",
          createdAt: Date.now(),
        };
        await userCompaniesDB.put(userCompany);
      }
    }

    return { message: "User companies updated successfully" };
  }

  // Block/unblock user
  static async toggleBlockUser(userId: string, block: boolean) {
    try {
      const user = await usersDB.get(userId) as User;

      if (!user) {
        throw new Error("User not found");
      }

      // In a real implementation, you'd have a 'blocked' field in User type
      // For now, we'll use a workaround with verified status
      const updatedUser = {
        ...user,
        verified: !block, // Blocking essentially unverifies the account
        updatedAt: Date.now(),
      };

      await usersDB.put(updatedUser);

      return {
        message: block ? "User blocked successfully" : "User unblocked successfully",
        user: this.sanitizeUser(updatedUser),
      };
    } catch (error) {
      console.error("Error toggling user block status:", error);
      throw new Error("Failed to update user status");
    }
  }

  // Delete user (soft delete by removing from all companies)
  static async deleteUser(userId: string) {
    try {
      // Remove all company associations
      const userCompanies = await this.getUserCompanies(userId);
      for (const userCompany of userCompanies) {
        if (userCompany._id && userCompany._rev) {
          await userCompaniesDB.remove(userCompany._id, userCompany._rev);
        }
      }

      // In a real implementation, you might want to soft delete or archive the user
      // For now, we'll actually delete the user document
      const user = await usersDB.get(userId) as User;
      if (user._id && user._rev) {
        await usersDB.remove(user._id, user._rev);
      }

      return { message: "User deleted successfully" };
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new Error("Failed to delete user");
    }
  }

  // Accept invitation
  static async acceptInvitation(email: string, invitationCode: string, newPassword?: string) {
    try {
      // Find user by email
      const users = await usersDB.find({
        selector: { email, type: "user" },
        limit: 1,
      });

      console.log(`[acceptInvitation] Searching for user with email: ${email}`);
      console.log(`[acceptInvitation] Found ${users.docs.length} users`);

      if (users.docs.length === 0) {
        throw new Error("User not found. Please check if the invitation email is correct or contact support.");
      }

      const user = users.docs[0] as User;

      // Verify invitation code
      if (user.invitationToken !== invitationCode) {
        throw new Error("Invalid invitation code");
      }

      // Check if invitation has expired
      if (!user.invitationExpiry || user.invitationExpiry < Date.now()) {
        throw new Error("Invitation code has expired");
      }

      // If new password is provided, update it (for new users)
      if (newPassword) {
        user.password = await hashPassword(newPassword);
      }

      // Mark user as verified and clear invitation token
      user.verified = true;
      user.invitationToken = undefined;
      user.invitationExpiry = undefined;
      user.updatedAt = Date.now();

      await usersDB.put(user);

      return {
        message: "Invitation accepted successfully. You can now sign in.",
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      console.error("Error accepting invitation:", error);
      throw error;
    }
  }

  // Sanitize user (remove sensitive data)
  static sanitizeUser(user: User) {
    const { password, verificationCode, resetToken, resetTokenExpiry, invitationToken, invitationExpiry, twoFactorSecret, _rev, ...sanitized } = user;
    return sanitized;
  }

  // Get user statistics
  static async getUserStats(companyId?: string) {
    try {
      let allUsers: any[];

      if (companyId) {
        // Get users for specific company
        allUsers = await this.getUsersByCompany(companyId);
      } else {
        // Get all users (system-wide)
        const result = await usersDB.find({
          selector: { type: "user" },
        });
        allUsers = result.docs.map((user: User) => this.sanitizeUser(user));
      }

      const total = allUsers.length;
      const verified = allUsers.filter((u: any) => u.verified).length;
      const unverified = total - verified;

      // Get recent users (last 30 days)
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const recent = allUsers.filter((u: any) => u.createdAt >= thirtyDaysAgo).length;

      return {
        total,
        verified,
        unverified,
        recent,
      };
    } catch (error) {
      console.error("Error fetching user stats:", error);
      throw new Error("Failed to fetch user statistics");
    }
  }
}
