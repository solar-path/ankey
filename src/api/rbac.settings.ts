import { eq, and, inArray } from 'drizzle-orm';
import { createTenantConnection } from '@/api/db/connection';
import * as tenantSchema from '@/api/db/schemas/tenant';
import type { Permission, Role } from '@/types';

export class RBACService {
  private db;

  constructor(private tenantDatabase: string) {
    this.db = createTenantConnection(tenantDatabase);
  }

  // Permission management
  async createPermission(data: Omit<Permission, 'id'>) {
    try {
      const permission = await this.db
        .insert(tenantSchema.permissions)
        .values(data)
        .returning();

      return { success: true, data: permission[0] };
    } catch (error) {
      console.error('Create permission error:', error);
      return { success: false, error: 'Failed to create permission' };
    }
  }

  async getAllPermissions() {
    try {
      const permissions = await this.db.query.permissions.findMany({
        orderBy: [tenantSchema.permissions.resource, tenantSchema.permissions.action],
      });

      return { success: true, data: permissions };
    } catch (error) {
      console.error('Get permissions error:', error);
      return { success: false, error: 'Failed to get permissions' };
    }
  }

  async updatePermission(id: string, data: Partial<Omit<Permission, 'id'>>) {
    try {
      const permission = await this.db
        .update(tenantSchema.permissions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(tenantSchema.permissions.id, id))
        .returning();

      if (permission.length === 0) {
        return { success: false, error: 'Permission not found' };
      }

      return { success: true, data: permission[0] };
    } catch (error) {
      console.error('Update permission error:', error);
      return { success: false, error: 'Failed to update permission' };
    }
  }

