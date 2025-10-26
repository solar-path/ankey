# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference for LLMs

When working with this codebase, always reference these comprehensive guides:
- **[@docs/couchDb.llm.txt](docs/couchDb.llm.txt)** - Complete PouchDB/CouchDB reference (1200+ lines)
- **[@docs/shadcn.llm.txt](docs/shadcn.llm.txt)** - Shadcn/ui components reference

These files contain detailed API documentation, best practices, and examples for the core technologies used in this project.

## Project Overview

**Ankey** is a local-first multi-tenant authentication and company management system built with React, TypeScript, and PouchDB/CouchDB. It features:
- Real-time bi-directional sync between local (IndexedDB) and remote (CouchDB) databases
- **Multi-tenancy with data isolation** using CouchDB partitioned databases
- Dual server architecture: Vite dev server (port 5173) + Hono API server (port 3001)
- Email notifications via SMTP for verification, password reset, and inquiries
- Team member management with roles (owner, admin, member)

## Development Commands

```bash
# Start both servers (Vite + Hono API, auto-kills ports 5173 & 3001)
bun run dev

# Start individual servers
bun run dev:vite   # Frontend only
bun run dev:api    # Backend API only

# Build for production (outputs to dist/ and logs to docs/debug.txt)
bun run build

# Type checking only
bunx tsc --noEmit

# Preview production build
bun run preview

# Import reference data
bun run import:data
```

## Core Architecture

### Data & State Management Philosophy

Ankey uses a three-layer architecture with clear separation of concerns:

1. **PouchDB/CouchDB** - Persistent data (users, sessions, reference data, company data)
2. **Zustand** - UI state (auth state, active company, breadcrumbs, tasks)
3. **Hono API** - Backend operations (email sending, external integrations)

**Key Principle:** PouchDB for data that needs offline-first sync, Zustand for ephemeral UI state.

### Dual Server Architecture

**Frontend (Vite)**: Port 5173 - React SPA with PouchDB client-side databases
**Backend (Hono)**: Port 3001 - Node.js API for email services (SMTP)

**API Routes:**
- `POST /api/auth/send-verification` - Send verification code email
- `POST /api/auth/send-password-reset` - Send password reset email
- `POST /api/inquiry/send-confirmation` - Send inquiry confirmation email

**Why separate backend?** Email services (nodemailer/SMTP) require Node.js runtime and can't run in browser.

### Routing System (Wouter-based)

The app uses a **two-layout system** where routes are determined at [App.tsx](src/App.tsx):

- **Public routes** (`/`, `/learn`, `/offers`, `/contact`, `/track-inquiry`, `/auth/*`) render in `PublicLayout`
- **Private routes** (`/dashboard`, `/account`, `/company`) render in `PrivateLayout` with auth protection
- Route matching is **exact with sub-route support** - uses `location === route || location.startsWith(route + "?") || location.startsWith(route + "/")`

**Important:** Route protection happens at the **layout level** (PrivateLayout), never in individual page components.

### Database Architecture (PouchDB + CouchDB)

**Current Setup:** PouchDB loaded via CDN in [index.html](index.html):
```html
<script src="https://cdn.jsdelivr.net/npm/pouchdb@9.0.0/dist/pouchdb.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/pouchdb@9.0.0/dist/pouchdb.find.min.js"></script>
```

**Seven databases** (all with local + remote pairs):
```typescript
// Global databases
usersDB / remoteUsersDB                   // User accounts
sessionsDB / remoteSessionsDB             // Auth sessions
inquiriesDB / remoteInquiriesDB           // Contact form inquiries
companiesDB / remoteCompaniesDB           // Company metadata
userCompaniesDB / remoteUserCompaniesDB   // User-company relationships

// Partitioned databases (isolated by company)
orgchartsDB / remoteOrgchartsDB           // Organization structures
chartOfAccountsDB / remoteChartOfAccountsDB // Chart of accounts
```

**Location:** Database setup in [src/modules/shared/database/db.ts](src/modules/shared/database/db.ts)

**Sync:** Real-time bi-directional sync configured with `{ live: true, retry: true }` in `setupSync()`.

**Document Types:** All documents have a `type` field discriminator (`"user"`, `"session"`, `"inquiry"`) for efficient querying.

### Authentication Flow

