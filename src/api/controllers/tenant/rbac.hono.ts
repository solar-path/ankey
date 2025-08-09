import { TenantAuthService } from '@/api/auth.settings'
import { RBACService } from '@/api/rbac.settings'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod/v4'

// Middleware to check authentication
const requireAuth = async (c: any, next: any) => {
  const tenantDatabase = c.get('tenantDatabase')
  if (!tenantDatabase) {
    return c.json({ success: false, message: 'Tenant database not found' }, 400)
  }
  if (!tenantDatabase) {
    return c.json({ success: false, error: 'Tenant not found' }, 400)
  }

  const authService = new TenantAuthService(tenantDatabase)
  const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1]

  if (!sessionId) {
    return c.json({ success: false, error: 'Authentication required' }, 401)
  }

  const { session, user } = await authService.validateSession(sessionId)

  if (!session || !user) {
    return c.json({ success: false, error: 'Invalid session' }, 401)
  }

  c.set('user', user)
  c.set('sessionId', sessionId)
  await next()
}

// Middleware to check permissions
const requirePermission = (resource: string, action: string) => {
  return async (c: any, next: any) => {
    const user = c.get('user')
    const tenantDatabase = c.get('tenantDatabase')
    if (!tenantDatabase) {
      return c.json({ success: false, message: 'Tenant database not found' }, 400)
    }
    const rbacService = new RBACService(tenantDatabase)

    const hasPermission = await rbacService.hasPermission(user.id, resource, action)

    if (!hasPermission) {
      return c.json({ success: false, error: 'Insufficient permissions' }, 403)
    }

    await next()
  }
}

// Create permission
const createPermissionSchema = z.object({
  name: z.string().min(1),
  resource: z.string().min(1),
  action: z.string().min(1),
  description: z.string().optional(),
})

// Create role
const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

// Assign permissions to role
const assignPermissionsSchema = z.object({
  permissionIds: z.array(z.string()),
})

// Assign roles to user
const assignRolesSchema = z.object({
  roleIds: z.array(z.string()),
})

