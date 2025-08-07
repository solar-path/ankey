import { eq, and, or, gte, lte } from 'drizzle-orm';
import { createTenantConnection } from './db/connection';
import * as tenantSchema from './db/schemas/tenant';

export interface CreateDelegationData {
  delegatorId: string;
  delegateeId: string;
  permissionId: string;
  startDate?: Date;
  endDate?: Date;
  reason?: string;
  createdBy: string;
}

export interface UpdateDelegationData {
  endDate?: Date;
  isActive?: boolean;
  reason?: string;
}

export class DOAService {
  private db;

  constructor(private tenantDatabase: string) {
    this.db = createTenantConnection(tenantDatabase);
  }

  // Create new delegation
  async createDelegation(data: CreateDelegationData) {
    try {
      // Validate that delegator has the permission they're trying to delegate
      const delegatorPermissions = await this.db
        .select()
        .from(tenantSchema.userRoles)
        .leftJoin(
          tenantSchema.rolePermissions,
          eq(tenantSchema.userRoles.roleId, tenantSchema.rolePermissions.roleId)
        )
        .where(
          and(
            eq(tenantSchema.userRoles.userId, data.delegatorId),
            eq(tenantSchema.rolePermissions.permissionId, data.permissionId)
          )
        );

      if (delegatorPermissions.length === 0) {
        return {
          success: false,
          error: 'Delegator does not have this permission',
        };
      }

      // Check for existing active delegation for same permission
      const existingDelegation = await this.db.query.delegations.findFirst({
        where: and(
          eq(tenantSchema.delegations.delegatorId, data.delegatorId),
          eq(tenantSchema.delegations.delegateeId, data.delegateeId),
          eq(tenantSchema.delegations.permissionId, data.permissionId),
          eq(tenantSchema.delegations.isActive, true),
          or(
            eq(tenantSchema.delegations.endDate, null),
            gte(tenantSchema.delegations.endDate, new Date())
          )
        ),
      });

      if (existingDelegation) {
        return {
          success: false,
          error: 'Active delegation already exists for this permission',
        };
      }

      const delegation = await this.db
        .insert(tenantSchema.delegations)
        .values({
          ...data,
          startDate: data.startDate || new Date(),
        })
        .returning();

      return { success: true, data: delegation[0] };
    } catch (error) {
      console.error('Create delegation error:', error);
      return { success: false, error: 'Failed to create delegation' };
    }
  }

  // Get all delegations with filters
  async getDelegations(filters?: {
    delegatorId?: string;
    delegateeId?: string;
    isActive?: boolean;
    includeExpired?: boolean;
  }) {
    try {
      let whereConditions = [];

      if (filters?.delegatorId) {
        whereConditions.push(eq(tenantSchema.delegations.delegatorId, filters.delegatorId));
      }

      if (filters?.delegateeId) {
        whereConditions.push(eq(tenantSchema.delegations.delegateeId, filters.delegateeId));
      }

      if (filters?.isActive !== undefined) {
        whereConditions.push(eq(tenantSchema.delegations.isActive, filters.isActive));
      }

      if (!filters?.includeExpired) {
        whereConditions.push(
          or(
            eq(tenantSchema.delegations.endDate, null),
            gte(tenantSchema.delegations.endDate, new Date())
          )
        );
      }

      const delegations = await this.db.query.delegations.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        with: {
          delegator: {
            columns: { id: true, fullName: true, email: true },
          },
          delegatee: {
            columns: { id: true, fullName: true, email: true },
          },
          permission: true,
        },
        orderBy: [tenantSchema.delegations.createdAt],
      });

