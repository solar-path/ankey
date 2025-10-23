/**
 * Company Members Service - управление членами команды компании
 *
 * Handles user-company relationships and roles
 */

import {
  userCompaniesDB,
  usersDB,
  type UserCompany,
  type User
} from "@/modules/shared/database/db";

export type CompanyRole = "owner" | "admin" | "member";

export interface CompanyMember {
  userId: string;
  email: string;
  fullname: string;
  avatar?: string;
  role: CompanyRole;
  joinedAt: number;
}

export class CompanyMembersService {
  /**
   * Get all members of a company
   */
  static async getCompanyMembers(companyId: string): Promise<CompanyMember[]> {
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

      // Fetch user details for each member
      const members: CompanyMember[] = [];
      for (const uc of userCompaniesResult.docs) {
        const userCompany = uc as UserCompany;
        try {
          const user = (await usersDB.get(userCompany.userId)) as User;
          members.push({
            userId: user._id,
            email: user.email,
            fullname: user.fullname,
            avatar: user.profile?.avatar,
            role: userCompany.role,
            joinedAt: userCompany.createdAt,
          });
        } catch (error) {
          console.warn(`User ${userCompany.userId} not found, skipping`);
        }
      }

      // Sort by role (owner first, then admin, then member) and join date
      return members.sort((a, b) => {
        const roleOrder = { owner: 0, admin: 1, member: 2 };
        if (roleOrder[a.role] !== roleOrder[b.role]) {
          return roleOrder[a.role] - roleOrder[b.role];
        }
        return a.joinedAt - b.joinedAt;
      });
    } catch (error) {
      console.error("Failed to get company members:", error);
      throw new Error("Failed to get company members");
    }
  }

  /**
   * Add a member to company
   */
  static async addMember(
    companyId: string,
    userId: string,
    role: CompanyRole = "member"
  ): Promise<void> {
    try {
      // Check if user already exists in company
      const existing = await userCompaniesDB.find({
        selector: {
          type: "user_company",
          userId: userId,
          companyId: companyId,
        },
        limit: 1,
      });

      if (existing.docs.length > 0) {
        throw new Error("User is already a member of this company");
      }

      // Create user_company association
      const userCompany: UserCompany = {
        _id: `uc_${userId}_${companyId}`,
        type: "user_company",
        userId,
        companyId,
        role,
        createdAt: Date.now(),
      };

      await userCompaniesDB.put(userCompany);
    } catch (error) {
      console.error("Failed to add member:", error);
      throw error instanceof Error ? error : new Error("Failed to add member");
    }
  }

  /**
   * Remove a member from company
   */
  static async removeMember(
    companyId: string,
    userId: string
  ): Promise<void> {
    try {
      // Find the user_company association
      const result = await userCompaniesDB.find({
        selector: {
          type: "user_company",
          userId: userId,
          companyId: companyId,
        },
        limit: 1,
      });

      if (result.docs.length === 0) {
        throw new Error("User is not a member of this company");
      }

      const userCompany = result.docs[0];

      // Check if user is the owner
      if ((userCompany as UserCompany).role === "owner") {
        // Count total owners
        const owners = await userCompaniesDB.find({
          selector: {
            type: "user_company",
            companyId: companyId,
            role: "owner",
          },
        });

        if (owners.docs.length === 1) {
          throw new Error(
            "Cannot remove the last owner. Transfer ownership first."
          );
        }
      }

      // Remove the association
      await userCompaniesDB.remove(userCompany._id, userCompany._rev!);
    } catch (error) {
      console.error("Failed to remove member:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to remove member");
    }
  }

  /**
   * Update member role
   */
  static async updateMemberRole(
    companyId: string,
    userId: string,
    newRole: CompanyRole
  ): Promise<void> {
    try {
      // Find the user_company association
      const result = await userCompaniesDB.find({
        selector: {
          type: "user_company",
          userId: userId,
          companyId: companyId,
        },
        limit: 1,
      });

      if (result.docs.length === 0) {
        throw new Error("User is not a member of this company");
      }

      const userCompany = result.docs[0] as UserCompany;

      // If changing from owner, check if there's another owner
      if (userCompany.role === "owner" && newRole !== "owner") {
        const owners = await userCompaniesDB.find({
          selector: {
            type: "user_company",
            companyId: companyId,
            role: "owner",
          },
        });

        if (owners.docs.length === 1) {
          throw new Error(
            "Cannot demote the last owner. Promote another user first."
          );
        }
      }

      // Update the role
      const updated: UserCompany = {
        ...userCompany,
        role: newRole,
      };

      await userCompaniesDB.put(updated);
    } catch (error) {
      console.error("Failed to update member role:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to update member role");
    }
  }

  /**
   * Transfer ownership to another user
   */
  static async transferOwnership(
    companyId: string,
    currentOwnerId: string,
    newOwnerId: string
  ): Promise<void> {
    try {
      // Verify current owner
      const currentOwner = await userCompaniesDB.find({
        selector: {
          type: "user_company",
          userId: currentOwnerId,
          companyId: companyId,
          role: "owner",
        },
        limit: 1,
      });

      if (currentOwner.docs.length === 0) {
        throw new Error("Current user is not the owner");
      }

      // Verify new owner exists and is a member
      const newOwner = await userCompaniesDB.find({
        selector: {
          type: "user_company",
          userId: newOwnerId,
          companyId: companyId,
        },
        limit: 1,
      });

      if (newOwner.docs.length === 0) {
        throw new Error("New owner is not a member of this company");
      }

      // Demote current owner to admin
      const currentOwnerDoc = currentOwner.docs[0] as UserCompany;
      await userCompaniesDB.put({
        ...currentOwnerDoc,
        role: "admin",
      });

      // Promote new owner
      const newOwnerDoc = newOwner.docs[0] as UserCompany;
      await userCompaniesDB.put({
        ...newOwnerDoc,
        role: "owner",
      });
    } catch (error) {
      console.error("Failed to transfer ownership:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to transfer ownership");
    }
  }

  /**
   * Get user role in company
   */
  static async getUserRole(
    userId: string,
    companyId: string
  ): Promise<CompanyRole | null> {
    try {
      const result = await userCompaniesDB.find({
        selector: {
          type: "user_company",
          userId: userId,
          companyId: companyId,
        },
        limit: 1,
      });

      if (result.docs.length === 0) {
        return null;
      }

      return (result.docs[0] as UserCompany).role;
    } catch (error) {
      console.error("Failed to get user role:", error);
      return null;
    }
  }

  /**
   * Check if user has permission to perform action
   */
  static async hasPermission(
    userId: string,
    companyId: string,
    requiredRole: CompanyRole
  ): Promise<boolean> {
    const role = await this.getUserRole(userId, companyId);
    if (!role) return false;

    const roleHierarchy = { owner: 3, admin: 2, member: 1 };
    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  }
}
