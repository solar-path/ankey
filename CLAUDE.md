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

### State Management
- Zustand preferred over Redux for simpler state needs
- Store pattern: actions co-located with state
- Custom hooks for component-friendly APIs

### Component Development
- Use shadcn/ui CLI for adding new UI components: `npx shadcn@latest add <component>`
- Follow the variant pattern for consistent styling
- Leverage path aliases for clean imports
- Consider both light and dark mode in styling

### Database & API Development
- **Drizzle Kit** available for schema generation and migrations
- Use `tsx` for running TypeScript files directly (useful for database scripts)
- **Zod v4** schemas for API validation and TypeScript inference
- **React Hook Form** with `@hookform/resolvers` for form validation
- PostgreSQL connection through the `pg` library