# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development

- `bun dev` - Start development server with hot reload
- `bun run debug` - Start development server with verbose logging (`DEBUG=vite:* bun vite`)

### Building & Deployment

- `bun run build` - Build for production (runs TypeScript compilation + Vite build)
- `bun run preview` - Preview the production build locally

### Code Quality

- `bun run lint` - Run ESLint to check code quality
- `bun run lint:fix` - Run ESLint and auto-fix issues where possible
- `bun run format` - Format all files with Prettier
- `bun run format:check` - Check if files are properly formatted

## Architecture Overview

This is a **modern full-stack React application** built with:

- **Vite** for fast development and building
- **TanStack Router** for type-safe, file-based routing with automatic code splitting
- **Tailwind CSS v4** (using the new Vite plugin `@tailwindcss/vite`)
- **shadcn/ui** components with the "new-york" style
- **Zustand** for state management
- **Hono** as a lightweight API framework (embedded in `src/api/`)
- **Drizzle ORM** for type-safe database operations with PostgreSQL
- **Zod v4** for runtime validation and TypeScript inference
- **React Hook Form** with Zod resolvers for form validation and proper shadcn/ui integration
- **Bun** as the JavaScript runtime and package manager

### Key Architecture Patterns

#### File-based Routing

Routes are defined in `src/routes/` using TanStack Router:

- `__root.tsx` - Root layout with navigation and dev tools
- Route files automatically generate the route tree in `src/routeTree.gen.ts`
- Router is configured with automatic code splitting enabled

#### Component Architecture

- **UI Components**: `src/components/ui/` contains shadcn/ui components following the component-variant pattern using `class-variance-authority`
- **Feature Components**: `src/components/` contains application-specific components like `QDrawer`, `QPhone`, `QCalendarPick`, `QDataTable`
- **State Management**: Components use Zustand stores (see `QDrawer.store.ts` for pattern)

#### State Management with Zustand

The drawer component demonstrates the state management pattern:

- Store definition with actions in `.store.ts` files
- Custom hook exports for easier component consumption
- Support for both traditional and component-based drawer content

#### API Integration & Database

- **Hono API server** embedded in `src/api/api.ts` with logger middleware
- **Hono RPC Client** for type-safe frontend-to-backend communication
- **NEVER use `fetch()` or `axios`** - always use Hono RPC client from `src/lib/rpc.ts`
- All API calls must use the typed RPC approach with unified client: `client.core.auth.login.$post()`, `client.dashboard.getStats()`, etc.
- **Drizzle ORM** integration for type-safe database operations
- **PostgreSQL** as the primary database with `pg` driver
- Database schemas and migrations managed through Drizzle Kit
- API runs alongside the Vite development server

### Path Aliases

Uses `@/*` aliases pointing to `src/*` for cleaner imports. Configured in:

- `tsconfig.json` for TypeScript
- `vite.config.ts` for runtime resolution
- `components.json` for shadcn/ui CLI

### Component Patterns

#### Drawer Component Pattern

The QDrawer component supports flexible content loading:

- Traditional: `openDrawer(title, description, content)`
- Component-based: `openDrawer(<Component />)` with metadata extraction
- Components can define `defaultTitle` and `defaultDescription` static properties

#### UI Component Variants

UI components follow the shadcn/ui pattern:

- `cva()` for variant definitions with comprehensive styling
- TypeScript integration via `VariantProps`
- Support for `asChild` prop pattern using Radix Slot
- Dark mode and accessibility built-in

### TypeScript Configuration

- Project references structure with separate configs for app and node environments
- Strict TypeScript settings enabled
- Path mapping configured for clean imports

## Development Notes

### Styling System

- Uses Tailwind CSS v4 with the new Vite plugin
- **MANDATORY: Light/Dark Theme Support** - All Tailwind classes MUST include both light and dark variants
- CSS variables for theming with dark mode support
- Focus ring and accessibility styles built into components
- Comprehensive variant system for consistent design

#### Theme Requirements

