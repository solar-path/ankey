import { OpenAPIHono } from '@hono/zod-openapi'

// TODO: Implement services OpenAPI routes
export const servicesOpenAPIRoutes = new OpenAPIHono()

// Placeholder - will be implemented in next iteration
servicesOpenAPIRoutes.get('/placeholder', (c) => {
  return c.json({ message: 'Services routes coming soon' })
})