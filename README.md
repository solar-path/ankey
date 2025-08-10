# Ankey - Multi-Tenant Application Platform

A comprehensive multi-tenant SaaS application built with modern technologies, featuring robust authentication, RBAC, audit logging, and SOX compliance.

## 🚀 Features

### Core Features

- **Multi-tenancy**: Tenant-per-database isolation with subdomain routing
- **Authentication**: Lucia-based auth with 2FA support
- **RBAC**: Role-Based Access Control with permissions and delegation
- **Audit Logging**: Complete SOX compliance with audit trails
- **Email Services**: Template-based notifications and invitations
- **Safe Delete**: Soft delete approach for data integrity

### Workspace Management

- **Core Admin**: Centralized tenant management and billing
- **Tenant Isolation**: Each workspace gets its own database
- **User Invitations**: Email-based user onboarding
- **Access Requests**: "Let me in" workflow for user approvals
- **Reserved Subdomains**: shop, hunt, edu, swap for special purposes

## 🏗 Architecture

### Technology Stack

- **Frontend**: React 19 + TanStack Router + Tailwind CSS v4
- **Backend**: Hono.js + Bun runtime
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Lucia + Bun password hashing
- **Email**: Nodemailer with HTML templates
- **Validation**: Zod v4 for runtime validation
- **Icons**: lucide-react mandatory. svg is banned

### Project Structure

```
src/
├── api/                    # Main API routes and middleware
├── components/             # React components
│   ├── auth/              # Authentication forms
│   ├── ui/                # shadcn/ui components
│   └── QDrawer/           # Drawer component with Zustand
├── db/
│   ├── schemas/           # Database schemas (core & tenant)
│   └── connection.ts      # Database connection utilities
├── lib/
│   ├── auth/              # Authentication settings
│   ├── rbac/              # Role-based access control
│   ├── doa/               # Delegation of authority
│   ├── email/             # Email service and templates
│   └── audit/             # Audit logging for SOX compliance
├── routes/
│   ├── core/              # Core admin routes
│   └── tenant/            # Tenant-specific routes
├── services/              # Business logic services
├── types/                 # TypeScript types and Zod schemas
└── shared/                # Shared utilities
```

## 🛠 Setup Instructions

### Prerequisites

- Bun runtime
- PostgreSQL database
- Node.js (for compatibility)

### Installation

1. **Clone and install dependencies**:

   ```bash
   bun install
   ```

2. **Environment Configuration**:

   ```bash
   cp .env.example .env
   # Edit .env with your database and email settings
   ```

3. **Database Setup**:

   ```bash
   # Generate database migrations
   bun run db:generate

   # Push schema to database
   bun run db:push

   # Create core admin user
   bun run setup-core
   ```

4. **Development**:
   ```bash
   bun run dev
   ```

### Default Core Admin

- **Email**: itgroup.luck@gmail.com
- **Password**: Mir@nd@32
- **Access**: http://localhost:3000

## 🌐 Multi-Tenant Architecture

### Core Application (localhost:3000)

- Admin dashboard for managing tenants
- User creation and billing management
- System-wide configuration and monitoring

### Tenant Workspaces (subdomain.localhost:3000)

- Isolated workspace for each tenant
- Independent user management and RBAC
- Custom roles and permissions per workspace
- Audit logging and compliance features

### Reserved Subdomains

- `shop.localhost` - E-commerce platform
- `hunt.localhost` - Head hunting platform
- `edu.localhost` - Education portal
- `swap.localhost` - Document exchange platform

## 👥 User Management

### Core Admin Users

- Manage all tenants and billing
- Create and deactivate workspaces
- Monitor system-wide metrics
- Access compliance reports

### Tenant Users

- **Owner**: Full workspace control (created during setup)
- **Invited Users**: Email-based invitation workflow
- **Access Requesters**: "Let me in" approval process
- **Role-based Access**: Granular permissions system

## 🔐 Security & Compliance

### Authentication Features

- Bun password hashing (industry standard)
- Session-based authentication with secure cookies
- Two-factor authentication support
- Password reset with secure tokens
- Email verification workflow

### RBAC System

- Dynamic permission system based on routes
- Role assignment and management
- Permission delegation (Delegation of Authority)
- Audit trail for all permission changes

### SOX Compliance

- Complete audit logging for all actions
- Safe delete (soft delete) approach
- User action tracking with IP and user agent
- Compliance reporting and data retention
- Change tracking with before/after values

## 📧 Email System

### Template-based Emails

- Welcome emails for new workspaces
- User invitation emails
- Password reset emails
- Access request notifications
- Two-factor authentication codes

### SMTP Configuration

Supports any SMTP provider (Gmail, SendGrid, etc.)

## 🔗 API Endpoints

### Core Admin APIs

```
POST /api/core/auth/login                    # Admin login
POST /api/core/auth/register-workspace       # Create workspace
GET  /api/core/tenants                       # List all tenants
GET  /api/core/tenants/:id/billing           # Billing information
```

### Tenant APIs

```
POST /api/tenant/auth/login                  # Tenant user login
POST /api/tenant/auth/let-me-in              # Access request
GET  /api/tenant/rbac/roles                  # Manage roles
POST /api/tenant/rbac/permissions/sync       # Sync permissions
```

## 💰 Billing Model

- **$25/user/month** standard rate
- Prorated billing based on actual usage
- User count tracking per tenant
- Monthly billing reports
- Automated invoice generation

## 🔧 Development Scripts

```bash
# Development
bun run dev              # Start development server
bun run debug            # Development with verbose logging

# Database
bun run db:generate      # Generate migrations
bun run db:push          # Apply schema changes
bun run db:studio        # Open Drizzle Studio

# Setup
bun run setup-core       # Create core admin user

# Quality
bun run lint             # ESLint checking
bun run build            # Production build
```

## 🎯 Key Implementation Highlights

1. **DRY Principle**: Reusable services and components across the application
2. **Bun Integration**: Native crypto, password hashing, and UUID generation
3. **Type Safety**: End-to-end TypeScript with Zod validation
4. **Modern React**: React 19 with React Hook Form and TanStack Router
5. **Database Design**: Efficient schemas with proper relationships and indexing
6. **Security First**: Industry-standard security practices throughout

## 📝 Additional Notes

- All passwords are hashed using Bun's native Bun implementation
- Email templates are responsive and professionally designed
- Audit logs are stored permanently for compliance requirements
- The system supports horizontal scaling with database-per-tenant architecture
- File uploads and exports can be easily added through the existing structure

## 🤝 Contributing

The codebase follows modern best practices and is ready for team development with proper TypeScript types, comprehensive error handling, and extensive logging.

---

**Built with ❤️ using modern web technologies for enterprise-grade multi-tenant applications.**
