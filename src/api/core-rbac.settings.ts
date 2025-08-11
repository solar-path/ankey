import { eq } from 'drizzle-orm'
import { createCoreConnection } from '@/api/database.settings'
import * as coreSchema from '@/api/db/schemas/core.drizzle'
import type { Permission, Role } from '@/shared'

export class CoreRBACService {
  private db

  constructor() {
    this.db = createCoreConnection()
  }

  // Permission management
  async createPermission(data: Omit<Permission, 'id'>) {
    try {
      const permission = await this.db.insert(coreSchema.corePermissions).values(data).returning()

      return { success: true, data: permission[0] }
    } catch (error) {
      console.error('Create permission error:', error)
      return { success: false, error: 'Failed to create permission' }
    }
  }

  async getAllPermissions() {
    try {
      const permissions = await this.db.query.corePermissions.findMany({
        orderBy: [coreSchema.corePermissions.resource, coreSchema.corePermissions.action],
      })

      return { success: true, data: permissions }
    } catch (error) {
      console.error('Get permissions error:', error)
      return { success: false, error: 'Failed to get permissions' }
    }
  }

  async updatePermission(id: string, data: Partial<Omit<Permission, 'id'>>) {
    try {
      const permission = await this.db
        .update(coreSchema.corePermissions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(coreSchema.corePermissions.id, id))
        .returning()

      if (permission.length === 0) {
        return { success: false, error: 'Permission not found' }
      }

      return { success: true, data: permission[0] }
    } catch (error) {
      console.error('Update permission error:', error)
      return { success: false, error: 'Failed to update permission' }
    }
  }

  async deletePermission(id: string) {
    try {
      const result = await this.db
        .delete(coreSchema.corePermissions)
        .where(eq(coreSchema.corePermissions.id, id))
        .returning()

      if (result.length === 0) {
        return { success: false, error: 'Permission not found' }
      }

      return { success: true }
    } catch (error) {
      console.error('Delete permission error:', error)
      return { success: false, error: 'Failed to delete permission' }
    }
  }

  // Role management
  async createRole(data: Omit<Role, 'id'>) {
    try {
      const role = await this.db.insert(coreSchema.coreRoles).values(data).returning()

      return { success: true, data: role[0] }
    } catch (error) {
      console.error('Create role error:', error)
      return { success: false, error: 'Failed to create role' }
    }
  }

  async getAllRoles() {
    try {
      const roles = await this.db.query.coreRoles.findMany({
        with: {
          rolePermissions: {
            with: {
              permission: true,
            },
          },
        },
        orderBy: [coreSchema.coreRoles.name],
      })

      // Transform to match expected format
      const transformedRoles = roles.map(role => ({
        ...role,
        permissions: role.rolePermissions?.map(rp => rp.permission) || [],
      }))

      return { success: true, data: transformedRoles }
    } catch (error) {
      console.error('Get roles error:', error)
      return { success: false, error: 'Failed to get roles' }
    }
  }

  async getRoleById(id: string) {
    try {
      const role = await this.db.query.coreRoles.findFirst({
        where: eq(coreSchema.coreRoles.id, id),
        with: {
          rolePermissions: {
            with: {
              permission: true,
            },
          },
        },
      })

      if (!role) {
        return { success: false, error: 'Role not found' }
      }

      // Transform to match expected format
      const transformedRole = {
        ...role,
        permissions: role.rolePermissions?.map(rp => rp.permission) || [],
      }

      return { success: true, data: transformedRole }
    } catch (error) {
      console.error('Get role error:', error)
      return { success: false, error: 'Failed to get role' }
    }
  }

  async updateRole(id: string, data: Partial<Omit<Role, 'id'>>) {
    try {
      const role = await this.db
        .update(coreSchema.coreRoles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(coreSchema.coreRoles.id, id))
        .returning()

      if (role.length === 0) {
        return { success: false, error: 'Role not found' }
      }

      return { success: true, data: role[0] }
    } catch (error) {
      console.error('Update role error:', error)
      return { success: false, error: 'Failed to update role' }
    }
  }

