import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { apiReference } from '@scalar/hono-api-reference'

// Import all route configurations
import { authOpenAPIRoutes } from './routes/core/auth.openapi'
// import { tenantsOpenAPIRoutes } from './routes/core/tenants.openapi'
// import { pricingOpenAPIRoutes } from './routes/core/pricing.openapi'
// import { rbacOpenAPIRoutes } from './routes/core/rbac.openapi'
// import { settingsOpenAPIRoutes } from './routes/core/settings.openapi'
// import { servicesOpenAPIRoutes } from './routes/core/services.openapi'

// Tenant routes
// import { tenantAuthOpenAPIRoutes } from './routes/tenant/auth.openapi'
// import { companiesOpenAPIRoutes } from './routes/tenant/companies.openapi'
// import { tenantUsersOpenAPIRoutes } from './routes/tenant/users.openapi'
// import { tenantUsageOpenAPIRoutes } from './routes/tenant/usage.openapi'

// Create the OpenAPI app
export const openAPIApp = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          error: 'Validation error',
          details: result.error.flatten(),
        },
        400
      )
    }
  },
})

// OpenAPI documentation configuration
openAPIApp.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Ankey Multi-Tenant API',
    description: `
# Ankey API Documentation

## Overview
Ankey is a comprehensive multi-tenant SaaS platform providing authentication, 
authorization, and business management capabilities.

## Authentication
The API uses cookie-based session authentication. After successful login, 
a session cookie is set that must be included in subsequent requests.

## Multi-Tenancy
The API supports both core (admin) operations and tenant-specific operations. 
Tenant context is determined by subdomain or explicit headers.

## Rate Limiting
API endpoints are rate-limited to prevent abuse. Current limits:
- Authentication endpoints: 5 requests per minute
- Data endpoints: 100 requests per minute

## Error Handling
All endpoints return consistent error responses with the following structure:
\`\`\`json
{
  "success": false,
  "error": "Error message",
  "details": {} // Optional validation details
}
\`\`\`
    `,
    contact: {
      name: 'Ankey Support',
      email: 'support@ankey.com',
      url: 'https://ankey.com/support',
    },
    license: {
      name: 'Proprietary',
      url: 'https://ankey.com/license',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001/api',
      description: 'Development server',
    },
    {
      url: 'https://api.ankey.com',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and session management',
    },
    {
      name: 'Tenants',
      description: 'Tenant/workspace management operations',
    },
    {
      name: 'Users',
      description: 'User management within tenants',
    },
    {
      name: 'Companies',
      description: 'Company/organization management',
    },
    {
      name: 'RBAC',
      description: 'Role-based access control',
    },
    {
      name: 'Pricing',
      description: 'Pricing plans and subscriptions',
    },
    {
      name: 'Settings',
      description: 'System and tenant settings',
    },
    {
      name: 'Usage',
      description: 'Resource usage tracking',
    },
    {
      name: 'Services',
      description: 'Service management',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'auth_session',
        description: 'Session cookie set after successful login',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for programmatic access (coming soon)',
      },
    },
  },
  security: [
    {
      cookieAuth: [],
    },
  ],
})

// Swagger UI
openAPIApp.get(
  '/docs',
  swaggerUI({
    url: '/api/openapi.json',
    docExpansion: 'list',
    deepLinking: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
    requestSnippetsEnabled: true,
    persistAuthorization: true,
  })
)

// Alternative: Scalar API Reference (modern UI)
openAPIApp.get(
  '/reference',
  apiReference({
    spec: {
      url: '/api/openapi.json',
    },
    theme: 'modern',
    layout: 'classic',
    darkMode: true,
    searchHotKey: 'k',
    authentication: {
      preferredSecurityScheme: 'cookieAuth',
    },
  })
)

// Register all OpenAPI routes
// Core routes
openAPIApp.route('/auth', authOpenAPIRoutes)
// openAPIApp.route('/tenants', tenantsOpenAPIRoutes)
// openAPIApp.route('/pricing', pricingOpenAPIRoutes)
// openAPIApp.route('/rbac', rbacOpenAPIRoutes)
// openAPIApp.route('/settings', settingsOpenAPIRoutes)
// openAPIApp.route('/services', servicesOpenAPIRoutes)

// Tenant routes
// openAPIApp.route('/tenant-auth', tenantAuthOpenAPIRoutes)
// openAPIApp.route('/tenant-companies', companiesOpenAPIRoutes)
// openAPIApp.route('/tenant-users', tenantUsersOpenAPIRoutes)
// openAPIApp.route('/tenant-usage', tenantUsageOpenAPIRoutes)

export default openAPIApp