- **ALWAYS use theme-aware classes**: `bg-white dark:bg-gray-800`, `text-gray-900 dark:text-gray-100`
- **NEVER use single-theme classes**: Avoid `bg-white` or `bg-gray-800` without theme variants
- **Required theme patterns**:
  - Backgrounds: `bg-white dark:bg-gray-800` for main containers
  - Text: `text-gray-900 dark:text-gray-100` for primary text
  - Muted text: `text-muted-foreground` (uses CSS variables)
  - Borders: `border-gray-200 dark:border-gray-700`
  - Cards/Forms: `bg-white dark:bg-gray-800 shadow-sm`
- **Theme switching**: Users can toggle between light/dark themes via appearance settings

### Router Configuration

- Auto code splitting enabled for performance
- DevTools available in development
- Type-safe navigation with generated route types
- **NEVER use `window.location.href` for redirects** - always use TanStack Router's `navigate()` or `redirect()` functions
- All frontend navigation must follow TanStack Router patterns for proper state management and type safety

### State Management

- Zustand preferred over Redux for simpler state needs
- Store pattern: actions co-located with state
- Custom hooks for component-friendly APIs

### Component Development

- Use shadcn/ui CLI for adding new UI components: `npx shadcn@latest add <component>`
- Follow the variant pattern for consistent styling
- Leverage path aliases for clean imports
- Consider both light and dark mode in styling

#### UI Layout Preferences

- **DO NOT use shadcn/ui Tabs component** - prefer custom layouts and separate pages instead
- **PREFER separate route files** over tab-based navigation for better UX and maintainability
- **USE custom navigation** with proper routing instead of single-page tab switching
- This approach provides better SEO, bookmarkable URLs, and cleaner component separation

### Form Development with React Hook Form & shadcn/ui

#### Required Pattern

All forms MUST follow the shadcn/ui recommended pattern with React Hook Form:

