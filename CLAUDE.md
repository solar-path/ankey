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
- **React Hook Form** with Zod resolvers for form validation
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
- All API calls must use the typed RPC approach: `coreAuth.login.$post()`, `dashboardApi.getStats()`, etc.
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
- CSS variables for theming with dark mode support
- Focus ring and accessibility styles built into components
- Comprehensive variant system for consistent design

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

### API Communication

- **NEVER use `fetch()`, `axios`, or any other HTTP client** - always use Hono RPC client
- All API calls must use the typed RPC client from `src/lib/rpc.ts`
- Use pre-defined RPC clients: `coreAuth`, `tenantAuth`, `dashboardApi`, etc.
- Follow the pattern: `const response = await coreAuth.login.$post({ json: data })`
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

#### Middleware Usage Patterns
- **Global Middleware**: Use `.use('*', middleware)` for routes requiring consistent authentication
- **Selective Middleware**: Apply per-route for mixed authentication requirements
- **Error Handling**: Let middleware handle authentication failures with proper HTTP status codes
- **Context Passing**: Use Hono's context to pass user/tenant information between middleware and routes

These rules have been established through iterative development and should be followed strictly to maintain code quality, security, and consistency throughout the project.
