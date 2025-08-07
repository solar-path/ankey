import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { RBACService } from '../../lib/rbac/rbac.settings';
import { TenantAuthService } from '../../services/authService';

const tenantRBACRoutes = new Hono();

// Middleware to check authentication
const requireAuth = async (c: any, next: any) => {
  const tenantDatabase = c.get('tenantDatabase');
  if (!tenantDatabase) {
    return c.json({ success: false, error: 'Tenant not found' }, 400);
  }

  const authService = new TenantAuthService(tenantDatabase);
  const sessionId = c.req.header('Cookie')?.match(/auth_session=([^;]*)/)?.[1];
  
  if (!sessionId) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  const { session, user } = await authService.validateSession(sessionId);
  
  if (!session || !user) {
    return c.json({ success: false, error: 'Invalid session' }, 401);
  }

  c.set('user', user);
  c.set('sessionId', sessionId);
  await next();
};

// Middleware to check permissions
const requirePermission = (resource: string, action: string) => {
  return async (c: any, next: any) => {
    const user = c.get('user');
    const tenantDatabase = c.get('tenantDatabase');
    const rbacService = new RBACService(tenantDatabase);
    
    const hasPermission = await rbacService.hasPermission(user.id, resource, action);
    
    if (!hasPermission) {
      return c.json({ success: false, error: 'Insufficient permissions' }, 403);
    }
    
    await next();
  };
};

tenantRBACRoutes.use('*', requireAuth);

// === PERMISSIONS ===

// Get all permissions
tenantRBACRoutes.get('/permissions', requirePermission('permissions', 'read'), async (c) => {
  const tenantDatabase = c.get('tenantDatabase');
  const rbacService = new RBACService(tenantDatabase);
  
  const result = await rbacService.getAllPermissions();
  return c.json(result);
});

// Create permission
const createPermissionSchema = z.object({
  name: z.string().min(1),
  resource: z.string().min(1),
  action: z.string().min(1),
  description: z.string().optional(),
});

tenantRBACRoutes.post('/permissions', 
  requirePermission('permissions', 'create'),
  zValidator('json', createPermissionSchema),
  async (c) => {
    const data = c.req.valid('json');
    const tenantDatabase = c.get('tenantDatabase');
    const rbacService = new RBACService(tenantDatabase);
    
    const result = await rbacService.createPermission(data);
    return c.json(result, result.success ? 201 : 400);
  }
);

// Update permission
tenantRBACRoutes.put('/permissions/:id',
  requirePermission('permissions', 'update'),
  zValidator('json', createPermissionSchema.partial()),
  async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const tenantDatabase = c.get('tenantDatabase');
    const rbacService = new RBACService(tenantDatabase);
    
    const result = await rbacService.updatePermission(id, data);
    return c.json(result, result.success ? 200 : 400);
  }
);

// Delete permission
tenantRBACRoutes.delete('/permissions/:id',
  requirePermission('permissions', 'delete'),
  async (c) => {
    const id = c.req.param('id');
    const tenantDatabase = c.get('tenantDatabase');
    const rbacService = new RBACService(tenantDatabase);
    
    const result = await rbacService.deletePermission(id);
    return c.json(result, result.success ? 200 : 400);
  }
);

// Sync permissions from routes
tenantRBACRoutes.post('/permissions/sync',
  requirePermission('permissions', 'sync'),
  async (c) => {
    const tenantDatabase = c.get('tenantDatabase');
    const rbacService = new RBACService(tenantDatabase);
    
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
    ];
    
    const result = await rbacService.syncPermissionsFromRoutes(routes);
    return c.json(result);
  }
);

// === ROLES ===

// Get all roles
tenantRBACRoutes.get('/roles', requirePermission('roles', 'read'), async (c) => {
  const tenantDatabase = c.get('tenantDatabase');
  const rbacService = new RBACService(tenantDatabase);
  
  const result = await rbacService.getAllRoles();
  return c.json(result);
});

// Get role by ID
tenantRBACRoutes.get('/roles/:id', requirePermission('roles', 'read'), async (c) => {
  const id = c.req.param('id');
  const tenantDatabase = c.get('tenantDatabase');
  const rbacService = new RBACService(tenantDatabase);
  
  const result = await rbacService.getRoleById(id);
  return c.json(result, result.success ? 200 : 404);
});

// Create role
const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

tenantRBACRoutes.post('/roles',
  requirePermission('roles', 'create'),
  zValidator('json', createRoleSchema),
  async (c) => {
    const data = c.req.valid('json');
    const tenantDatabase = c.get('tenantDatabase');
    const rbacService = new RBACService(tenantDatabase);
    
    const result = await rbacService.createRole(data);
    return c.json(result, result.success ? 201 : 400);
  }
);

// Update role
tenantRBACRoutes.put('/roles/:id',
  requirePermission('roles', 'update'),
  zValidator('json', createRoleSchema.partial()),
  async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const tenantDatabase = c.get('tenantDatabase');
    const rbacService = new RBACService(tenantDatabase);
    
    const result = await rbacService.updateRole(id, data);
    return c.json(result, result.success ? 200 : 400);
  }
);

// Delete role
tenantRBACRoutes.delete('/roles/:id',
  requirePermission('roles', 'delete'),
  async (c) => {
    const id = c.req.param('id');
    const tenantDatabase = c.get('tenantDatabase');
    const rbacService = new RBACService(tenantDatabase);
    
    const result = await rbacService.deleteRole(id);
    return c.json(result, result.success ? 200 : 400);
  }
);

// Assign permissions to role
const assignPermissionsSchema = z.object({
  permissionIds: z.array(z.string()),
});

tenantRBACRoutes.post('/roles/:id/permissions',
  requirePermission('roles', 'update'),
  zValidator('json', assignPermissionsSchema),
  async (c) => {
    const roleId = c.req.param('id');
    const { permissionIds } = c.req.valid('json');
    const tenantDatabase = c.get('tenantDatabase');
    const rbacService = new RBACService(tenantDatabase);
    
    const result = await rbacService.assignPermissionsToRole(roleId, permissionIds);
    return c.json(result, result.success ? 200 : 400);
  }
);

// === USER ROLES ===

// Assign roles to user
const assignRolesSchema = z.object({
  roleIds: z.array(z.string()),
});

tenantRBACRoutes.post('/users/:userId/roles',
  requirePermission('users', 'update'),
  zValidator('json', assignRolesSchema),
  async (c) => {
    const userId = c.req.param('userId');
    const { roleIds } = c.req.valid('json');
    const assignedBy = c.get('user').id;
    const tenantDatabase = c.get('tenantDatabase');
    const rbacService = new RBACService(tenantDatabase);
    
    const result = await rbacService.assignRolesToUser(userId, roleIds, assignedBy);
    return c.json(result, result.success ? 200 : 400);
  }
);

// Get user roles
tenantRBACRoutes.get('/users/:userId/roles',
  requirePermission('users', 'read'),
  async (c) => {
    const userId = c.req.param('userId');
    const tenantDatabase = c.get('tenantDatabase');
    const rbacService = new RBACService(tenantDatabase);
    
    const result = await rbacService.getUserRoles(userId);
    return c.json(result);
  }
);

// Get user permissions
tenantRBACRoutes.get('/users/:userId/permissions',
  requirePermission('users', 'read'),
  async (c) => {
    const userId = c.req.param('userId');
    const tenantDatabase = c.get('tenantDatabase');
    const rbacService = new RBACService(tenantDatabase);
    
    const result = await rbacService.getUserPermissions(userId);
    return c.json(result);
  }
);

export { tenantRBACRoutes };