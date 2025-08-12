import { OpenAPIHono } from '@hono/zod-openapi'

// TODO: Implement tenant usage OpenAPI routes
export const tenantUsageOpenAPIRoutes = new OpenAPIHono()

// Placeholder - will be implemented in next iteration
tenantUsageOpenAPIRoutes.get('/placeholder', (c) => {
  return c.json({ message: 'Tenant usage routes coming soon' })
})