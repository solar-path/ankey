import { requireCoreAuth } from '@/api/middleware'
import { CoreRBACService } from '@/api/core-rbac.settings'
import {
  assignPermissionsSchema,
  assignRolesSchema,
  createPermissionSchema,
  createRoleSchema,
} from '@/shared'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

// Middleware to check core admin permissions
const requireCorePermission = (resource: string, action: string) => {
  return async (c: any, next: any) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ success: false, error: 'Authentication required' }, 401)
    }

    const rbacService = new CoreRBACService()
    const hasPermission = await rbacService.hasPermission(user.id, resource, action)

    if (!hasPermission) {
      return c.json({ success: false, error: 'Insufficient permissions' }, 403)
    }

    await next()
  }
}

export const coreRBACRoutes = new Hono()
  .use('*', requireCoreAuth)

  // === PERMISSIONS ===

  // Get all permissions
  .get('/permissions', requireCorePermission('permissions', 'read'), async c => {
    const rbacService = new CoreRBACService()
    const result = await rbacService.getAllPermissions()
    return c.json(result)
  })

  .post(
    '/permissions',
    requireCorePermission('permissions', 'create'),
    zValidator('json', createPermissionSchema),
    async c => {
      const data = c.req.valid('json')
      const rbacService = new CoreRBACService()
      const result = await rbacService.createPermission(data)
      return c.json(result, result.success ? 201 : 400)
    }
  )

  // Update permission
  .put(
    '/permissions/:id',
    requireCorePermission('permissions', 'update'),
    zValidator('json', createPermissionSchema.partial()),
    async c => {
      const id = c.req.param('id')
      const data = c.req.valid('json')
      const rbacService = new CoreRBACService()
      const result = await rbacService.updatePermission(id, data)
      return c.json(result, result.success ? 200 : 400)
    }
  )

  // Delete permission
  .delete('/permissions/:id', requireCorePermission('permissions', 'delete'), async c => {
    const id = c.req.param('id')
    const rbacService = new CoreRBACService()
    const result = await rbacService.deletePermission(id)
    return c.json(result, result.success ? 200 : 400)
  })

  // Sync permissions from routes
  .post('/permissions/sync', requireCorePermission('permissions', 'sync'), async c => {
    const rbacService = new CoreRBACService()

    // Core admin permissions
    const routes = [
      { resource: 'users', action: 'create', description: 'Create new user' },
      { resource: 'users', action: 'read', description: 'View users' },
      { resource: 'users', action: 'update', description: 'Update user' },
      { resource: 'users', action: 'delete', description: 'Delete user' },
      { resource: 'tenants', action: 'create', description: 'Create new tenant' },
      { resource: 'tenants', action: 'read', description: 'View tenants' },
      { resource: 'tenants', action: 'update', description: 'Update tenant' },
      { resource: 'tenants', action: 'delete', description: 'Delete tenant' },
      { resource: 'roles', action: 'create', description: 'Create new role' },
      { resource: 'roles', action: 'read', description: 'View roles' },
      { resource: 'roles', action: 'update', description: 'Update role' },
      { resource: 'roles', action: 'delete', description: 'Delete role' },
      { resource: 'permissions', action: 'create', description: 'Create permission' },
      { resource: 'permissions', action: 'read', description: 'View permissions' },
      { resource: 'permissions', action: 'update', description: 'Update permission' },
      { resource: 'permissions', action: 'delete', description: 'Delete permission' },
      { resource: 'permissions', action: 'sync', description: 'Sync permissions' },
      { resource: 'settings', action: 'read', description: 'View system settings' },
      { resource: 'settings', action: 'update', description: 'Update system settings' },
      { resource: 'pricing', action: 'read', description: 'View pricing plans' },
      { resource: 'pricing', action: 'update', description: 'Update pricing plans' },
      { resource: 'audit', action: 'read', description: 'View audit logs' },
      { resource: 'export', action: 'create', description: 'Export data' },
      { resource: 'import', action: 'create', description: 'Import data' },
    ]

    const result = await rbacService.syncPermissionsFromRoutes(routes)
    return c.json(result)
  })

  // === ROLES ===

  // Get all roles
  .get('/roles', async c => {
    const rbacService = new CoreRBACService()
    const result = await rbacService.getAllRoles()
    return c.json(result)
  })

  // Get role by ID
  .get('/roles/:id', requireCorePermission('roles', 'read'), async c => {
    const id = c.req.param('id')
    const rbacService = new CoreRBACService()
    const result = await rbacService.getRoleById(id)
    return c.json(result, result.success ? 200 : 404)
  })

  .post(
    '/roles',
    requireCorePermission('roles', 'create'),
    zValidator('json', createRoleSchema),
    async c => {
      const data = c.req.valid('json')
      const rbacService = new CoreRBACService()
      const result = await rbacService.createRole(data)
      return c.json(result, result.success ? 201 : 400)
    }
  )

  // Update role
  .put(
    '/roles/:id',
    requireCorePermission('roles', 'update'),
    zValidator('json', createRoleSchema.partial()),
    async c => {
      const id = c.req.param('id')
      const data = c.req.valid('json')
      const rbacService = new CoreRBACService()
      const result = await rbacService.updateRole(id, data)
      return c.json(result, result.success ? 200 : 400)
    }
  )

  // Delete role
  .delete('/roles/:id', requireCorePermission('roles', 'delete'), async c => {
    const id = c.req.param('id')
    const rbacService = new CoreRBACService()
    const result = await rbacService.deleteRole(id)
    return c.json(result, result.success ? 200 : 400)
  })

  .post(
    '/roles/:id/permissions',
    requireCorePermission('roles', 'update'),
    zValidator('json', assignPermissionsSchema),
    async c => {
      const roleId = c.req.param('id')
      const { permissionIds } = c.req.valid('json')
      const rbacService = new CoreRBACService()
      const result = await rbacService.assignPermissionsToRole(roleId, permissionIds)
      return c.json(result, result.success ? 200 : 400)
    }
  )

  // === USER ROLES ===

  .post(
    '/users/:userId/roles',
    requireCorePermission('users', 'update'),
    zValidator('json', assignRolesSchema),
    async c => {
      const userId = c.req.param('userId')
      const { roleIds } = c.req.valid('json')
      const user = c.get('user')
      if (!user) {
        return c.json({ success: false, message: 'User not authenticated' }, 401)
      }
      const assignedBy = user.id
      const rbacService = new CoreRBACService()
      const result = await rbacService.assignRolesToUser(userId, roleIds, assignedBy)
      return c.json(result, result.success ? 200 : 400)
    }
  )

  // Get user roles
  .get('/users/:userId/roles', requireCorePermission('users', 'read'), async c => {
    const userId = c.req.param('userId')
    const rbacService = new CoreRBACService()
    const result = await rbacService.getUserRoles(userId)
    return c.json(result)
  })

  // Get user permissions
  .get('/users/:userId/permissions', requireCorePermission('users', 'read'), async c => {
    const userId = c.req.param('userId')
    const rbacService = new CoreRBACService()
    const result = await rbacService.getUserPermissions(userId)
    return c.json(result)
  })