import { OpenAPIHono } from '@hono/zod-openapi'

// TODO: Implement companies OpenAPI routes
export const companiesOpenAPIRoutes = new OpenAPIHono()

// Placeholder - will be implemented in next iteration
companiesOpenAPIRoutes.get('/placeholder', (c) => {
  return c.json({ message: 'Companies routes coming soon' })
})