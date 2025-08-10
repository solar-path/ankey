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
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
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

// Settings schemas
export const profileSettingsSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  avatar: z.string().optional(),
})

export const personalSettingsSchema = z.object({
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']).optional(),
  dateOfBirth: z.string().optional(), // ISO date string
  timezone: z.string().optional(),
  language: z.string().default('en'),
})

export const contactSettingsSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z
    .object({
      name: z.string(),
      phone: z.string(),
      relationship: z.string(),
    })
    .optional(),
})

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number'
      ),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export const appearanceSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  density: z.enum(['compact', 'comfortable', 'spacious']).default('comfortable'),
  primaryColor: z.string().default('#000000'),
  fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
  sidebarCollapsed: z.boolean().default(false),
})

// Settings types
export type ProfileSettings = z.infer<typeof profileSettingsSchema>
export type PersonalSettings = z.infer<typeof personalSettingsSchema>
export type ContactSettings = z.infer<typeof contactSettingsSchema>
export type PasswordChange = z.infer<typeof passwordChangeSchema>
export type AppearanceSettings = z.infer<typeof appearanceSettingsSchema>

// Combined user settings type
export const userSettingsSchema = z.object({
  profile: profileSettingsSchema,
  personal: personalSettingsSchema,
  contact: contactSettingsSchema,
  appearance: appearanceSettingsSchema,
})

export type UserSettings = z.infer<typeof userSettingsSchema>

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

export interface DataTableProps<TData> {
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

// Product types
export interface Product {
  id: string
  title: string
  description: string | null
  price: string
  isActive: string
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ProductCreateInput {
  title: string
  description: string | null
  price: string
  isActive: string
}

export interface ProductUpdateInput {
  title?: string
  description?: string | null
  price?: string
  isActive?: string
}

export interface ProductResponse {
  success: boolean
  data?: Product
  error?: string
}

export interface ProductsResponse {
  success: boolean
  data?: {
    items: Product[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    view: 'active' | 'trashed' | 'all'
  }
  error?: string
}

export interface ProductBulkActionRequest {
  ids: string[]
  action: 'delete' | 'restore' | 'force-delete'
}

export interface ProductBulkActionResponse {
  success: boolean
  message: string
  count?: number
}

// ===== CORE ROUTES TYPE DEFINITIONS =====

// Export types
export const exportRequestSchema = z.object({
  title: z.string(),
  format: z.enum(['pdf', 'xlsx', 'csv']),
  columns: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      width: z.number().optional(),
    })
  ),
  data: z.array(z.record(z.string(), z.any())),
  metadata: z
    .object({
      exportedBy: z.string().optional(),
      company: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
})

export type ExportRequest = z.infer<typeof exportRequestSchema>

export interface ExportColumn {
  key: string
  label: string
  width?: number
}

export interface ExportTemplate {
  columns: ExportColumn[]
}

export interface ExportTemplateResponse {
  success?: boolean
  error?: string
  columns?: ExportColumn[]
}

// Import types
export const importConfigSchema = z.object({
  columns: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      required: z.boolean().optional(),
      type: z.enum(['string', 'number', 'date', 'boolean']).optional(),
    })
  ),
  options: z
    .object({
      delimiter: z.string().optional(),
      skipFirstRow: z.boolean().optional(),
      syncMode: z.enum(['create-only', 'update-only', 'create-update']).optional(),
      keyColumn: z.string().optional(),
    })
    .optional(),
})

export const importSyncSchema = z.object({
  importedData: z.array(z.record(z.string(), z.any())),
  existingData: z.array(z.record(z.string(), z.any())),
  keyColumn: z.string(),
  syncMode: z.enum(['create-only', 'update-only', 'create-update']).optional(),
})

export type ImportConfig = z.infer<typeof importConfigSchema>
export type ImportSync = z.infer<typeof importSyncSchema>

export interface ImportColumn {
  key: string
  label: string
  required?: boolean
  type?: 'string' | 'number' | 'date' | 'boolean'
}

export interface ImportTemplate {
  columns: ImportColumn[]
  sampleData?: any[]
}

export interface ImportParseResponse {
  success: boolean
  result?: {
    data: any[]
    errors: string[]
    totalRows: number
    validRows: number
  }
  fileInfo?: {
    name: string
    size: number
    type: string
  }
  error?: string
}

export interface ImportSyncResponse {
  success: boolean
  syncResult?: {
    toCreate: any[]
    toUpdate: any[]
    unchanged: any[]
  }
  summary?: {
    totalImported: number
    toCreate: number
    toUpdate: number
    unchanged: number
  }
  error?: string
}

// Inquiry types
export const inquirySubmitSchema = z.object({
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  attachments: z.array(z.string()).optional(),
})

export const findInquirySchema = z.object({
  id: z.string().min(1, 'Inquiry ID is required'),
})

