/**
 * Company Members Service - Thin Client Layer
 *
 * All business logic is in PostgreSQL functions (company.sql)
 * This service just calls Hono API which executes SQL functions
 */

export type CompanyRole = "owner" | "admin" | "member";

export interface CompanyMember {
  userId: string;
  email: string;
  fullname: string;
  avatar?: string;
  role: CompanyRole;
  joinedAt: number;
  position?: string;
  department?: string;
}

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

export class CompanyMembersService {
  /**
   * Get all members of a company
   */
  static async getCompanyMembers(companyId: string): Promise<CompanyMember[]> {
    const result = await callFunction("company.get_company_members", {
      company_id: companyId,
    });
    return result;
  }

  /**
   * Add a member to company
   */
  static async addMember(
    companyId: string,
    userId: string,
    role: CompanyRole = "member"
  ): Promise<void> {
    await callFunction("company.add_member", {
      company_id: companyId,
      user_id: userId,
      role: role,
    });
  }

  /**
   * Remove a member from company
   */
  static async removeMember(companyId: string, userId: string): Promise<void> {
    await callFunction("company.remove_member", {
      company_id: companyId,
      user_id: userId,
    });
  }

  /**
   * Update member role
   */
  static async updateMemberRole(
    companyId: string,
    userId: string,
    newRole: CompanyRole
  ): Promise<void> {
    await callFunction("company.update_member_role", {
      company_id: companyId,
      user_id: userId,
      new_role: newRole,
    });
  }

  /**
   * Transfer ownership to another user
   */
  static async transferOwnership(
    companyId: string,
    currentOwnerId: string,
    newOwnerId: string
  ): Promise<void> {
    await callFunction("company.transfer_ownership", {
      company_id: companyId,
      current_owner_id: currentOwnerId,
      new_owner_id: newOwnerId,
    });
  }

  /**
   * Get user role in company
   */
  static async getUserRole(userId: string, companyId: string): Promise<CompanyRole | null> {
    const result = await callFunction("company.get_user_role", {
      user_id: userId,
      company_id: companyId,
    });
    return result.role as CompanyRole | null;
  }

  /**
   * Check if user has permission to perform action
   */
  static async hasPermission(
    userId: string,
    companyId: string,
    requiredRole: CompanyRole
  ): Promise<boolean> {
    const result = await callFunction("company.has_permission", {
      user_id: userId,
      company_id: companyId,
      required_role: requiredRole,
    });
    return result.hasPermission;
  }
}
