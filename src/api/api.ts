import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { coreAuthRoutes } from '@/routes/core/auth.routes';
import { coreTenantsRoutes } from '@/routes/core/tenants.routes';
import { tenantAuthRoutes } from '@/routes/tenant/auth.routes';
import { tenantRBACRoutes } from '@/routes/tenant/rbac.routes';
import { TenantService } from '@/api/tenant.settings';
import { AuditService } from '@/lib/audit/audit.service';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Tenant detection middleware
app.use('*', async (c, next) => {
  const host = c.req.header('host') || '';
  const subdomain = host.split('.')[0];
  
  // Check if it's a tenant request (has subdomain and not localhost)
  if (subdomain && subdomain !== 'localhost') {
    const tenantService = new TenantService();
    const tenantResult = await tenantService.getTenantBySubdomain(subdomain);
    
    if (tenantResult.success && tenantResult.data) {
      c.set('tenant', tenantResult.data);
      c.set('tenantDatabase', tenantResult.data.database);
      c.set('isTenant', true);
    } else {
      return c.json({ success: false, error: 'Tenant not found' }, 404);
    }
  } else {
    c.set('isTenant', false);
  }
  
  await next();
});

// Add audit middleware
app.use('/api/*', (c, next) => {
  const isTenant = c.get('isTenant');
  const tenantDatabase = c.get('tenantDatabase');
  
  return AuditService.createAuditMiddleware(isTenant ? tenantDatabase : undefined)(c, next);
});

// Core routes (for localhost without subdomain)
app.route('/api/core/auth', coreAuthRoutes);
app.route('/api/core/tenants', coreTenantsRoutes);

// Tenant routes (for subdomain requests)
app.use('/api/tenant/*', async (c, next) => {
  if (!c.get('isTenant')) {
    return c.json({ success: false, error: 'This endpoint is only available for tenant workspaces' }, 400);
  }
  await next();
});

app.route('/api/tenant/auth', tenantAuthRoutes);
app.route('/api/tenant/rbac', tenantRBACRoutes);

// Health check
app.get('/api/health', (c) => {
  const isTenant = c.get('isTenant');
  const tenant = c.get('tenant');
  
  return c.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      type: isTenant ? 'tenant' : 'core',
      tenant: isTenant ? { 
        name: tenant?.name, 
        subdomain: tenant?.subdomain 
      } : null,
    },
  });
});

// Root endpoint
app.get('/', (c) => {
  const isTenant = c.get('isTenant');
  const tenant = c.get('tenant');
  
  return c.json({
    message: 'Ankey Multi-Tenant API',
    type: isTenant ? 'tenant' : 'core',
    tenant: isTenant ? tenant?.name : null,
    version: '1.0.0',
  });
});

export default app;