export const inquiryStatusUpdateSchema = z.object({
  status: z.enum(['open', 'in-progress', 'resolved', 'closed']),
  response: z.string().optional(),
})

export type InquirySubmit = z.infer<typeof inquirySubmitSchema>
export type FindInquiry = z.infer<typeof findInquirySchema>
export type InquiryStatusUpdate = z.infer<typeof inquiryStatusUpdateSchema>

export interface Inquiry {
  id: string
  email: string
  message: string
  attachments?: string[]
  status: 'open' | 'in-progress' | 'resolved' | 'closed' | 'submitted'
  response?: string
  submittedAt: Date
  updatedAt?: Date
}

export interface InquiryResponse {
  success: boolean
  data?: {
    inquiryId?: string
    inquiry?: Inquiry
    message?: string
  }
  error?: string
}

export interface InquiryListResponse {
  success: boolean
  data?: Inquiry[]
  error?: string
}

// Pricing types
export interface PricingPlan {
  id: string
  name: string
  description?: string
  basePrice: number
  billingCycle: 'monthly' | 'yearly'
  features: string[]
  isActive: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface PricingDiscount {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  maxUses?: number
  usedCount: number
  expiresAt?: Date
  isActive: boolean
  createdAt: Date
}

export interface TenantSubscription {
  id: string
  tenantId: string
  planId: string
  status: 'active' | 'cancelled' | 'expired' | 'trial'
  startDate: Date
  endDate?: Date
  lastBillingDate?: Date
  nextBillingDate?: Date
  monthlyRate: number
  createdAt: Date
  updatedAt: Date
}

export interface PricingPlansResponse {
  success?: boolean
  plans?: PricingPlan[]
  error?: string
}

export interface PricingDiscountsResponse {
  success?: boolean
  discounts?: PricingDiscount[]
  error?: string
}

export interface SubscriptionsResponse {
  success?: boolean
  subscriptions?: TenantSubscription[]
  error?: string
}

// Tenant management types
export const updateTenantSchema = z.object({
  name: z.string().optional(),
  isActive: z.boolean().optional(),
  billingEmail: z.string().email().optional(),
  monthlyRate: z.number().min(0).optional(),
})

export const deactivateTenantSchema = z.object({
  reason: z.string().optional(),
})

export const billingQuerySchema = z.object({
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
})

export type UpdateTenant = z.infer<typeof updateTenantSchema>
export type DeactivateTenant = z.infer<typeof deactivateTenantSchema>
export type BillingQuery = z.infer<typeof billingQuerySchema>

export interface TenantFilters {
  search?: string
  isActive?: boolean
  limit?: number
  offset?: number
}

export interface TenantListResponse {
  success: boolean
  data?: {
    tenants: Tenant[]
    total?: number
    pagination?: {
      page: number
      limit: number
      total: number
    }
  }
  error?: string
}

export interface TenantBillingResponse {
  success: boolean
  data?: {
    tenantId: string
    billingPeriod: {
      startDate: Date
      endDate: Date
    }
    usage: {
      userCount: number
      storageUsed: number
      apiCalls: number
    }
    charges: {
      baseRate: number
      overages: number
      total: number
    }
  }
  error?: string
}

export interface DashboardStats {
  success: boolean
  data?: {
    totalTenants: number
    activeTenants: number
    totalUsers: number
    totalRevenue: number
    recentActivity: any[]
  }
  error?: string
}

// ===== TENANT ROUTES TYPE DEFINITIONS =====

// RBAC types
export const createPermissionSchema = z.object({
  name: z.string().min(1),
  resource: z.string().min(1),
  action: z.string().min(1),
  description: z.string().optional(),
})

export const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export const assignPermissionsSchema = z.object({
  permissionIds: z.array(z.string()),
})

export const assignRolesSchema = z.object({
  roleIds: z.array(z.string()),
})

export type CreatePermission = z.infer<typeof createPermissionSchema>
export type CreateRole = z.infer<typeof createRoleSchema>
export type AssignPermissions = z.infer<typeof assignPermissionsSchema>
export type AssignRoles = z.infer<typeof assignRolesSchema>

export interface PermissionResponse {
  success: boolean
  data?: Permission
  error?: string
}

export interface PermissionsResponse {
  success: boolean
  data?: Permission[]
  error?: string
}

export interface RoleResponse {
  success: boolean
  data?: Role
  error?: string
}

export interface RolesResponse {
  success: boolean
  data?: Role[]
  error?: string
}

export interface UserRolesResponse {
  success: boolean
  data?: {
    userId: string
    roles: Role[]
  }
  error?: string
}

export interface UserPermissionsResponse {
  success: boolean
  data?: {
    userId: string
    permissions: Permission[]
  }
  error?: string
}

export interface PermissionSyncRoute {
  resource: string
  action: string
  description: string
}

export interface PermissionSyncResponse {
  success: boolean
  data?: {
    created: number
    updated: number
    total: number
  }
  message?: string
  error?: string
}

// Product query types (to complement existing Product types)
export const productQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  view: z.enum(['active', 'trashed', 'all']).default('active'),
})