      return { success: true, data: delegations };
    } catch (error) {
      console.error('Get delegations error:', error);
      return { success: false, error: 'Failed to get delegations' };
    }
  }

  // Get delegation by ID
  async getDelegationById(id: string) {
    try {
      const delegation = await this.db.query.delegations.findFirst({
        where: eq(tenantSchema.delegations.id, id),
        with: {
          delegator: {
            columns: { id: true, fullName: true, email: true },
          },
          delegatee: {
            columns: { id: true, fullName: true, email: true },
          },
          permission: true,
        },
      });

      if (!delegation) {
        return { success: false, error: 'Delegation not found' };
      }

      return { success: true, data: delegation };
    } catch (error) {
      console.error('Get delegation error:', error);
      return { success: false, error: 'Failed to get delegation' };
    }
  }

  // Update delegation
  async updateDelegation(id: string, data: UpdateDelegationData, updatedBy: string) {
    try {
      const delegation = await this.db
        .update(tenantSchema.delegations)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(tenantSchema.delegations.id, id))
        .returning();

      if (delegation.length === 0) {
        return { success: false, error: 'Delegation not found' };
      }

      return { success: true, data: delegation[0] };
    } catch (error) {
      console.error('Update delegation error:', error);
      return { success: false, error: 'Failed to update delegation' };
    }
  }

  // Revoke delegation
  async revokeDelegation(id: string, revokedBy: string) {
    try {
      const delegation = await this.updateDelegation(
        id,
        {
          isActive: false,
          endDate: new Date(),
        },
        revokedBy
      );

      return delegation;
    } catch (error) {
      console.error('Revoke delegation error:', error);
      return { success: false, error: 'Failed to revoke delegation' };
    }
  }

  // Get active delegations for a user (as delegatee)
  async getActiveDelegationsForUser(userId: string) {
    try {
      const delegations = await this.getDelegations({
        delegateeId: userId,
        isActive: true,
        includeExpired: false,
      });

      return delegations;
    } catch (error) {
      console.error('Get active delegations for user error:', error);
      return { success: false, error: 'Failed to get active delegations' };
    }
  }

  // Get delegations created by a user (as delegator)
  async getDelegationsByDelegator(delegatorId: string) {
    try {
      const delegations = await this.getDelegations({
        delegatorId,
        includeExpired: true,
      });

      return delegations;
    } catch (error) {
      console.error('Get delegations by delegator error:', error);
      return { success: false, error: 'Failed to get delegations' };
    }
  }

  // Check if user has permission through delegation
  async hasPermissionThroughDelegation(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    try {
      const delegations = await this.db.query.delegations.findMany({
        where: and(
          eq(tenantSchema.delegations.delegateeId, userId),
          eq(tenantSchema.delegations.isActive, true),
          or(
            eq(tenantSchema.delegations.endDate, null),
            gte(tenantSchema.delegations.endDate, new Date())
          ),
          lte(tenantSchema.delegations.startDate, new Date())
        ),
        with: {
          permission: true,
        },
      });

      return delegations.some(
        delegation =>
          delegation.permission.resource === resource &&
          delegation.permission.action === action
      );
    } catch (error) {
      console.error('Check delegation permission error:', error);
      return false;
    }
  }

  // Clean up expired delegations (utility function)
  async cleanupExpiredDelegations() {
    try {
      const result = await this.db
        .update(tenantSchema.delegations)
        .set({ isActive: false })
        .where(
          and(
            eq(tenantSchema.delegations.isActive, true),
            lte(tenantSchema.delegations.endDate, new Date())
          )
        )
        .returning();

      return {
        success: true,
        message: `Cleaned up ${result.length} expired delegations`,
        count: result.length,
      };
    } catch (error) {
      console.error('Cleanup expired delegations error:', error);
      return { success: false, error: 'Failed to cleanup expired delegations' };
    }
  }

  // Get delegation summary for reporting
  async getDelegationSummary(startDate?: Date, endDate?: Date) {
    try {
      let whereConditions = [];

      if (startDate) {
        whereConditions.push(gte(tenantSchema.delegations.createdAt, startDate));
      }

      if (endDate) {
        whereConditions.push(lte(tenantSchema.delegations.createdAt, endDate));
      }

      const delegations = await this.db.query.delegations.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        with: {
          delegator: {
            columns: { id: true, fullName: true, email: true },
          },
          delegatee: {
            columns: { id: true, fullName: true, email: true },
          },
          permission: true,
        },
      });

      const summary = {
        total: delegations.length,
        active: delegations.filter(d => d.isActive).length,
        expired: delegations.filter(
          d => d.endDate && d.endDate < new Date()
        ).length,
        byPermission: delegations.reduce((acc, delegation) => {
          const key = `${delegation.permission.resource}:${delegation.permission.action}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byDelegator: delegations.reduce((acc, delegation) => {
          const key = delegation.delegator.email;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      return { success: true, data: summary };
    } catch (error) {
      console.error('Get delegation summary error:', error);
      return { success: false, error: 'Failed to get delegation summary' };
    }
  }
}