  async deletePermission(id: string) {
    try {
      const result = await this.db
        .delete(tenantSchema.permissions)
        .where(eq(tenantSchema.permissions.id, id))
        .returning();

      if (result.length === 0) {
        return { success: false, error: 'Permission not found' };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete permission error:', error);
      return { success: false, error: 'Failed to delete permission' };
    }
  }

  // Role management
  async createRole(data: Omit<Role, 'id'>) {
    try {
      const role = await this.db
        .insert(tenantSchema.roles)
        .values(data)
        .returning();

      return { success: true, data: role[0] };
    } catch (error) {
      console.error('Create role error:', error);
      return { success: false, error: 'Failed to create role' };
    }
  }

  async getAllRoles() {
    try {
      const roles = await this.db.query.roles.findMany({
        with: {
          rolePermissions: {
            with: {
              permission: true,
            },
          },
        },
        orderBy: [tenantSchema.roles.name],
      });

      return { success: true, data: roles };
    } catch (error) {
      console.error('Get roles error:', error);
      return { success: false, error: 'Failed to get roles' };
    }
  }

  async getRoleById(id: string) {
    try {
      const role = await this.db.query.roles.findFirst({
        where: eq(tenantSchema.roles.id, id),
        with: {
          rolePermissions: {
            with: {
              permission: true,
            },
          },
        },
      });

      if (!role) {
        return { success: false, error: 'Role not found' };
      }

      return { success: true, data: role };
    } catch (error) {
      console.error('Get role error:', error);
      return { success: false, error: 'Failed to get role' };
    }
  }

  async updateRole(id: string, data: Partial<Omit<Role, 'id'>>) {
    try {
      const role = await this.db.query.roles.findFirst({
        where: eq(tenantSchema.roles.id, id),
      });

      if (!role) {
        return { success: false, error: 'Role not found' };
      }

      if (role.isSystem) {
        return { success: false, error: 'Cannot modify system role' };
      }

      const updatedRole = await this.db
        .update(tenantSchema.roles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(tenantSchema.roles.id, id))
        .returning();

      return { success: true, data: updatedRole[0] };
    } catch (error) {
      console.error('Update role error:', error);
      return { success: false, error: 'Failed to update role' };
    }
  }

  async deleteRole(id: string) {
    try {
      const role = await this.db.query.roles.findFirst({
        where: eq(tenantSchema.roles.id, id),
      });

      if (!role) {
        return { success: false, error: 'Role not found' };
      }

      if (role.isSystem) {
        return { success: false, error: 'Cannot delete system role' };
      }

      const result = await this.db
        .delete(tenantSchema.roles)
        .where(eq(tenantSchema.roles.id, id))
        .returning();

      return { success: true };
    } catch (error) {
      console.error('Delete role error:', error);
      return { success: false, error: 'Failed to delete role' };
    }
  }

  // Role-Permission management
  async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
    try {
      // Remove existing permissions
      await this.db
        .delete(tenantSchema.rolePermissions)
        .where(eq(tenantSchema.rolePermissions.roleId, roleId));

      // Add new permissions
      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map(permissionId => ({
          roleId,
          permissionId,
        }));

        await this.db
          .insert(tenantSchema.rolePermissions)
          .values(rolePermissions);
      }

      return { success: true };
    } catch (error) {
      console.error('Assign permissions to role error:', error);
      return { success: false, error: 'Failed to assign permissions to role' };
    }
  }

  // User-Role management
  async assignRolesToUser(userId: string, roleIds: string[], assignedBy: string) {
    try {
      // Remove existing roles
      await this.db
        .delete(tenantSchema.userRoles)
        .where(eq(tenantSchema.userRoles.userId, userId));

      // Add new roles
      if (roleIds.length > 0) {
        const userRoles = roleIds.map(roleId => ({
          userId,
          roleId,
          assignedBy,
        }));

        await this.db
          .insert(tenantSchema.userRoles)
          .values(userRoles);
      }

      return { success: true };
    } catch (error) {
      console.error('Assign roles to user error:', error);
      return { success: false, error: 'Failed to assign roles to user' };
    }
  }

  async getUserRoles(userId: string) {
    try {
      const userRoles = await this.db.query.userRoles.findMany({
        where: eq(tenantSchema.userRoles.userId, userId),
        with: {
          role: {
            with: {
              rolePermissions: {
                with: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      return { success: true, data: userRoles };
    } catch (error) {
      console.error('Get user roles error:', error);
      return { success: false, error: 'Failed to get user roles' };
    }
  }

  async getUserPermissions(userId: string) {
    try {
      const userRoles = await this.getUserRoles(userId);
      
      if (!userRoles.success) {
        return userRoles;
      }

      // Extract all permissions from user's roles
      const permissions: Permission[] = [];
      const permissionIds = new Set<string>();

      userRoles.data?.forEach(userRole => {
        userRole.role.rolePermissions.forEach(rolePermission => {
          if (!permissionIds.has(rolePermission.permission.id)) {
            permissions.push(rolePermission.permission);
            permissionIds.add(rolePermission.permission.id);
          }
        });
      });

      // Also check for delegated permissions
      const delegations = await this.db.query.delegations.findMany({
        where: and(
          eq(tenantSchema.delegations.delegateeId, userId),
          eq(tenantSchema.delegations.isActive, true),
          // Check if delegation is still valid (endDate not passed)
        ),
        with: {
          permission: true,
        },
      });

      // Add delegated permissions
      delegations.forEach(delegation => {
        if (
          (!delegation.endDate || delegation.endDate > new Date()) &&
          !permissionIds.has(delegation.permission.id)
        ) {
          permissions.push(delegation.permission);
          permissionIds.add(delegation.permission.id);
        }
      });

      return { success: true, data: permissions };
    } catch (error) {
      console.error('Get user permissions error:', error);
      return { success: false, error: 'Failed to get user permissions' };
    }
  }

  // Permission checking
  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      
      if (!userPermissions.success || !userPermissions.data) {
        return false;
      }

      return userPermissions.data.some(
        permission => permission.resource === resource && permission.action === action
      );
    } catch (error) {
      console.error('Check permission error:', error);
      return false;
    }
  }

  // Sync permissions from routes (implement based on your route structure)
  async syncPermissionsFromRoutes(routes: Array<{ resource: string; action: string; description?: string }>) {
    try {
      // Get existing permissions
      const existingPermissions = await this.getAllPermissions();
      
      if (!existingPermissions.success) {
        return existingPermissions;
      }

      const existingPermissionSet = new Set(
        existingPermissions.data?.map(p => `${p.resource}:${p.action}`)
      );

      // Add new permissions
      const newPermissions = routes.filter(
        route => !existingPermissionSet.has(`${route.resource}:${route.action}`)
      );

      if (newPermissions.length > 0) {
        const permissionsToInsert = newPermissions.map(route => ({
          name: `${route.resource}:${route.action}`,
          resource: route.resource,
          action: route.action,
          description: route.description || `${route.action} ${route.resource}`,
        }));

        await this.db
          .insert(tenantSchema.permissions)
          .values(permissionsToInsert);
      }

      return { 
        success: true, 
        message: `Synced ${newPermissions.length} new permissions`,
        addedCount: newPermissions.length 
      };
    } catch (error) {
      console.error('Sync permissions error:', error);
      return { success: false, error: 'Failed to sync permissions' };
    }
  }
}