1. **Sign Up** → [AuthService.signUp()](src/modules/auth/auth-service.ts) → Creates user with `verified: false` + sends email with 6-digit code via API
2. **Verify** → `AuthService.verifyAccount(code)` → Sets `verified: true`
3. **Sign In** → `AuthService.signIn()` → Validates credentials, creates session
4. **Session** → Token stored in `localStorage.sessionToken`, expires in 7 days
5. **Sign Out** → `AuthService.signOut()` → Removes session from DB and localStorage

**Password hashing:** Currently SHA-256 (simple). For production, use bcrypt.

**Session restoration:** [AuthProvider](src/lib/auth-context.tsx) checks `localStorage` on mount and validates session via `verifySession()`.

**Email delivery:** AuthService calls Hono API (`/api/auth/send-verification`) which uses nodemailer to send emails via SMTP.

### Multi-tenancy & Company Management

**Architecture:** Uses CouchDB 3.5+ partitioned databases for data isolation between companies.

**Key Files:**
- [CompanyService](src/modules/company/company-service.ts) - Company CRUD operations
- [CompanyMembersService](src/modules/company/company-members-service.ts) - Team member management
- [CompanyDatabaseFactory](src/modules/shared/database/company-db-factory.ts) - Partitioned database access
- [CompanyContext](src/lib/company-context.tsx) - Active company state management
- [TeamSwitcher](src/lib/ui/team-switcher.tsx) - UI for switching between companies

**Data Isolation:**
- **Global data**: `companies`, `user_companies` - company metadata and memberships
- **Partitioned data**: `orgcharts`, `chartofaccounts` - isolated by partition key `company:{companyId}:`
- **Auto-filtering**: All queries automatically scoped to active company via CompanyDatabaseFactory

**Roles:**
- **Owner**: Full control, can transfer ownership, manage all members
- **Admin**: Can manage members (except owners), edit company settings
- **Member**: Read-only access to company data

**User Flow:**
1. User creates workspace company → becomes owner
2. Owner invites members → assigned roles
3. User switches companies via TeamSwitcher
4. CompanyContext loads active company → CompanyDatabaseFactory connects to partitions
5. All data queries automatically filtered by `companyId`

**Scalability:** Supports 100,000+ companies using 4 partitioned databases vs 300,000+ individual databases.

See [docs/MULTITENANCY.md](docs/MULTITENANCY.md) for detailed architecture and examples.

### State Management (Zustand + Legacy Context Wrappers)

**Current approach:** Zustand stores with legacy Context API wrappers for backward compatibility.

**Zustand Stores** (recommended for new code):
```typescript
// Located in src/modules/shared/stores/
import { useAuthStore } from "@/modules/shared/stores";
import { useCompanyStore } from "@/modules/shared/stores";
import { useBreadcrumbStore } from "@/modules/shared/stores";
import { useTaskStore } from "@/modules/shared/stores";

const { user, isAuthenticated, login, logout } = useAuthStore();
const { activeCompany, setActiveCompany } = useCompanyStore();
```

**Legacy Context Wrappers** (for backward compatibility):
```typescript
// Located in src/lib/
import { useAuth } from "@/lib/auth-context";
import { useCompany } from "@/lib/company-context";
import { useBreadcrumb } from "@/lib/breadcrumb-context";
import { useTask } from "@/lib/task-context";
```

**Why Zustand?**
- Better performance (no unnecessary re-renders)
- Built-in localStorage persistence
- Simpler testing
- Less boilerplate
- DevTools support

### Form Validation (Valibot)

All validation schemas centralized in `src/modules/auth/auth.valibot.ts`:

```typescript
export const signUpSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(8)),
  // ...
});

export type SignUpInput = v.InferOutput<typeof signUpSchema>;
```

**Usage:**
```typescript
const form = useForm<SignUpInput>({
  resolver: valibotResolver(signUpSchema),
});
```

## Module Organization

### Naming Conventions

- **Pages:** `*.page.tsx` (e.g., `signin.page.tsx`)
- **Layouts:** `*.layout.tsx` (e.g., `public.layout.tsx`)
- **Services:** `*-service.ts` (e.g., `auth-service.ts`, `inquiry-service.ts`)
- **Contexts:** `*-context.tsx` (e.g., `auth-context.tsx`)
- **Schemas:** `*.valibot.ts` (validation schemas)
- **Custom UI:** `Q*.ui.tsx` (enhanced components like `QPassword.ui.tsx`)

### Directory Structure