```tsx
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { /* all fields */ }
})

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="fieldName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Label</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

#### Form Implementation Rules

- **NEVER use manual register()** - always use FormField with render props
- **NEVER display errors manually** - use FormMessage component
- **ALWAYS wrap forms with Form component** from shadcn/ui
- **USE FormControl** to wrap input components for proper styling and accessibility
- **AVOID explicit generic types** in useForm - let TypeScript infer from resolver and defaultValues
- **USE SubmitHandler type** for form submission functions: `const onSubmit: SubmitHandler<SchemaType> = async (data) => {}`

#### Checkbox Fields Pattern

For Checkbox components in forms:

```tsx
<FormField
  control={form.control}
  name="acceptTerms"
  render={({ field }) => (
    <FormItem>
      <FormControl>
        <Checkbox checked={field.value} onChange={e => field.onChange(e.target.checked)} />
      </FormControl>
      <FormLabel>Accept terms and conditions</FormLabel>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Note**: Use `onChange` with event handler, NOT `onCheckedChange`

#### Select Fields Pattern

For Select components:

```tsx
<FormField
  control={form.control}
  name="theme"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Theme</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="light">Light</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Custom Components Integration

For custom components like QPhone, QCalendarPick:

```tsx
<FormField
  control={form.control}
  name="phone"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Phone</FormLabel>
      <FormControl>
        <QPhone value={field.value} onChange={field.onChange} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### API Communication

- **NEVER use `fetch()`, `axios`, or any other HTTP client** - always use Hono RPC client
- All API calls must use the typed RPC client from `src/lib/rpc.ts`
- **USE unified `client` object** - NOT individual exports like `coreAuth`, `tenantAuth`, etc.
- Follow the pattern: `const response = await client.core.auth.login.$post({ json: data })`
- Example: `client['tenant-auth'].login.$post()` for tenant auth endpoints
- Always use `handleApiResponse()` helper for consistent response handling
- Type safety is enforced through Hono's RPC system - leverage this for better DX

### Database & API Development

- **Drizzle Kit** available for schema generation and migrations
- **NEVER use `drizzle-kit push`** - only use `drizzle-kit generate` and `drizzle-kit migrate`
- Use `tsx` for running TypeScript files directly (useful for database scripts)
- **Zod v4** schemas for API validation and TypeScript inference
- **React Hook Form** with `@hookform/resolvers` for form validation
- PostgreSQL connection through the `pg` library

## Predefined Settings Modules

The following settings files in `src/api/` are **REQUIRED** and must be used for all related operations. These files provide standardized configurations and should be modified rather than creating new ones:

- `audit.settings.ts` - Audit logging and compliance tracking
- `auth.settings.ts` - Authentication and authorization logic
- `database.settings.ts` - Database connections and configuration
- `doa.settings.ts` - Delegation of authorities and approval matrix
- `email.settings.ts` - Email service configuration
- `rbac.settings.ts` - Role-Based Access Control
- `tenant.settings.ts` - Multi-tenant architecture settings

**Important**: Always use these predefined settings files for their respective functionalities. Do not create duplicate or alternative implementations.

## Development Rules & Guidelines

Based on project evolution and established patterns, follow these strict rules when working with this codebase:

### Code Migration & Refactoring Rules

#### RPC Client Migration

- **ALWAYS use unified `client` object** from `src/lib/rpc.ts` instead of individual exports
- **NEVER use removed exports** like `coreAuth`, `coreTenants`, `coreSettings`, `dashboardApi`, etc.
- **Pattern**: Replace `coreAuth.login.$post()` with `client.core.auth.login.$post()`
- **Pattern**: Replace `coreTenants.create.$post()` with `client.core.tenants.create.$post()`
- When refactoring RPC calls, update ALL files in `src/routes/` and `src/components/` systematically

#### TypeScript Type Safety Rules

- **ALWAYS define proper TypeScript interfaces** for all API functions and data structures
- **NEVER use `any` type** - define specific interfaces in `src/shared/index.ts`
- **ALWAYS add return types** to functions, especially API endpoints
- **REQUIRED**: Define shared types in `src/shared/` for cross-module usage
- **Pattern**: Use `interface` for object shapes, `type` for unions/primitives
- Fix TypeScript errors immediately - never leave compilation errors unresolved

#### Authentication & Security Rules

- **ALWAYS use standardized middleware** for authentication across all API controllers
- **NEVER implement inline authentication** - use predefined middleware from `src/api/middleware/`
- **Core Admin Routes**: Use `requireCoreAuth` middleware for admin-only operations
- **Tenant Routes**: Use `requireTenantAuth` middleware for tenant-specific operations
- **Public Routes**: Use `optionalCoreAuth` where authentication is helpful but not required
- **Pattern**: Apply middleware using `.use('*', middlewareFunction)` or per-route basis
- **NEVER expose admin operations** without proper authentication middleware

### API Development Rules

#### Controller Structure

- **ALWAYS follow RESTful patterns** in route definitions
- **NEVER mix authentication levels** within the same controller without clear separation
- **REQUIRED**: Use `zValidator()` with Zod schemas for request validation
- **PATTERN**: Structure controllers with middleware first, then routes in logical order (GET, POST, PUT, DELETE)
- **Error Handling**: Always use `try/catch` with consistent error response format

#### Database Operations

- **ALWAYS use Drizzle ORM** for database operations - never raw SQL
- **NEVER use `drizzle-kit push`** - only use `generate` and `migrate`
- **PATTERN**: Use `createCoreConnection()` for core database, `createTenantConnection(tenantDatabase)` for tenant databases
- **ALWAYS handle multi-tenant context** properly in tenant controllers
- **REQUIRED**: Validate tenant database existence before operations

#### Response Formatting

- **ALWAYS use consistent response format**: `{ success: boolean, data?: any, error?: string }`
- **HTTP Status Codes**: Use appropriate codes (200, 201, 400, 401, 403, 404, 500)
- **Error Messages**: Provide clear, user-friendly error messages
- **NEVER expose sensitive internal errors** to client responses

### Code Quality & Maintenance Rules

#### Import Management

- **ALWAYS use path aliases** (`@/*`) for internal imports
- **NEVER use relative imports** for cross-directory references
- **PATTERN**: Import order: external packages, internal modules, types/interfaces
- **REQUIRED**: Remove unused imports immediately when refactoring

#### Zod Schema Management

- **ALWAYS use Zod v4** syntax and patterns
- **DEPRECATED**: Never use `.flatten().fieldErrors` - use `.issues` or proper error handling
- **PATTERN**: Define schemas close to usage or in `src/shared/` for reuse
- **VALIDATION**: Use `zValidator()` for Hono route validation, `safeParse()` for conditional validation

#### File Organization

- **CONTROLLER LOCATION**: All API controllers in `src/api/controllers/core/` or `src/api/controllers/tenant/`
- **MIDDLEWARE LOCATION**: Authentication middleware in `src/api/middleware/`
- **TYPES LOCATION**: Shared types and interfaces in `src/shared/index.ts`
- **SETTINGS LOCATION**: Configuration modules in `src/api/` (predefined files only)

### Debugging & Problem Resolution Rules

#### TypeScript Error Resolution

- **PRIORITY 1**: Fix compilation errors before adding new features
- **SYSTEMATIC APPROACH**: Address errors file by file, not randomly
- **TYPE DEFINITIONS**: Create missing interfaces immediately when encountered
- **COMPATIBILITY**: Ensure type compatibility between frontend and backend

#### Code Review Process

- **BEFORE REFACTORING**: Always read and understand existing code patterns
- **INCREMENTAL CHANGES**: Make small, focused changes rather than large rewrites
- **CONSISTENCY**: Follow established patterns in similar files
- **TESTING**: Verify changes don't break existing functionality

#### Migration Methodology

- **STEP 1**: Analyze scope of changes (search all affected files)
- **STEP 2**: Create/update type definitions in shared location
- **STEP 3**: Update controllers and middleware systematically
- **STEP 4**: Update frontend components and routes
- **STEP 5**: Fix TypeScript errors and run quality checks
- **STEP 6**: Test authentication and API endpoints

### Project-Specific Patterns

#### Multi-Tenant Architecture

- **CORE vs TENANT**: Clearly separate core admin functionality from tenant-specific operations
- **DATABASE CONTEXT**: Always validate and use appropriate database connection
- **AUTHENTICATION**: Use correct middleware for each tenant context
- **ISOLATION**: Ensure tenant data isolation in all operations
- **Context Detection**: Use `useSettingsContext()` hook to determine tenant vs core context in UI
- **Dynamic RPC Client**: Hook returns appropriate client based on context (subdomain or route)

#### Middleware Usage Patterns

- **Global Middleware**: Use `.use('*', middleware)` for routes requiring consistent authentication
- **Selective Middleware**: Apply per-route for mixed authentication requirements
- **Error Handling**: Let middleware handle authentication failures with proper HTTP status codes
- **Context Passing**: Use Hono's context to pass user/tenant information between middleware and routes

These rules have been established through iterative development and should be followed strictly to maintain code quality, security, and consistency throughout the project.

## SOC 2 Compliance Requirements

This application undergoes SOC 2 verification as a cloud SaaS platform helping companies build security perimeters. All development must adhere to these mandatory compliance requirements:

### Mandatory Audit Logging

**NEVER make audit logging optional** - it is required for SOC 2 Type II compliance and must be implemented as follows:

#### Automatic Audit Middleware

- **ALL API endpoints MUST be audited** except health checks and public documentation
- Audit middleware is automatically applied to `/api/*` routes via `AuditService.createAuditMiddleware()`
- **Excluded endpoints**: `/api/health`, `/api/ping`, `/api/docs`, `/api/openapi`
- **Critical security endpoints** (auth, login, register, password) are ALWAYS logged regardless of authentication status

#### Required Audit Data Points

- **User ID**: Real user ID for authenticated requests, `null` for anonymous users
- **Action**: HTTP method mapped to business operations (CREATE, read, UPDATE, DELETE)
- **Resource**: API endpoint resource being accessed
- **IP Address**: Client IP for forensic analysis
- **User Agent**: Browser/client identification
- **Timestamp**: Automatic via `createdAt` field
- **Status Code**: HTTP response status for success/failure tracking
- **Error Details**: Complete error information for failed operations

#### Database Storage

- **Core Operations**: Logged to `core_audit_logs` table in core database
- **Tenant Operations**: Logged to `audit_logs` table in respective tenant database
- **Multi-tenant Aware**: Middleware automatically routes to correct database based on context
- **Retention**: Minimum 90 days for SOC 2 compliance (recommended 7 years)

#### Console Logging

Real-time audit trail visible in server logs:

```
[AUDIT] CREATE login - User: anonymous - Status: 401 - IP: 192.168.1.100
[AUDIT] UPDATE profile - User: user-uuid - Status: 200 - IP: 192.168.1.100
```

### Security Control Implementation

#### Authentication & Authorization

- **Mandatory middleware** for all protected endpoints
- **Session-based authentication** with secure cookie management
- **Role-Based Access Control (RBAC)** via `rbac.settings.ts`
- **Multi-factor authentication support** for privileged accounts
- **Failed login attempt tracking** for brute force detection

#### Data Protection

- **Soft delete implementation** via `AuditService.safeDelete()` - never hard delete records
- **Change tracking** for sensitive data modifications
- **Encryption at rest** for sensitive fields (passwords, tokens)
- **HTTPS enforcement** in production environments

#### Delegation of Authority (DOA)

- **Approval workflows** managed via `doa.settings.ts`
- **Audit trail for approvals** with user, timestamp, and decision reasoning
- **Escalation paths** for high-value transactions
- **Separation of duties** for critical operations

### Compliance Monitoring

#### Audit Log Analysis

- **Real-time monitoring** via console logs during development
- **Failed action alerts** for security incident response
- **Compliance reporting** via `AuditService.generateComplianceReport()`
- **User activity summaries** for access reviews

#### Data Integrity

- **Immutable audit logs** - never modify historical records
- **Checksums/signatures** for audit log integrity verification
- **Regular backup verification** of audit data
- **Disaster recovery procedures** for audit trail preservation

### Development Guidelines for SOC 2

#### Code Changes

- **NEVER bypass audit logging** - all changes to authentication, authorization, or data access must maintain audit trail
- **Security-first mindset** - consider compliance implications of every feature
- **Documentation requirements** - maintain security control documentation for auditors

#### Testing Requirements

- **Audit logging tests** must verify all critical endpoints generate appropriate logs
- **Security regression testing** for authentication and authorization changes
- **Penetration testing preparation** - code must withstand security assessments

#### Incident Response

- **Audit log preservation** during security incidents
- **Forensic analysis support** via comprehensive logging
- **Change management** - all security-related changes must be documented and approved

### Implementation Status

✅ **Mandatory audit middleware implemented** and operational
✅ **Database schema supports** both core and tenant audit logging  
✅ **Critical endpoint logging** for all authentication attempts
✅ **Anonymous user tracking** for failed login monitoring
✅ **Multi-tenant aware** audit routing
✅ **Console logging** for real-time monitoring
✅ **Soft delete functionality** with automatic audit trails

**Warning**: Disabling or bypassing audit logging will result in SOC 2 compliance failures and potential security incidents. The audit system is not optional and must remain operational at all times.

## User Preferences & Patterns

### Route Organization Preferences

- **Layout Routes**: Use directory-based routing with `route.tsx` as the layout file
- **Dynamic Breadcrumbs**: Generate breadcrumbs dynamically in layout routes based on URL path
- **Avoid Redundancy**: Don't define static breadcrumbs in individual route files when handled by layout
- **Navigation Structure**: Define navigation items in the layout route with name, href, icon, and description
- **Default Redirects**: Use `index.tsx` files to redirect to the first/default sub-route

### Naming Conventions

- **Routes**: Use descriptive names without prefixes (e.g., `plans.tsx` instead of `pricing-admin.tsx`)
- **Breadcrumb Titles**: Use proper case for breadcrumb titles (e.g., "Account" not "Settings")
- **Path Consistency**: Ensure paths match the actual route structure

### Code Organization Patterns

- **Single Source of Truth**: Keep route configuration and navigation in one place (layout file)
- **Dynamic Generation**: Prefer dynamic breadcrumb generation over static definitions
- **Context-Aware**: Detect core vs tenant context for appropriate root breadcrumbs