export const productCreateSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  price: z.string(),
  isActive: z.string(),
})

export const productUpdateSchema = productCreateSchema.partial()

export type ProductQuery = z.infer<typeof productQuerySchema>
export type ProductCreate = z.infer<typeof productCreateSchema>
export type ProductUpdate = z.infer<typeof productUpdateSchema>

// Tenant Settings types
export interface TenantSettingsResponse {
  success: boolean
  data?: {
    profile?: ProfileSettings
    personal?: PersonalSettings
    contact?: ContactSettings
    appearance?: AppearanceSettings
  }
  error?: string
}

// Core Auth types (additional to existing login/register schemas)
export interface CoreAuthResponse {
  success: boolean
  data?: {
    user?: User
    sessionCookie?: string
    requiresTwoFactor?: boolean
  }
  message?: string
  error?: string
}

// Tenant Auth types
export interface TenantAuthResponse {
  success: boolean
  data?: {
    user?: User
    sessionCookie?: string
    requiresTwoFactor?: boolean
  }
  message?: string
  error?: string
}

export interface SessionValidationResponse {
  success: boolean
  data?: {
    user: User
    session: {
      id: string
      expiresAt: Date
    }
  }
  error?: string
}

// Pricing schemas for POST/PUT requests
export const createPricingPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  basePrice: z.number().min(0),
  billingCycle: z.enum(['monthly', 'yearly']),
  features: z.array(z.string()),
  displayOrder: z.number().default(0),
  isActive: z.boolean().default(true),
})

export const updatePricingPlanSchema = createPricingPlanSchema.partial()

export const createDiscountSchema = z.object({
  code: z.string().min(1),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0),
  maxUses: z.number().optional(),
  expiresAt: z.date().optional(),
  isActive: z.boolean().default(true),
})

export const updateDiscountSchema = createDiscountSchema.partial()

export const createSubscriptionSchema = z.object({
  tenantId: z.string(),
  planId: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
  monthlyRate: z.number().min(0),
})

export const updateSubscriptionSchema = createSubscriptionSchema.partial()

export const billingCalculationSchema = z.object({
  tenantId: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  userCount: z.number().min(0),
})

export type CreatePricingPlan = z.infer<typeof createPricingPlanSchema>
export type UpdatePricingPlan = z.infer<typeof updatePricingPlanSchema>
export type CreateDiscount = z.infer<typeof createDiscountSchema>
export type UpdateDiscount = z.infer<typeof updateDiscountSchema>
export type CreateSubscription = z.infer<typeof createSubscriptionSchema>
export type UpdateSubscription = z.infer<typeof updateSubscriptionSchema>
export type BillingCalculation = z.infer<typeof billingCalculationSchema>

// ===== AUDIT AND COMPLIANCE TYPE DEFINITIONS =====

export interface AuditLogFilter {
  userId?: string
  resource?: string
  action?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export interface AuditLogsResponse {
  success: boolean
  data?: any[]
  error?: string
}

export interface ComplianceReport {
  period: {
    start: string
    end: string
  }
  summary: {
    totalActions: number
    uniqueUsers: number
    actionsByType: Record<string, number>
    resourcesAccessed: Record<string, number>
  }
  criticalActions: any[]
  failedActions: any[]
  userActivity: Record<
    string,
    {
      count: number
      actions: Array<{
        action: string
        resource: string
        timestamp: Date
      }>
    }
  >
}

export interface ComplianceReportResponse {
  success: boolean
  data?: ComplianceReport
  error?: string
}

// ===== DATABASE TYPE DEFINITIONS =====

export interface TenantOwnerData {
  email: string
  fullName: string
  passwordHash: string
}

export interface SeedResult {
  success: boolean
  ownerId?: string
  error?: any
}

export interface DatabaseConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
  max?: number
  idleTimeout?: number
  connectTimeout?: number
}

// ===== EMAIL SERVICE TYPE DEFINITIONS =====

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  message?: string
}

export interface WorkspaceWelcomeData {
  to: string
  workspaceName: string
  workspaceUrl: string
  ownerName: string
}

export interface UserInvitationData {
  to: string
  fullName: string
  workspaceName: string
  workspaceUrl: string
  inviterName: string
  inviteToken: string
}

export interface PasswordResetData {
  to: string
  fullName: string
  resetUrl: string
  isCore?: boolean
}

export interface EmailVerificationData {
  to: string
  fullName: string
  verificationUrl: string
}

export interface TwoFactorCodeData {
  to: string
  fullName: string
  code: string
}

export interface AccessRequestNotificationData {
  to: string // Admin email
  requesterName: string
  requesterEmail: string
  workspaceName: string
  reason: string
  approvalUrl: string
}