  async deleteRole(id: string) {
    try {
      const result = await this.db
        .delete(coreSchema.coreRoles)
        .where(eq(coreSchema.coreRoles.id, id))
        .returning()

      if (result.length === 0) {
        return { success: false, error: 'Role not found' }
      }

      return { success: true }
    } catch (error) {
      console.error('Delete role error:', error)
      return { success: false, error: 'Failed to delete role' }
    }
  }

  async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
    try {
      // First, remove existing permissions
      await this.db
        .delete(coreSchema.coreRolePermissions)
        .where(eq(coreSchema.coreRolePermissions.roleId, roleId))

      // Then, add new permissions
      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map(permissionId => ({
          roleId,
          permissionId,
        }))

        await this.db.insert(coreSchema.coreRolePermissions).values(rolePermissions)
      }

      return { success: true }
    } catch (error) {
      console.error('Assign permissions error:', error)
      return { success: false, error: 'Failed to assign permissions' }
    }
  }

  async assignRolesToUser(userId: string, roleIds: string[], assignedBy: string) {
    try {
      // First, remove existing roles
      await this.db
        .delete(coreSchema.coreUserRoles)
        .where(eq(coreSchema.coreUserRoles.userId, userId))

      // Then, add new roles
      if (roleIds.length > 0) {
        const userRoles = roleIds.map(roleId => ({
          userId,
          roleId,
          assignedBy,
        }))

        await this.db.insert(coreSchema.coreUserRoles).values(userRoles)
      }

      return { success: true }
    } catch (error) {
      console.error('Assign roles error:', error)
      return { success: false, error: 'Failed to assign roles' }
    }
  }

  async getUserRoles(userId: string) {
    try {
      const userRoles = await this.db.query.coreUserRoles.findMany({
        where: eq(coreSchema.coreUserRoles.userId, userId),
        with: {
          role: true,
        },
      })

      const roles = userRoles.map(ur => ur.role)

      return { success: true, data: { userId, roles } }
    } catch (error) {
      console.error('Get user roles error:', error)
      return { success: false, error: 'Failed to get user roles' }
    }
  }

  async getUserPermissions(userId: string) {
    try {
      const userRoles = await this.db.query.coreUserRoles.findMany({
        where: eq(coreSchema.coreUserRoles.userId, userId),
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
      })

      // Collect all permissions from all roles
      const permissions = new Map()
      userRoles.forEach(ur => {
        ur.role.rolePermissions.forEach(rp => {
          permissions.set(rp.permission.id, rp.permission)
        })
      })

      return { success: true, data: { userId, permissions: Array.from(permissions.values()) } }
    } catch (error) {
      console.error('Get user permissions error:', error)
      return { success: false, error: 'Failed to get user permissions' }
    }
  }

  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const userRoles = await this.db.query.coreUserRoles.findMany({
        where: eq(coreSchema.coreUserRoles.userId, userId),
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
      })

      // Check if user has the required permission
      for (const userRole of userRoles) {
        for (const rolePermission of userRole.role.rolePermissions) {
          const permission = rolePermission.permission
          if (permission.resource === resource && permission.action === action) {
            return true
          }
        }
      }

      return false
    } catch (error) {
      console.error('Check permission error:', error)
      return false
    }
  }

  async syncPermissionsFromRoutes(
    routes: Array<{ resource: string; action: string; description: string }>
  ) {
    try {
      let created = 0
      let updated = 0

      for (const route of routes) {
        const name = `${route.resource}.${route.action}`

        // Check if permission already exists
        const existing = await this.db.query.corePermissions.findFirst({
          where: eq(coreSchema.corePermissions.name, name),
        })

        if (existing) {
          // Update existing permission
          await this.db
            .update(coreSchema.corePermissions)
            .set({
              resource: route.resource,
              action: route.action,
              description: route.description,
              updatedAt: new Date(),
            })
            .where(eq(coreSchema.corePermissions.id, existing.id))
          updated++
        } else {
          // Create new permission
          await this.db.insert(coreSchema.corePermissions).values({
            name,
            resource: route.resource,
            action: route.action,
            description: route.description,
          })
          created++
        }
      }

      return {
        success: true,
        data: { created, updated, total: routes.length },
        message: `Synced ${routes.length} permissions (${created} created, ${updated} updated)`,
      }
    } catch (error) {
      console.error('Sync permissions error:', error)
      return { success: false, error: 'Failed to sync permissions' }
    }
  }
}
