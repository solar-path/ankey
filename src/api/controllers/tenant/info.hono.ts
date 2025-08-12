import { Hono } from 'hono'

export const tenantInfoRoutes = new Hono()
  // Get current tenant information
  .get('/', async c => {
    try {
      const tenant = c.get('tenant')

      if (!tenant) {
        return c.json({ success: false, error: 'Tenant not found' }, 404)
      }

      return c.json({
        success: true,
        data: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          isActive: tenant.isActive,
          userCount: tenant.userCount,
          createdAt: tenant.createdAt,
        },
      })
    } catch (error) {
      console.error('Failed to get tenant info:', error)
      return c.json({ success: false, error: 'Failed to get tenant information' }, 500)
    }
  })
