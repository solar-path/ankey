# CRUD Generator

A TypeScript/Bun equivalent of Laravel's make:crud command, adapted for your current stack.

## Features

- **Database Schema Generation**: Adds table definitions to Drizzle schema files
- **Hono API Controllers**: Generates full CRUD API controllers with validation  
- **TanStack Router Routes**: Creates type-safe routes with data fetching
- **React Components**: Generates data tables, forms, and list components
- **TypeScript Types**: Generates comprehensive type definitions
- **Soft Deletes**: Built-in support for soft deletion
- **Audit Logging**: Integrated with existing audit system
- **Pagination & Search**: Full-featured data table with filters

## Usage

### Interactive Mode

```bash
bun run make:crud
```

This will prompt you for:
- Model name (PascalCase, e.g., `Product`, `UserProfile`)
- Database schema (`core` or `tenant`)
- Field definitions with types and constraints
- Generation options

### Command Line Mode

```bash
bun run make:crud --name=Product --schema=tenant --fields="description:text:nullable,price:decimal,isActive:boolean"
```

## Field Types

- `text` - Short text field
- `boolean` - true/false value
- `integer` - Whole numbers
- `decimal` - Decimal numbers
- `timestamp` - Date and time
- `uuid` - Unique identifier
- `jsonb` - JSON data

## Field Options

- `:nullable` - Allow null values
- `:unique` - Enforce uniqueness

## Example

```bash
bun run make:crud --name=Product --schema=tenant --fields="description:text:nullable,price:decimal,category:text,inStock:boolean"
```

This generates:

1. **Database Schema** (`src/api/db/schemas/tenant.drizzle.ts`):
   ```typescript
   export const products = pgTable('products', {
     id: uuid('id').defaultRandom().primaryKey(),
     title: text('title').notNull(),
     description: text('description'),
     price: decimal('price').notNull(),
     category: text('category').notNull(),
     inStock: boolean('in_stock').notNull().default(false),
     deletedAt: timestamp('deleted_at'),
     createdAt: timestamp('created_at').defaultNow(),
     updatedAt: timestamp('updated_at').defaultNow(),
   })
   ```

2. **API Controller** (`src/api/controllers/tenant/product.hono.ts`):
   - `GET /api/tenant/products` - List with pagination, search, filters
   - `GET /api/tenant/products/:id` - Get single item
   - `POST /api/tenant/products` - Create new item
   - `PATCH /api/tenant/products/:id` - Update item
   - `DELETE /api/tenant/products/:id` - Soft delete
   - `PATCH /api/tenant/products/:id/restore` - Restore deleted item
   - `DELETE /api/tenant/products/:id/force` - Permanent delete
   - `POST /api/tenant/products/bulk` - Bulk operations

3. **TanStack Router Routes**:
   - `src/routes/_tenant/products/index.tsx` - Data table with CRUD operations
   - `src/routes/_tenant/products/$id.tsx` - Detail view

4. **React Components** (`src/components/products/`):
   - `ProductDataTable.tsx` - Reusable data table component
   - `ProductForm.tsx` - Create/edit form with validation
   - `ProductListItem.tsx` - List item component

5. **TypeScript Types** (`src/shared/index.ts`):
   ```typescript
   export interface Product {
     id: string
     title: string
     description: string | null
     price: number
     category: string
     inStock: boolean
     deletedAt: string | null
     createdAt: string
     updatedAt: string
   }
   ```

## Post-Generation Steps

After running the generator:

1. **Update Database**:
   ```bash
   bun run db:push:tenant  # or db:push:core
   ```

2. **Routes are automatically registered** in `src/api/api.ts`

3. **Add navigation links** to your sidebar/menu if needed

## Architecture

The generator follows your existing patterns:

- **Multi-tenant support**: Separate core and tenant schemas
- **Hono API framework**: Type-safe API controllers
- **Drizzle ORM**: Type-safe database operations
- **TanStack Router**: File-based routing with type safety
- **shadcn/ui**: Consistent UI components
- **Zod validation**: Runtime validation and TypeScript inference
- **Zustand**: State management (where needed)
- **Audit logging**: Integrated compliance tracking

## Generated File Structure

```
src/
├── api/
│   ├── controllers/
│   │   └── [schema]/
│   │       └── [model-name].hono.ts
│   └── db/schemas/
│       └── [schema].drizzle.ts (updated)
├── routes/
│   └── _[schema]/
│       └── [model-plural]/
│           ├── index.tsx
│           └── $id.tsx
├── components/
│   └── [model-plural]/
│       ├── [Model]DataTable.tsx
│       ├── [Model]Form.tsx
│       └── [Model]ListItem.tsx
└── shared/
    └── index.ts (updated with types)
```

## Field Type Mapping

| Field Type | Database | TypeScript | Validation |
|------------|----------|------------|------------|
| `text` | `text()` | `string` | `z.string()` |
| `boolean` | `boolean()` | `boolean` | `z.boolean()` |
| `integer` | `integer()` | `number` | `z.number().int()` |
| `decimal` | `decimal()` | `number` | `z.number()` |
| `timestamp` | `timestamp()` | `string` | `z.string().datetime()` |
| `uuid` | `uuid()` | `string` | `z.string().uuid()` |
| `jsonb` | `jsonb()` | `any` | `z.any()` |

## Features Included

- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Soft deletes with restore functionality
- ✅ Bulk operations
- ✅ Pagination and search
- ✅ Type-safe API and frontend
- ✅ Form validation with Zod + React Hook Form
- ✅ Responsive data tables
- ✅ Loading states and error handling
- ✅ Audit logging integration
- ✅ Multi-tenant database support
- ✅ File-based routing
- ✅ Component reusability

## Limitations

- Fields are limited to the supported types
- Complex relationships need manual configuration
- No automatic migration rollback
- UI components follow the existing shadcn/ui patterns

## Extending Generated Code

The generated code provides a solid foundation that can be extended:

- Add custom validation rules
- Implement complex relationships
- Add business logic to controllers
- Customize UI components
- Add export/import functionality
- Implement custom permissions