```
src/
├── api/                                 # Backend API (Hono)
│   ├── server.ts                        # Server entry point
│   ├── api.hono.ts                      # API routes
│   └── mail.settings.ts                 # SMTP email configuration
│
├── modules/
│   ├── auth/                            # Authentication module
│   │   ├── auth.valibot.ts             # Validation schemas
│   │   ├── auth-service.ts             # Business logic
│   │   ├── signin.page.tsx
│   │   ├── signup.page.tsx
│   │   ├── verifyAccount.page.tsx
│   │   ├── forgotPassword.page.tsx
│   │   └── account/                    # Account settings pages
│   │
│   ├── company/                         # Company module
│   │   ├── company-service.ts          # Company CRUD
│   │   ├── company-members-service.ts  # Team management
│   │   └── companyDashboard.page.tsx
│   │
│   ├── htr/                            # Human Resources module
│   │   └── orgchart/                   # Org chart management
│   │       ├── orgchart.types.ts
│   │       ├── orgchart-service.ts
│   │       ├── pdf-generator.service.ts
│   │       └── orgchartView.page.tsx
│   │
│   ├── inquiry/                        # Inquiry module
│   │   ├── inquiry-service.ts
│   │   ├── contactUs.page.tsx
│   │   └── trackInquiry.page.tsx
│   │
│   ├── pricing/
│   │   └── offers.page.tsx
│   │
│   └── shared/                          # Shared modules
│       ├── database/                    # PouchDB layer
│       │   ├── db.ts                   # Global DBs (users, sessions, etc.)
│       │   ├── company-db-factory.ts   # Partitioned DB access
│       │   ├── reference-data.ts       # Countries, Industries
│       │   └── index.ts
│       │
│       └── stores/                      # Zustand stores
│           ├── auth.store.ts           # Auth UI state
│           ├── company.store.ts        # Company UI state
│           ├── breadcrumb.store.ts     # Breadcrumb UI state
│           ├── task.store.ts           # Task UI state
│           └── index.ts
│
├── lib/                                # Legacy & UI components
│   ├── auth-context.tsx                # Legacy wrapper (uses Zustand)
│   ├── company-context.tsx             # Legacy wrapper
│   ├── breadcrumb-context.tsx          # Legacy wrapper
│   ├── task-context.tsx                # Legacy wrapper
│   └── ui/                             # Shadcn/Radix components
│       ├── button.tsx
│       ├── input.tsx
│       ├── QTableHierarchical.ui.tsx  # Custom hierarchical table
│       └── ... (~40 components)
│
└── routes/                             # Page layouts
    ├── public.layout.tsx               # Public wrapper
    ├── private.layout.tsx              # Protected wrapper
    ├── home.page.tsx
    ├── learn.page.tsx
    └── 404.page.tsx
```

## UI Components (Shadcn/Radix)

Built on Radix UI primitives with Tailwind styling. Located in `src/lib/ui/`.

**Styling:** Uses Class Variance Authority (CVA) for type-safe variants:
```typescript
const buttonVariants = cva("base-classes", {
  variants: {
    variant: { default: "...", destructive: "...", outline: "..." },
    size: { default: "...", sm: "...", lg: "..." },
  },
});
```

**Custom enhanced components** (prefixed with `Q`):
- `QPassword.ui.tsx` - Password with strength meter
- `QPhone.ui.tsx` - Phone input
- `QDatePicker.ui.tsx` - Date picker
- `QBadge.ui.tsx` - Enhanced badge
- `QTable.ui.tsx` - Data table
- `QTableHierarchical.ui.tsx` - Hierarchical table with expand/collapse, inline editing (Asana-style)
- `QuillEditor.ui.tsx` - Rich text editor

## Important Patterns

### Route Protection

**Do NOT add auth checks in individual page components.** Route protection happens at the layout level in [PrivateLayout](src/routes/private.layout.tsx):

```typescript
// PrivateLayout handles auth redirect
export default function PrivateLayout({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingState />;
  if (!isAuthenticated) {
    navigate("/auth/signin");
    return null;
  }

  return <PrivateLayoutContent>{children}</PrivateLayoutContent>;
}
```

### Adding New Routes

1. Create page component in appropriate module (e.g., `src/modules/auth/signin.page.tsx`)
2. Add to `publicRoutes` or `privateRoutes` array in [App.tsx](src/App.tsx)
3. Add `<Route>` to corresponding `<Switch>` block
4. Ensure path matches route array entry (supports sub-routes with `/`)

### Database Queries

Always include `type` discriminator for efficient filtering:

```typescript
// Query with type filter
const result = await usersDB.find({
  selector: {
    email: email,
    type: "user"  // Discriminator
  },
  limit: 1
});
```

