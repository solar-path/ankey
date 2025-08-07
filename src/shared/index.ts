import { z } from 'zod'

// User schemas
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  fullName: z.string().min(1),
  isActive: z.boolean(),
  emailVerified: z.boolean(),
  twoFactorEnabled: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Tenant schemas
export const tenantSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  subdomain: z.string().min(1),
  database: z.string().min(1),
  isActive: z.boolean(),
  billingEmail: z.string().email(),
  userCount: z.number().default(0),
  monthlyRate: z.number().default(25),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// RBAC schemas
export const permissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  resource: z.string(),
  action: z.string(),
  description: z.string().optional(),
})

export const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  tenantId: z.string().optional(), // null for core roles
})

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  twoFactorCode: z.string().optional(),
})

export const registerSchema = z.object({
  workspace: z
    .string()
    .min(3, 'Workspace name must be at least 3 characters')
    .max(30, 'Workspace name must be less than 30 characters')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Only letters, numbers, hyphens and underscores allowed'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
})

export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  roleIds: z.array(z.string()).min(1, 'At least one role is required'),
})

export const letMeInSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  reason: z.string().min(10, 'Please provide a reason for access'),
})

// Audit log schema
export const auditLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tenantId: z.string().optional(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().optional(),
  oldValues: z.record(z.string(), z.any()).optional(),
  newValues: z.record(z.string(), z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.date(),
})

// Infer types
export type User = z.infer<typeof userSchema>
export type Tenant = z.infer<typeof tenantSchema>
export type Permission = z.infer<typeof permissionSchema>
export type Role = z.infer<typeof roleSchema>
export type LoginData = z.infer<typeof loginSchema>
export type RegisterData = z.infer<typeof registerSchema>
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>
export type InviteUserData = z.infer<typeof inviteUserSchema>
export type LetMeInData = z.infer<typeof letMeInSchema>
export type AuditLog = z.infer<typeof auditLogSchema>

// Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Drawer component types (preserving existing)
export type DrawerContent = React.ReactNode

export interface DrawerComponentMetadata {
  defaultTitle?: string
  defaultDescription?: string
}

export interface DrawerState {
  isOpen: boolean
  title: string
  description: string
  content: DrawerContent
  openDrawer: (
    titleOrContent: string | React.ReactElement,
    description?: string,
    content?: React.ReactNode
  ) => void
  closeDrawer: () => void
}

// Hono context types
declare module 'hono' {
  interface ContextVariableMap {
    tenant?: Tenant
    tenantDatabase?: string
    isTenant?: boolean
    user?: User
  }
}

// Component prop types
export interface QPhoneProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

export interface QCalendarPickProps {
  label?: string
  value?: Date
  onChange?: (value: Date) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  fromYear?: number
  toYear?: number
  className?: string
}

export interface DataTableProps<TData, TValue = any> {
  data: TData[]
  columns: any[]
  onDelete?: (rows: TData[]) => void
  onEdit?: (row: TData) => void
  onCreate?: () => void
  onExportPdf?: () => void
  onExportExcel?: () => void
  onImport?: () => void
  onSync?: () => void
  title?: string
  searchColumn?: string
  searchPlaceholder?: string
}
