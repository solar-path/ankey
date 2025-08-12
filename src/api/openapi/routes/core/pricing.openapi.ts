import { OpenAPIHono } from '@hono/zod-openapi'

// TODO: Implement pricing OpenAPI routes
export const pricingOpenAPIRoutes = new OpenAPIHono()

// Placeholder - will be implemented in next iteration
pricingOpenAPIRoutes.get('/placeholder', (c) => {
  return c.json({ message: 'Pricing routes coming soon' })
})