### Error Handling

Use toast notifications for user feedback:

```typescript
try {
  await AuthService.signUp(data);
  toast.success("Account created successfully!");
} catch (error) {
  toast.error(error instanceof Error ? error.message : "An error occurred");
}
```

### User Data Sanitization

**Always sanitize user objects** before returning to frontend:

```typescript
static sanitizeUser(user: User) {
  const { password, verificationCode, resetToken, _rev, ...safe } = user;
  return safe;
}
```

## Critical Configuration

### Environment Variables

Required in `.env` (see [.env.example](.env.example)):
```bash
# CouchDB Configuration
VITE_COUCHDB_URL=http://admin:password@127.0.0.1:5984

# SMTP Configuration (for email services)
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_USER=notify@ysollo.com
SMTP_PASS=your_password
FROM_EMAIL=notify@ysollo.com
FROM_NAME=YSollo

# API Server
API_PORT=3001
VITE_API_URL=http://localhost:3001

# Application URL (for email links)
APP_URL=http://localhost:5173
```

**Note:** Environment variables prefixed with `VITE_` are exposed to the frontend. Backend-only variables (SMTP credentials) are NOT prefixed with `VITE_`.

### CouchDB Setup

**Required steps** (see [docs/COUCHDB_SETUP.md](docs/COUCHDB_SETUP.md)):
1. Install: `brew install couchdb`
2. Start: `brew services start couchdb`
3. Configure CORS: `npx add-cors-to-couchdb http://admin:password@127.0.0.1:5984`
4. Create databases: `users`, `sessions`, and `inquiries`
5. Access Fauxton: http://127.0.0.1:5984/_utils/

## Common Tasks

### Testing Authentication Flow

1. Navigate to `/auth/signup`
2. Fill form and submit
3. **Check browser console** (not terminal) for 6-digit verification code
4. Navigate to `/auth/verify-account` and enter code
5. Sign in at `/auth/signin`
6. Access protected `/dashboard`

### Adding New API Endpoints

Add routes to [src/api/api.hono.ts](src/api/api.hono.ts):
```typescript
// Create route group
const myRoutes = new Hono();

myRoutes.post("/my-endpoint", async (c) => {
  const data = await c.req.json();
  // Handle request
  return c.json({ success: true });
});

// Mount routes
app.route("/api/my-routes", myRoutes);
```

### Adding Validation Schema

Add to module's `*.valibot.ts` file (e.g., [src/modules/auth/auth.valibot.ts](src/modules/auth/auth.valibot.ts)):
```typescript
export const mySchema = v.object({
  field: v.pipe(v.string(), v.minLength(3)),
});
export type MyInput = v.InferOutput<typeof mySchema>;
```

### Debugging Sync Issues

```typescript
// Check sync status in browser console
usersDB.info().then(console.log);
remoteUsersDB.info().then(console.log);

// Monitor sync events
setupSync(); // Logs to console on change/error
```

### Clearing Cache

If encountering build issues:
```bash
rm -rf node_modules/.vite
bun run dev
```

## Known Issues & Limitations

1. **Email delivery** depends on SMTP configuration being correct - if email sending fails, verification codes are logged to console as fallback
2. **Password hashing** uses SHA-256 (upgrade to bcrypt for production)
3. **Session expiration** is 7 days (not configurable)
4. **PouchDB CDN approach** - loaded via CDN in index.html instead of npm package (see [POUCHDB_FIX.md](POUCHDB_FIX.md) for alternative approach)
5. **No 2FA implementation** yet (structure exists in schema, utilities available in [twoFactor.utils.ts](src/modules/auth/account/twoFactor.utils.ts))

## Key Features

### Organizational Chart Module

The OrgChart module provides hierarchical organizational structure management:

**Hierarchy:**
```
OrgChart (level 0)
  ├─ Department (level 1)
  │   ├─ Position (level 2)
  │   │   └─ Appointment (level 3)
  │   └─ Sub-Department (level 2)
  │       └─ Position (level 3)
```

**Document Types:**
- **OrgChart** - Top-level organizational chart with statuses (draft, pending_approval, approved, revoked)
- **Department** - Organizational units with headcount limits and charters
- **Position** - Job positions with salary ranges and job descriptions
- **Appointment** - User assignments to positions (can be vacant)

**Features:**
- Inline editing (Asana-style)
- Cascade delete protection
- Auto-creation of head positions when creating departments
- Status-based permissions
- **PDF Generation**: Department charters, job descriptions, job offers, employment contracts, termination notices

