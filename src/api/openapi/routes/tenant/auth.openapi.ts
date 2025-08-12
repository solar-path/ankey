import { OpenAPIHono } from '@hono/zod-openapi'

// TODO: Implement tenant auth OpenAPI routes
export const tenantAuthOpenAPIRoutes = new OpenAPIHono()

// Placeholder - will be implemented in next iteration
tenantAuthOpenAPIRoutes.get('/placeholder', (c) => {
  return c.json({ message: 'Tenant auth routes coming soon' })
})