export const tenantRBACRoutes = new Hono()
  .use('*', requireAuth)

  // === PERMISSIONS ===

  // Get all permissions
  .get('/permissions', requirePermission('permissions', 'read'), async c => {
    const tenantDatabase = c.get('tenantDatabase')
    if (!tenantDatabase) {
      return c.json({ success: false, message: 'Tenant database not found' }, 400)
    }
    const rbacService = new RBACService(tenantDatabase)

    const result = await rbacService.getAllPermissions()
    return c.json(result)
  })

  .post(
    '/permissions',
    requirePermission('permissions', 'create'),
    zValidator('json', createPermissionSchema),
    async c => {
      const data = c.req.valid('json')
      const tenantDatabase = c.get('tenantDatabase')
      if (!tenantDatabase) {
        return c.json({ success: false, message: 'Tenant database not found' }, 400)
      }
      const rbacService = new RBACService(tenantDatabase)

      const result = await rbacService.createPermission(data)
      return c.json(result, result.success ? 201 : 400)
    }
  )

  // Update permission
  .put(
    '/permissions/:id',
    requirePermission('permissions', 'update'),
    zValidator('json', createPermissionSchema.partial()),
    async c => {
      const id = c.req.param('id')
      const data = c.req.valid('json')
      const tenantDatabase = c.get('tenantDatabase')
      if (!tenantDatabase) {
        return c.json({ success: false, message: 'Tenant database not found' }, 400)
      }
      const rbacService = new RBACService(tenantDatabase)

      const result = await rbacService.updatePermission(id, data)
      return c.json(result, result.success ? 200 : 400)
    }
  )

  // Delete permission
  .delete('/permissions/:id', requirePermission('permissions', 'delete'), async c => {
    const id = c.req.param('id')
    const tenantDatabase = c.get('tenantDatabase')
    if (!tenantDatabase) {
      return c.json({ success: false, message: 'Tenant database not found' }, 400)
    }
    const rbacService = new RBACService(tenantDatabase)

    const result = await rbacService.deletePermission(id)
    return c.json(result, result.success ? 200 : 400)
  })

  // Sync permissions from routes
  .post('/permissions/sync', requirePermission('permissions', 'sync'), async c => {
    const tenantDatabase = c.get('tenantDatabase')
    if (!tenantDatabase) {
      return c.json({ success: false, message: 'Tenant database not found' }, 400)
    }
    const rbacService = new RBACService(tenantDatabase)

    // TODO: Extract routes automatically from route files
    // For now, define them manually
    const routes = [
      { resource: 'users', action: 'create', description: 'Create new user' },
      { resource: 'users', action: 'read', description: 'View users' },
      { resource: 'users', action: 'update', description: 'Update user' },
      { resource: 'users', action: 'delete', description: 'Delete user' },
      { resource: 'roles', action: 'create', description: 'Create new role' },
      { resource: 'roles', action: 'read', description: 'View roles' },
      { resource: 'roles', action: 'update', description: 'Update role' },
      { resource: 'roles', action: 'delete', description: 'Delete role' },
      { resource: 'permissions', action: 'create', description: 'Create permission' },
      { resource: 'permissions', action: 'read', description: 'View permissions' },
      { resource: 'permissions', action: 'update', description: 'Update permission' },
      { resource: 'permissions', action: 'delete', description: 'Delete permission' },
      { resource: 'permissions', action: 'sync', description: 'Sync permissions' },
      { resource: 'delegations', action: 'create', description: 'Create delegation' },
      { resource: 'delegations', action: 'read', description: 'View delegations' },
      { resource: 'delegations', action: 'update', description: 'Update delegation' },
      { resource: 'delegations', action: 'delete', description: 'Delete delegation' },
    ]

    const result = await rbacService.syncPermissionsFromRoutes(routes)
    return c.json(result)
  })

  // === ROLES ===

  // Get all roles
  .get('/roles', requirePermission('roles', 'read'), async c => {
    const tenantDatabase = c.get('tenantDatabase')
    if (!tenantDatabase) {
      return c.json({ success: false, message: 'Tenant database not found' }, 400)
    }
    const rbacService = new RBACService(tenantDatabase)

    const result = await rbacService.getAllRoles()
    return c.json(result)
  })

  // Get role by ID
  .get('/roles/:id', requirePermission('roles', 'read'), async c => {
    const id = c.req.param('id')
    const tenantDatabase = c.get('tenantDatabase')
    if (!tenantDatabase) {
      return c.json({ success: false, message: 'Tenant database not found' }, 400)
    }
    const rbacService = new RBACService(tenantDatabase)

    const result = await rbacService.getRoleById(id)
    return c.json(result, result.success ? 200 : 404)
  })

  .post(
    '/roles',
    requirePermission('roles', 'create'),
    zValidator('json', createRoleSchema),
    async c => {
      const data = c.req.valid('json')
      const tenantDatabase = c.get('tenantDatabase')
      if (!tenantDatabase) {
        return c.json({ success: false, message: 'Tenant database not found' }, 400)
      }
      const rbacService = new RBACService(tenantDatabase)

      const result = await rbacService.createRole(data)
      return c.json(result, result.success ? 201 : 400)
    }
  )

  // Update role
  .put(
    '/roles/:id',
    requirePermission('roles', 'update'),
    zValidator('json', createRoleSchema.partial()),
    async c => {
      const id = c.req.param('id')
      const data = c.req.valid('json')
      const tenantDatabase = c.get('tenantDatabase')
      if (!tenantDatabase) {
        return c.json({ success: false, message: 'Tenant database not found' }, 400)
      }
      const rbacService = new RBACService(tenantDatabase)

      const result = await rbacService.updateRole(id, data)
      return c.json(result, result.success ? 200 : 400)
    }
  )

  // Delete role
  .delete('/roles/:id', requirePermission('roles', 'delete'), async c => {
    const id = c.req.param('id')
    const tenantDatabase = c.get('tenantDatabase')
    if (!tenantDatabase) {
      return c.json({ success: false, message: 'Tenant database not found' }, 400)
    }
    const rbacService = new RBACService(tenantDatabase)

    const result = await rbacService.deleteRole(id)
    return c.json(result, result.success ? 200 : 400)
  })

  .post(
    '/roles/:id/permissions',
    requirePermission('roles', 'update'),
    zValidator('json', assignPermissionsSchema),
    async c => {
      const roleId = c.req.param('id')
      const { permissionIds } = c.req.valid('json')
      const tenantDatabase = c.get('tenantDatabase')
      if (!tenantDatabase) {
        return c.json({ success: false, message: 'Tenant database not found' }, 400)
      }
      const rbacService = new RBACService(tenantDatabase)

      const result = await rbacService.assignPermissionsToRole(roleId, permissionIds)
      return c.json(result, result.success ? 200 : 400)
    }
  )

  // === USER ROLES ===

  .post(
    '/users/:userId/roles',
    requirePermission('users', 'update'),
    zValidator('json', assignRolesSchema),
    async c => {
      const userId = c.req.param('userId')
      const { roleIds } = c.req.valid('json')
      const user = c.get('user')
      if (!user) {
        return c.json({ success: false, message: 'User not authenticated' }, 401)
      }
      const assignedBy = user.id
      const tenantDatabase = c.get('tenantDatabase')
      if (!tenantDatabase) {
        return c.json({ success: false, message: 'Tenant database not found' }, 400)
      }
      const rbacService = new RBACService(tenantDatabase)

      const result = await rbacService.assignRolesToUser(userId, roleIds, assignedBy)
      return c.json(result, result.success ? 200 : 400)
    }
  )

  // Get user roles
  .get('/users/:userId/roles', requirePermission('users', 'read'), async c => {
    const userId = c.req.param('userId')
    const tenantDatabase = c.get('tenantDatabase')
    if (!tenantDatabase) {
      return c.json({ success: false, message: 'Tenant database not found' }, 400)
    }
    const rbacService = new RBACService(tenantDatabase)

    const result = await rbacService.getUserRoles(userId)
    return c.json(result)
  })

  // Get user permissions
  .get('/users/:userId/permissions', requirePermission('users', 'read'), async c => {
    const userId = c.req.param('userId')
    const tenantDatabase = c.get('tenantDatabase')
    if (!tenantDatabase) {
      return c.json({ success: false, message: 'Tenant database not found' }, 400)
    }
    const rbacService = new RBACService(tenantDatabase)

    const result = await rbacService.getUserPermissions(userId)
    return c.json(result)
  })
