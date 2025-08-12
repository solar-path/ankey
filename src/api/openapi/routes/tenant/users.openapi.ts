import { OpenAPIHono } from '@hono/zod-openapi'

// TODO: Implement tenant users OpenAPI routes
export const tenantUsersOpenAPIRoutes = new OpenAPIHono()

// Placeholder - will be implemented in next iteration
tenantUsersOpenAPIRoutes.get('/placeholder', (c) => {
  return c.json({ message: 'Tenant users routes coming soon' })
})