**Files:**
- [src/modules/htr/orgchart/orgchart-service.ts](src/modules/htr/orgchart/orgchart-service.ts)
- [src/modules/htr/orgchart/pdf-generator.service.ts](src/modules/htr/orgchart/pdf-generator.service.ts)
- [src/lib/ui/QTableHierarchical.ui.tsx](src/lib/ui/QTableHierarchical.ui.tsx)

See [docs/ORGCHART.md](docs/ORGCHART.md) for detailed documentation.

### Reference Data

**Pre-loaded reference data:**
- **Countries** - 244 countries with currency, phone codes, timezones
- **Industries** - 170 industries with GICS codes and descriptions

**Usage:**
```typescript
import { countries, industries } from '@/modules/shared/database/reference-data';

const allCountries = await countries.getAll();
const usa = await countries.getByCode('US');
const options = await countries.getOptions(); // For select dropdowns
```

**Import data:**
```bash
bun run import:data
```

See [docs/reference-data-guide.md](docs/reference-data-guide.md) for examples.

## Additional Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Complete architecture guide (PouchDB/Zustand/Hono separation)
- [docs/MULTITENANCY.md](docs/MULTITENANCY.md) - Multi-tenancy architecture and partitioned databases
- [docs/ORGCHART.md](docs/ORGCHART.md) - Organizational chart module documentation
- [docs/COUCHDB_SETUP.md](docs/COUCHDB_SETUP.md) - Complete CouchDB setup guide
- [docs/reference-data-guide.md](docs/reference-data-guide.md) - Working with countries and industries
- [docs/REFACTORING_SUMMARY.md](docs/REFACTORING_SUMMARY.md) - State management migration summary
- [POUCHDB_FIX.md](POUCHDB_FIX.md) - PouchDB integration troubleshooting
- [docs/couchDb.llm.txt](docs/couchDb.llm.txt) - Comprehensive PouchDB/CouchDB reference
- [docs/shadcn.llm.txt](docs/shadcn.llm.txt) - Shadcn/ui components reference
- [README.md](README.md) - Project overview and quick start

## Technology Stack

**Frontend:**
- React 19.1.1 + TypeScript ~5.9.3
- Vite 7.1.7 (build tool)
- Wouter 3.7.1 (routing)
- PouchDB 9.0.0 (local database)
- Zustand 5.0.8 (state management)
- Valibot 1.1.0 (validation)
- React Hook Form 7.65 (forms)
- Tailwind CSS 4.1.15 (styling)
- Shadcn/ui + Radix UI (components)
- Sonner 2.0.7 (toasts)
- jsPDF 3.0.3 + jspdf-autotable 5.0.2 (PDF generation)

**Backend:**
- Hono 4.10.2 (API framework)
- @hono/node-server 1.19.5 (Node.js adapter)
- Nodemailer 7.0.9 (SMTP email)
- CouchDB 3.5+ (remote database & sync, partitioned databases)

**Runtime:**
- Bun (package manager & runtime)

## Best Practices

### When to use PouchDB vs Zustand

**Use PouchDB for:**
✅ User credentials and profiles
✅ Session tokens
✅ Reference data (countries, industries)
✅ Company data (orgcharts, chart of accounts)
✅ Any data that needs offline-first functionality
✅ Data that needs to sync across devices

**Use Zustand for:**
✅ Current user UI representation
✅ Active company selection
✅ Breadcrumb state
✅ Modal open/closed states
✅ Form state (temporary input values)
✅ Any ephemeral UI state

**Use Hono API for:**
✅ Email sending
✅ External API calls
✅ Server-side validation
✅ File uploads (future)
✅ Operations that cannot run in browser

### Database Query Performance

Always include `type` discriminator and use indexes:

```typescript
// ✅ Good - uses index
await usersDB.find({
  selector: {
    email: email,
    type: "user"  // Type discriminator
  },
  limit: 1
});

// ❌ Bad - slow full table scan
await usersDB.allDocs({ include_docs: true });
```

### Multi-tenancy Data Access

Always use CompanyDatabaseFactory for partitioned data:

```typescript
// ✅ Good - uses partitioned queries
import { CompanyDatabaseFactory } from "@/modules/shared/database/company-db-factory";
const orgcharts = await CompanyDatabaseFactory.getOrgCharts();

// ❌ Bad - manual partitioning error-prone
const orgcharts = await orgchartsDB.find({
  selector: { companyId: activeCompanyId }
});
```
