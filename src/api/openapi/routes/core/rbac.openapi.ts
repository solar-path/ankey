import { OpenAPIHono } from '@hono/zod-openapi'

// TODO: Implement RBAC OpenAPI routes
export const rbacOpenAPIRoutes = new OpenAPIHono()

// Placeholder - will be implemented in next iteration
rbacOpenAPIRoutes.get('/placeholder', (c) => {
  return c.json({ message: 'RBAC routes coming soon' })
})