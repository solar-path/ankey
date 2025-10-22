# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ankey** is a local-first authentication system built with React, TypeScript, and PouchDB/CouchDB. It features real-time bi-directional sync between local (IndexedDB) and remote (CouchDB) databases.

## Development Commands

```bash
# Start development server (auto-kills port 5173)
bun run dev

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

### Routing System (Wouter-based)

The app uses a **two-layout system** where routes are determined at the `App.tsx` level:

- **Public routes** (`/`, `/learn`, `/offers`, `/contact`, `/auth/*`) render in `PublicLayout`
- **Private routes** (`/dashboard`) render in `PrivateLayout` with auth protection
- Route matching is **exact** - `/auth/signin` matches but `/auth/signin123` does not (shows 404)

**Important:** Do NOT use `startsWith()` for route matching as it creates false positives. The current implementation checks exact matches and query params only (`route === location || location.startsWith(route + "?")`).

### Database Architecture (PouchDB + CouchDB)

**Current Setup:** PouchDB loaded via CDN in `index.html`:
```html
<script src="https://cdn.jsdelivr.net/npm/pouchdb@9.0.0/dist/pouchdb.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/pouchdb@9.0.0/dist/pouchdb.find.min.js"></script>
```

**Pattern:**
```typescript
// db.ts accesses global PouchDB
const PouchDB = window.PouchDB;
const COUCHDB_URL = import.meta.env.VITE_COUCHDB_URL || "http://127.0.0.1:5984";

// Local databases (browser IndexedDB)
export const usersDB = new PouchDB("users");
export const sessionsDB = new PouchDB("sessions");

// Remote databases (CouchDB sync targets)
export const remoteUsersDB = new PouchDB(`${COUCHDB_URL}/users`);
export const remoteSessionsDB = new PouchDB(`${COUCHDB_URL}/sessions`);
```

**Sync:** Real-time bi-directional sync configured with `{ live: true, retry: true }` in `setupSync()`.

**Document Types:** All documents have a `type` field discriminator (`"user"` or `"session"`) for efficient querying in multi-type databases.

### Authentication Flow

1. **Sign Up** → `AuthService.signUp()` → Creates user with `verified: false` + 6-digit code
2. **Verify** → `AuthService.verifyAccount(code)` → Sets `verified: true`
3. **Sign In** → `AuthService.signIn()` → Validates credentials, creates session
4. **Session** → Token stored in `localStorage.sessionToken`, expires in 7 days
5. **Sign Out** → `AuthService.signOut()` → Removes session from DB and localStorage

**Password hashing:** Currently SHA-256 (simple). For production, use bcrypt.

**Session restoration:** `AuthProvider` checks `localStorage` on mount and validates session via `verifySession()`.

### State Management (Context Providers)

Four context providers wrap the app in `App.tsx`:

1. **AuthProvider** - User authentication state (`useAuth()`)
2. **CompanyProvider** - Multi-tenancy/active company (`useCompany()`)
3. **BreadcrumbProvider** - Navigation breadcrumbs (`useBreadcrumb()`)
4. **TaskProvider** - Task management (`useTask()`)

**Pattern:** Always throw error if context used outside provider:
```typescript
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
```

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
- **Services:** `*-service.ts` (e.g., `auth-service.ts`)
- **Contexts:** `*-context.tsx` (e.g., `auth-context.tsx`)
- **Schemas:** `*.valibot.ts` (centralized validation)
- **Custom UI:** `Q*.ui.tsx` (enhanced components like `QPassword.ui.tsx`)

### Directory Structure

```
src/
├── lib/
│   ├── db.ts                    # Database setup, types, sync
│   ├── auth-service.ts          # Auth business logic
│   ├── auth-context.tsx         # Auth state provider
│   ├── company-context.tsx      # Multi-tenancy state
│   ├── breadcrumb-context.tsx   # Navigation state
│   ├── task-context.tsx         # Task state
│   └── ui/                      # Shadcn/Radix components (~40 files)
├── modules/
│   ├── auth/
│   │   ├── auth.valibot.ts      # All auth validation schemas
│   │   ├── signin.page.tsx
│   │   ├── signup.page.tsx
│   │   ├── verifyAccount.page.tsx
│   │   └── forgotPassword.page.tsx
│   └── company/
│       └── companyDashboard.page.tsx
└── routes/
    ├── public.layout.tsx        # Public wrapper (header/footer)
    ├── private.layout.tsx       # Protected wrapper (sidebar/breadcrumbs)
    ├── home.page.tsx
    ├── learn.page.tsx
    ├── offers.page.tsx
    ├── contact.page.tsx
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

**Custom components** (prefixed with `Q`):
- `QPassword.ui.tsx` - Password with strength meter
- `QPhone.ui.tsx` - Phone input
- `QDatePicker.ui.tsx` - Date picker
- `QBadge.ui.tsx` - Enhanced badge
- `QTable.ui.tsx` - Data table
- `QuillEditor.ui.tsx` - Rich text editor

## Important Patterns

### Route Protection

**Do NOT add auth checks in individual page components.** Route protection happens at the layout level:

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

1. Create page component in appropriate module
2. Add to `publicRoutes` or `privateRoutes` array in `App.tsx`
3. Add `<Route>` to corresponding `<Switch>` block
4. Ensure exact path match (no trailing slashes)

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

Required in `.env` (see `.env.example`):
```bash
# CouchDB Configuration
VITE_COUCHDB_URL=http://admin:password@127.0.0.1:5984

# SMTP Configuration (for email verification)
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_USER=notify@ysollo.com
SMTP_PASS=your_password
FROM_EMAIL=notify@ysollo.com
FROM_NAME=YSollo

# Application URL
APP_URL=http://localhost:5173
```

### Vite Configuration

Current config is **minimal**. For production, consider recommendations in `POUCHDB_FIX.md`:
- Add `mainFields: ['module', 'jsnext:main', 'jsnext']`
- Include `optimizeDeps: { include: ["pouchdb", "pouchdb-find"] }`
- Configure `build.commonjsOptions` with `transformMixedEsModules: true`

### CouchDB Setup

**Required steps** (see `docs/COUCHDB_SETUP.md`):
1. Install: `brew install couchdb`
2. Start: `brew services start couchdb`
3. Configure CORS: `add-cors-to-couchdb http://admin:password@127.0.0.1:5984`
4. Create databases: `users` and `sessions`
5. Access Fauxton: http://127.0.0.1:5984/_utils/

## Common Tasks

### Testing Authentication Flow

1. Navigate to `/auth/signup`
2. Fill form and submit
3. **Check browser console** (not terminal) for 6-digit verification code
4. Navigate to `/auth/verify-account` and enter code
5. Sign in at `/auth/signin`
6. Access protected `/dashboard`

### Adding Validation Schema

Add to `src/modules/auth/auth.valibot.ts`:
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

1. **Email verification codes** are logged to console, not sent via email (email service not implemented)
2. **Password hashing** uses SHA-256 (upgrade to bcrypt for production)
3. **Session expiration** is 7 days (not configurable)
4. **PouchDB CDN approach** may have stability issues - consider npm package per `POUCHDB_FIX.md`
5. **No 2FA implementation** yet (structure exists in schema)

## Additional Documentation

- **POUCHDB_FIX.md** - PouchDB integration troubleshooting
- **docs/COUCHDB_SETUP.md** - Complete CouchDB setup guide
- **docs/couchDb.llm.txt** - Comprehensive PouchDB/CouchDB reference
- **README.md** - Project overview and quick start

## Technology Stack

- **React 19.1.1** + **TypeScript ~5.9.3**
- **Vite 7.1.7** (build tool)
- **Wouter 3.7.1** (routing)
- **PouchDB 9.0.0** + **CouchDB** (database & sync)
- **Valibot 1.1.0** (validation)
- **React Hook Form 7.65** (forms)
- **Tailwind CSS 4.1.15** (styling)
- **Shadcn/ui + Radix UI** (components)
- **Sonner 2.0.7** (toasts)
- **Bun** (package manager & runtime)
