# Ankey - Multi-Tenant Business Management Platform

PostgreSQL-centered business management platform with authentication, company management, organizational charts, and delegation of authority (DOA) workflows.

## 🎯 Architecture

This project follows a **PostgreSQL-centered architecture** where all business logic resides in PostgreSQL functions. See **[ARCHITECTURE.md](ARCHITECTURE.md)** for complete architectural principles.

### Core Principles

- ✅ **PostgreSQL as Application Server** - All business logic in SQL functions
- ✅ **Hono as Thin API Gateway** - Transport layer only, no business logic
- ✅ **Thin Client Services** - React/TypeScript services are just API wrappers
- ✅ **Multi-Tenancy** - Row Level Security (RLS) for data isolation
- ✅ **Audit Logging** - SOC/SoX compliance with centralized audit logs

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env and set DATABASE_URL (default: postgresql://localhost:5432/ankey)

# Start PostgreSQL (if using Docker)
docker-compose up -d postgres

# Initialize database
createdb ankey
cd src/api/db
psql -d ankey -f 00-init-all.sql

# Seed reference data (countries & industries)
cd ../..
bun run scripts/seed-reference-data.ts

# Start API server
bun run dev:api

# Start frontend (in another terminal)
bun run dev
```

## 🛠️ Tech Stack

### Backend
- **PostgreSQL** - Application server with business logic
- **Hono** - Lightweight API gateway
- **pg** - PostgreSQL client

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Wouter** - Routing
- **Valibot** - Validation
- **Zustand** - State management
- **Sonner** - Toast notifications

## 📦 Key Features

- ✅ **Authentication** - Signup, signin, 2FA, password reset
- ✅ **Multi-Tenancy** - Company-based data isolation
- ✅ **Organization Charts** - Hierarchical org structure with approvals
- ✅ **DOA (Delegation of Authority)** - Approval matrix management
- ✅ **Task Management** - Manual and approval tasks
- ✅ **Inquiry System** - Contact form with tracking
- ✅ **Audit Logging** - Complete audit trail for SOC/SoX compliance
- ✅ **Soft Delete** - Data recovery with retention policies

## 🗄️ Database Setup

### PostgreSQL Installation

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt install postgresql-16
sudo systemctl start postgresql
```

### Database Initialization

```bash
# Create database
createdb ankey

# Apply all schemas and functions
cd src/api/db
psql -d ankey -f 00-init-all.sql
```

### Database Structure

```
src/api/db/
├── 00-init-all.sql           # Master initialization script
├── README.md                 # Detailed database documentation
│
├── audit.definition.sql      # Audit tables
├── audit.functions.sql       # Audit functions
├── audit.triggers.sql        # Automatic triggers
│
├── auth.definition.sql       # Users, sessions
├── auth.functions.sql        # Authentication functions
│
├── company.definition.sql    # Companies, user-companies
├── company.functions.sql     # Company management
│
├── inquiry.definition.sql    # Contact inquiries
├── inquiry.functions.sql     # Inquiry handling
│
├── orgchart.definition.sql   # Organizational charts
├── orgchart.functions.sql    # Orgchart operations
│
└── reference.definition.sql  # Countries, Industries tables
```

**Seed Reference Data:**
```bash
bun run scripts/seed-reference-data.ts  # 244 countries, 170 industries from JSON
```

See **[src/api/db/README.md](src/api/db/README.md)** for detailed database documentation.

## 🔐 Authentication Flow

1. **Sign Up** → Create account (unverified)
2. **Verify** → Enter 6-digit verification code
3. **Sign In** → Authenticate and create session
4. **Dashboard** → Access protected routes

## 📂 Project Structure

```
src/
├── api/
│   ├── db/                    # PostgreSQL schemas and functions
│   └── routes/                # Hono API routes
│
├── lib/
│   ├── auth-context.tsx       # Auth state management
│   ├── company-context.tsx    # Company context
│   └── ui/                    # UI components (shadcn/ui)
│
├── modules/
│   ├── auth/                  # Authentication
│   ├── company/               # Company management
│   ├── doa/                   # Delegation of Authority
│   ├── inquiry/               # Contact inquiries
│   ├── htr/orgchart/          # Organization charts
│   └── task/                  # Task management
│
└── routes/
    ├── public.layout.tsx      # Public pages layout
    └── private.layout.tsx     # Protected pages layout
```

## 🧪 Development

```bash
# Type checking
bunx tsc --noEmit

# Build
bun run build

# Preview build
bun run preview

# Run tests (if configured)
bun test
```

## 📖 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Complete architectural principles ⭐
- **[src/api/db/README.md](src/api/db/README.md)** - Database documentation
- **[docs/approach.txt](docs/approach.txt)** - Architectural approach
- **[docs/shadcn.llm.txt](docs/shadcn.llm.txt)** - shadcn/ui component guide

## 🎯 Module Structure

Each module follows this structure:

```
src/modules/auth/
├── auth-service.ts          # Thin client service (API wrapper)
├── auth.valibot.ts          # Client-side validation schemas
├── signin.page.tsx          # UI components
└── signup.page.tsx
```

**Business logic is in PostgreSQL:**
```
src/api/db/
├── auth.definition.sql      # Database schema
└── auth.functions.sql       # Business logic functions
```

## 🔒 Security

- ✅ **SECURITY DEFINER** on all PostgreSQL functions
- ✅ **Password hashing** with pgcrypto
- ✅ **Session validation** with expiry
- ✅ **Row Level Security (RLS)** for multi-tenancy
- ✅ **Input sanitization** in PostgreSQL functions
- ✅ **Audit logging** for all data changes

## 📊 Audit & Compliance

Built-in audit logging system for SOC/SoX compliance:

- **Complete audit trail** - All data changes logged
- **Soft delete pattern** - Data recovery with snapshots
- **Session tracking** - Detailed user activity logs
- **Retention policy** - 7-year default (SOX requirement)
- **SOC reports** - Generate compliance reports

```sql
-- Generate SOC2 report
SELECT audit.generate_soc_report(
  'SOC2',
  '2025-01-01'::TIMESTAMP,
  '2025-12-31'::TIMESTAMP,
  'admin@example.com'
);
```

## 🐛 Troubleshooting

### PostgreSQL Connection Issues

1. Check PostgreSQL is running: `pg_isready`
2. Verify connection string in `.env`
3. Check database exists: `psql -l | grep ankey`

### API Server Not Starting

1. Check port 3001 is available
2. Verify DATABASE_URL in `.env`
3. Check PostgreSQL functions are installed

### Frontend Issues

1. Clear Vite cache: `rm -rf node_modules/.vite`
2. Reinstall dependencies: `bun install`
3. Check API_URL in `.env`: `VITE_API_URL=http://localhost:3001`

## 🚀 Deployment

### Environment Variables

Create `.env.production`:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/ankey

# API
API_PORT=3001
VITE_API_URL=https://api.yourdomain.com

# Email (for verification codes)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=YourApp
```

### Build & Deploy

```bash
# Build frontend
bun run build

# Deploy frontend (static files in dist/)
# Deploy API server (src/api/)
# Ensure PostgreSQL is accessible
```

## 📝 Contributing

1. Read **[ARCHITECTURE.md](ARCHITECTURE.md)** thoroughly
2. Follow the established patterns
3. Write business logic in PostgreSQL functions
4. Keep services thin (just API wrappers)
5. Add audit logging for data changes

## 📄 License

[Your License Here]

---

**Need help?** Check [ARCHITECTURE.md](ARCHITECTURE.md) or [src/api/db/README.md](src/api/db/README.md)
