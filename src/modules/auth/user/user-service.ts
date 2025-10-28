/**
 * User Service - Thin Client Layer
 *
 * All business logic is in PostgreSQL functions (auth.sql)
 * This service just calls Hono API which executes SQL functions
 */

import * as v from "valibot";
import {
  inviteUserSchema,
  type InviteUserInput,
} from "../auth.valibot";

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

export class UserService {
  /**
   * Get all users (system-wide - for admin use only)
   * TODO: Create PostgreSQL function for this
   */
  static async getAllUsers() {
    return callFunction("users.get_all");
  }

  /**
   * Get users by company
   * TODO: Create PostgreSQL function for this
   */
  static async getUsersByCompany(companyId: string) {
    return callFunction("users.get_by_company", { company_id: companyId });
  }

  /**
   * Get user by ID
   * TODO: Create PostgreSQL function for this
   */
  static async getUserById(userId: string) {
    return callFunction("users.get_by_id", { user_id: userId });
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string) {
    return callFunction("auth.get_user_by_email", { email });
  }

  /**
   * Invite user (creates user and sends invitation email)
   */
  static async inviteUser(input: InviteUserInput) {
    console.log(`[inviteUser] Starting invitation process for email: ${input.email}`);
    const validated = v.parse(inviteUserSchema, input);
    console.log(`[inviteUser] Validation passed`);

    const result = await callFunction("auth.invite_user", {
      email: validated.email,
      company_ids: validated.companyIds || [],
    });

    // Send invitation email if requested
    if (validated.sendEmail !== false) {
      try {
        await fetch(`${API_URL}/api/users/send-invitation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: result.user?.email || validated.email,
            invitationCode: result.invitationCode,
            isNewUser: result.isNewUser,
          }),
        });
        console.log("Invitation email sent successfully");
      } catch (error) {
        console.error("Error sending invitation email:", error);
      }
    }

    // Log invitation code to console for development
    console.log(`\n🔑 ═══════════════════════════════════════════`);
    console.log(`📧 Invitation for: ${validated.email}`);
    console.log(`🔢 Code: ${result.invitationCode}`);
    console.log(`👤 New User: ${result.isNewUser ? 'Yes' : 'No (existing user)'}`);
    console.log(`🔗 Link: ${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/auth/accept-invitation?email=${encodeURIComponent(validated.email)}`);
    console.log(`═══════════════════════════════════════════\n`);

    console.log(`[inviteUser] Invitation process completed successfully`);
    return {
      message: result.message,
      user: result.user,
      invitationCode: result.invitationCode, // Return for testing/fallback
    };
  }

  /**
   * Get user's companies
   * TODO: Create PostgreSQL function for this
   */
  static async getUserCompanies(userId: string) {
    return callFunction("users.get_companies", { user_id: userId });
  }

  /**
   * Update user's companies
   * TODO: Create PostgreSQL function for this
   */
  static async updateUserCompanies(userId: string, companyIds: string[]) {
    return callFunction("users.update_companies", {
      user_id: userId,
      company_ids: companyIds,
    });
  }

  /**
   * Block/unblock user
   * TODO: Create PostgreSQL function for this
   */
  static async toggleBlockUser(userId: string, block: boolean) {
    return callFunction("users.toggle_block", {
      user_id: userId,
      block: block,
    });
  }

  /**
   * Delete user (soft delete by removing from all companies)
   * TODO: Create PostgreSQL function for this
   */
  static async deleteUser(userId: string) {
    return callFunction("users.delete", { user_id: userId });
  }

  /**
   * Accept invitation
   */
  static async acceptInvitation(email: string, invitationCode: string, newPassword?: string) {
    console.log(`[acceptInvitation] Accepting invitation for: ${email}`);

    return callFunction("auth.accept_invitation", {
      email: email,
      invitation_code: invitationCode,
      new_password: newPassword,
    });
  }

  /**
   * Sanitize user (no longer needed - done in PostgreSQL)
   */
  static sanitizeUser(user: any) {
    return user;
  }

  /**
   * Get user statistics
   * TODO: Create PostgreSQL function for this
   */
  static async getUserStats(companyId?: string) {
    return callFunction("users.get_stats", { company_id: companyId });
  }
}
