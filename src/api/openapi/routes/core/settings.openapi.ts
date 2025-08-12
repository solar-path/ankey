import { OpenAPIHono } from '@hono/zod-openapi'

// TODO: Implement settings OpenAPI routes
export const settingsOpenAPIRoutes = new OpenAPIHono()

// Placeholder - will be implemented in next iteration
settingsOpenAPIRoutes.get('/placeholder', (c) => {
  return c.json({ message: 'Settings routes coming soon' })
})