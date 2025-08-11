import { eq, like, count, and } from 'drizzle-orm'
import {
  createCoreConnection,
  createTenantDatabase,
  runTenantMigrations,
  seedTenantDatabase,
} from './database.settings'
import * as coreSchema from './db/schemas/core.drizzle'
import { hashPassword } from './auth.settings'
import { EmailService } from './email.settings'
import { AuditService } from '@/api/audit.settings'
import type { RegisterData, Tenant } from '@/shared'

export class TenantService {
  private db = createCoreConnection()
  private emailService = new EmailService()

  // Slugify workspace name for subdomain
  private slugifyWorkspace(workspace: string): string {
    return workspace
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Check if subdomain is reserved
  private isReservedSubdomain(subdomain: string): boolean {
    const reservedSubdomains = ['shop', 'hunt', 'edu', 'swap', 'www', 'api', 'admin', 'core']
    return reservedSubdomains.includes(subdomain)
  }

  // Create new tenant workspace
  async createTenant(data: RegisterData, createdBy?: string) {
    let tenantId: string | null = null
    let databaseCreated = false
    
    try {
      const slug = this.slugifyWorkspace(data.workspace)
      const databaseName = slug

      // Validate subdomain
      if (this.isReservedSubdomain(slug)) {
        return {
          success: false,
          error: 'This workspace name is reserved. Please choose another name.',
        }
      }

      // Check if subdomain already exists
      const existingTenant = await this.db.query.tenants.findFirst({
        where: eq(coreSchema.tenants.subdomain, slug),
      })

      if (existingTenant) {
        return {
          success: false,
          error: 'Workspace name already exists. Please choose another name.',
        }
      }

      // Hash password for tenant owner
      const passwordHash = await hashPassword(data.password)

      // Create tenant database first (before creating tenant record)
      const dbCreated = await createTenantDatabase(databaseName)
      if (dbCreated) {
        databaseCreated = true
        console.log(`✅ Created database: ${databaseName}`)
      } else {
        console.warn(`⚠️  Database ${databaseName} might already exist`)
      }

      // Run tenant migrations
      console.log(`🔄 Running migrations for ${databaseName}...`)
      await runTenantMigrations(databaseName)

      // Seed tenant database with owner BEFORE creating tenant record
      // This prevents orphaned tenant records if seeding fails
      console.log(`🌱 Seeding tenant database ${databaseName}...`)
      const seedResult = await seedTenantDatabase(databaseName, {
        email: data.email,
        fullName: data.fullName,
        passwordHash,
      })

      if (!seedResult.success) {
        throw new Error(`Tenant database seeding failed: ${seedResult.error}`)
      }

      // Only create tenant record AFTER successful database setup
      console.log(`📝 Creating tenant record for ${slug}...`)
      const tenant = await this.db
        .insert(coreSchema.tenants)
        .values({
          name: data.workspace,
          subdomain: slug,
          database: databaseName,
          billingEmail: data.email,
          isActive: true,
          userCount: 1, // We know we have 1 user from seeding
        })
        .returning()

      tenantId = tenant[0].id

      // Create trial subscription for the new tenant
      console.log(`💳 Creating trial subscription for ${slug}...`)
      const subscriptionResult = await this.createTrialSubscription(tenant[0].id)
      if (!subscriptionResult.success) {
        console.warn(`⚠️  Failed to create trial subscription: ${subscriptionResult.error}`)
        // Don't fail the entire process, just log it
      }

      // Log tenant creation
      if (createdBy) {
        await AuditService.logCore({
          userId: createdBy,
          action: 'CREATE_TENANT',
          resource: 'tenants',
          resourceId: tenant[0].id,
          newValues: tenant[0],
        })
      }

      // Send welcome email
      const workspaceUrl = `http://${slug}.localhost:3000`
      await this.emailService.sendWorkspaceWelcome({
        to: data.email,
        workspaceName: data.workspace,
        workspaceUrl,
        ownerName: data.fullName,
      })

      return {
        success: true,
        data: {
          tenant: tenant[0],
          workspaceUrl,
          ownerId: seedResult.ownerId,
        },
      }
    } catch (error) {
      console.error('❌ Create tenant error:', error)
      
      // Cleanup on failure
      try {
        // If tenant record was created, remove it
        if (tenantId) {
          console.log(`🧹 Cleaning up tenant record: ${tenantId}`)
          await this.db.delete(coreSchema.tenants).where(eq(coreSchema.tenants.id, tenantId))
        }
        
        // Note: We don't drop the database as it might contain data from previous attempts
        // The database and its tables will remain but can be reused if registration is retried
        
      } catch (cleanupError) {
        console.error('❌ Cleanup error:', cleanupError)
      }

      // Return user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to create workspace'
      if (errorMessage.includes('already exists') || errorMessage.includes('unique')) {
        return { 
          success: false, 
          error: 'Workspace name already exists. Please choose another name.' 
        }
      }
      
      return { 
        success: false, 
        error: 'Failed to create workspace. Please try again.' 
      }
    }
  }

  // Get all tenants with pagination
  async getAllTenants(
    filters: {
      search?: string
      isActive?: boolean
      limit?: number
      offset?: number
    } = {}
  ) {
    try {
      const conditions = []

      if (filters.search) {
        conditions.push(like(coreSchema.tenants.name, `%${filters.search}%`))
      }

      if (filters.isActive !== undefined) {
        conditions.push(eq(coreSchema.tenants.isActive, filters.isActive))
      }

      const tenants = await this.db.query.tenants.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
        orderBy: [coreSchema.tenants.createdAt],
      })

      // Get total count
      const totalResult = await this.db
        .select({ count: count() })
        .from(coreSchema.tenants)
        .where(conditions.length > 0 ? and(...conditions) : undefined)

      return {
        success: true,
        data: tenants,
        total: totalResult[0].count,
      }
    } catch (error) {
      console.error('Get tenants error:', error)
      return { success: false, error: 'Failed to get tenants' }
    }
  }

  // Get tenant by subdomain
  async getTenantBySubdomain(subdomain: string) {
    try {
      const tenant = await this.db.query.tenants.findFirst({
        where: and(
          eq(coreSchema.tenants.subdomain, subdomain),
          eq(coreSchema.tenants.isActive, true)
        ),
      })

      if (!tenant) {
        return { success: false, error: 'Tenant not found' }
      }

      return { success: true, data: tenant }
    } catch (error) {
      console.error('Get tenant by subdomain error:', error)
      return { success: false, error: 'Failed to get tenant' }
    }
  }

  // Get tenant by ID
  async getTenantById(id: string) {
    try {
      const tenant = await this.db.query.tenants.findFirst({
        where: eq(coreSchema.tenants.id, id),
      })

      if (!tenant) {
        return { success: false, error: 'Tenant not found' }
      }

      return { success: true, data: tenant }
    } catch (error) {
      console.error('Get tenant by ID error:', error)
      return { success: false, error: 'Failed to get tenant' }
    }
  }

  // Update tenant
  async updateTenant(
    id: string,
    data: Partial<Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>>,
    updatedBy: string
  ) {
    try {
      const oldTenant = await this.getTenantById(id)
      if (!oldTenant.success) {
        return oldTenant
      }

      const updatedTenant = await this.db
        .update(coreSchema.tenants)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(coreSchema.tenants.id, id))
        .returning()

      if (updatedTenant.length === 0) {
        return { success: false, error: 'Tenant not found' }
      }

      // Log tenant update
      await AuditService.logCore({
        userId: updatedBy,
        action: 'UPDATE_TENANT',
        resource: 'tenants',
        resourceId: id,
        oldValues: oldTenant.data,
        newValues: updatedTenant[0],
      })

      return { success: true, data: updatedTenant[0] }
    } catch (error) {
      console.error('Update tenant error:', error)
      return { success: false, error: 'Failed to update tenant' }
    }
  }

  // Deactivate tenant (safe delete)
  async deactivateTenant(id: string, deactivatedBy: string, reason?: string) {
    try {
      const result = await this.updateTenant(id, { isActive: false }, deactivatedBy)

      if (result.success) {
        // Log deactivation with reason
        await AuditService.logCore({
          userId: deactivatedBy,
          action: 'DEACTIVATE_TENANT',
          resource: 'tenants',
          resourceId: id,
          newValues: { reason },
        })
      }

      return result
    } catch (error) {
      console.error('Deactivate tenant error:', error)
      return { success: false, error: 'Failed to deactivate tenant' }
    }
  }

  // Reactivate tenant
  async reactivateTenant(id: string, reactivatedBy: string) {
    try {
      const result = await this.updateTenant(id, { isActive: true }, reactivatedBy)

      if (result.success) {
        await AuditService.logCore({
          userId: reactivatedBy,
          action: 'REACTIVATE_TENANT',
          resource: 'tenants',
          resourceId: id,
        })
      }

      return result
    } catch (error) {
      console.error('Reactivate tenant error:', error)
      return { success: false, error: 'Failed to reactivate tenant' }
    }
  }

  // Update user count for billing
  async updateUserCount(tenantId: string) {
    try {
      const tenant = await this.getTenantById(tenantId)
      if (!tenant.success) {
        return tenant
      }

      // This would require querying the tenant database to count users
      // For now, we'll implement a placeholder
      const userCount = 1 // TODO: Implement actual user counting

      await this.db
        .update(coreSchema.tenants)
        .set({
          userCount,
          updatedAt: new Date(),
        })
        .where(eq(coreSchema.tenants.id, tenantId))

      return { success: true, userCount }
    } catch (error) {
      console.error('Update user count error:', error)
      return { success: false, error: 'Failed to update user count' }
    }
  }

  // Create trial subscription for new tenant
  async createTrialSubscription(tenantId: string) {
    try {
      // Get the first active plan (or create a default trial plan)
      const plans = await this.db
        .select()
        .from(coreSchema.pricingPlans)
        .where(eq(coreSchema.pricingPlans.isActive, true))
        .orderBy(coreSchema.pricingPlans.displayOrder)
        .limit(1)

      let defaultPlan = plans[0]
      
      // If no plans exist, create a default trial plan
      if (!defaultPlan) {
        const [newPlan] = await this.db
          .insert(coreSchema.pricingPlans)
          .values({
            name: 'Trial Plan',
            description: 'Free trial plan for new workspaces',
            pricePerUserPerMonth: 0,
            minUsers: 1,
            maxUsers: 5,
            features: JSON.stringify(['Core features included', 'Email support', 'Basic integrations']),
            trialDays: 7,
            trialMaxUsers: 5,
            isActive: true,
            displayOrder: 0,
          })
          .returning()
        
        defaultPlan = newPlan
      }

      // Calculate trial end date
      const trialDays = defaultPlan.trialDays || 7
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)

      // Create subscription record
      await this.db
        .insert(coreSchema.tenantSubscriptions)
        .values({
          tenantId,
          planId: defaultPlan.id,
          status: 'trial',
          userCount: 1,
          pricePerUser: defaultPlan.pricePerUserPerMonth,
          totalMonthlyPrice: 0, // Free during trial
          billingCycle: 'monthly',
          trialEndsAt,
          nextBillingDate: trialEndsAt, // Billing starts after trial ends
        })

      return { success: true }
    } catch (error) {
      console.error('Create trial subscription error:', error)
      return { success: false, error: 'Failed to create trial subscription' }
    }
  }

  // Calculate billing for tenant
  async calculateBilling(tenantId: string, startDate: Date, endDate: Date) {
    try {
      const tenant = await this.getTenantById(tenantId)
      if (!tenant.success) {
        return tenant
      }

      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const monthlyRate = tenant.data!.monthlyRate ?? 25
      const userCount = tenant.data!.userCount ?? 0
      const dailyRate = monthlyRate / 30
      const totalAmount = dailyRate * days * userCount

      return {
        success: true,
        data: {
          tenantId,
          tenantName: tenant.data!.name,
          period: { startDate, endDate, days },
          userCount,
          monthlyRate,
          dailyRate: Number(dailyRate.toFixed(2)),
          totalAmount: Number(totalAmount.toFixed(2)),
        },
      }
    } catch (error) {
      console.error('Calculate billing error:', error)
      return { success: false, error: 'Failed to calculate billing' }
    }
  }

  // Generate billing report for all tenants
  async generateBillingReport(startDate: Date, endDate: Date) {
    try {
      const tenantsResult = await this.getAllTenants({ isActive: true })

      if (!tenantsResult.success || !tenantsResult.data) {
        return tenantsResult
      }

      const billingData = await Promise.all(
        tenantsResult.data.map(async tenant => {
          const billing = await this.calculateBilling(tenant.id, startDate, endDate)
          return billing.success ? billing.data : null
        })
      )

      const validBillingData = billingData.filter(
        (data): data is NonNullable<typeof data> => data !== null
      )
      const totalRevenue = validBillingData.reduce(
        (sum, data: any) => sum + (data.totalAmount || 0),
        0
      )
      const totalUsers = validBillingData.reduce((sum, data) => sum + (data.userCount || 0), 0)

      return {
        success: true,
        data: {
          period: { startDate, endDate },
          summary: {
            totalTenants: validBillingData.length,
            totalUsers,
            totalRevenue: Number(totalRevenue.toFixed(2)),
            averageRevenuePerTenant: Number((totalRevenue / validBillingData.length).toFixed(2)),
          },
          tenants: validBillingData,
        },
      }
    } catch (error) {
      console.error('Generate billing report error:', error)
      return { success: false, error: 'Failed to generate billing report' }
    }
  }

  // Get dashboard statistics
  async getDashboardStats() {
    try {
      // Get total tenants count
      const totalTenantsResult = await this.db.select({ count: count() }).from(coreSchema.tenants)

      // Get active tenants count
      const activeTenantsResult = await this.db
        .select({ count: count() })
        .from(coreSchema.tenants)
        .where(eq(coreSchema.tenants.isActive, true))

      // Get total users count (sum of userCount from all active tenants)
      const userCountResult = await this.db
        .select({
          totalUsers: coreSchema.tenants.userCount,
        })
        .from(coreSchema.tenants)
        .where(eq(coreSchema.tenants.isActive, true))

      const totalUsers = userCountResult.reduce((sum, tenant) => sum + (tenant.totalUsers || 0), 0)

      // Calculate monthly revenue (sum of userCount * monthlyRate for active tenants)
      const revenueResult = await this.db
        .select({
          userCount: coreSchema.tenants.userCount,
          monthlyRate: coreSchema.tenants.monthlyRate,
        })
        .from(coreSchema.tenants)
        .where(eq(coreSchema.tenants.isActive, true))

      const monthlyRevenue = revenueResult.reduce((sum, tenant) => {
        return sum + (tenant.userCount || 0) * (tenant.monthlyRate || 25)
      }, 0)

      // Calculate growth percentages (mock for now, would need historical data)
      const userGrowth = '+12%'
      const tenantGrowth = '+5%'
      const revenueGrowth = '+18%'

      return {
        success: true,
        data: {
          totalUsers: {
            value: totalUsers.toString(),
            change: userGrowth,
            trend: 'up' as const,
          },
          activeTenants: {
            value: activeTenantsResult[0].count.toString(),
            change: tenantGrowth,
            trend: 'up' as const,
          },
          monthlyRevenue: {
            value: `$${monthlyRevenue.toLocaleString()}`,
            change: revenueGrowth,
            trend: 'up' as const,
          },
          systemHealth: {
            value: '99.9%',
            change: '+0.1%',
            trend: 'up' as const,
          },
        },
      }
    } catch (error) {
      console.error('Get dashboard stats error:', error)
      return { success: false, error: 'Failed to get dashboard statistics' }
    }
  }

  // Get recent tenants
  async getRecentTenants(limit: number = 5) {
    try {
      const tenants = await this.db.query.tenants.findMany({
        limit,
        orderBy: (tenants, { desc }) => [desc(tenants.createdAt)],
      })

      const recentTenants = tenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        subdomain: `${tenant.subdomain}.ankey.app`,
        userCount: tenant.userCount || 0,
        status: tenant.isActive ? 'Active' : 'Inactive',
        createdAt: tenant.createdAt,
      }))

      return {
        success: true,
        data: recentTenants,
      }
    } catch (error) {
      console.error('Get recent tenants error:', error)
      return { success: false, error: 'Failed to get recent tenants' }
    }
  }

  // Get system activity from audit logs
  async getSystemActivity(limit: number = 10) {
    try {
      const activities = await this.db.query.coreAuditLogs.findMany({
        limit,
        orderBy: (logs, { desc }) => [desc(logs.createdAt)],
        with: {
          user: {
            columns: {
              fullName: true,
              email: true,
            },
          },
        },
      })

      const formattedActivities = activities.map(activity => {
        let actionText = activity.action
        let details = activity.resource

        // Format action text for better readability
        switch (activity.action) {
          case 'CREATE_TENANT':
            actionText = 'New tenant created'
            details = activity.resourceId || 'Unknown tenant'
            break
          case 'UPDATE_TENANT':
            actionText = 'Tenant updated'
            details = activity.resourceId || 'Unknown tenant'
            break
          case 'DEACTIVATE_TENANT':
            actionText = 'Tenant deactivated'
            details = activity.resourceId || 'Unknown tenant'
            break
          case 'CREATE_CORE_ADMIN':
            actionText = 'Admin user created'
            details = activity.user?.email || 'Unknown user'
            break
          default:
            actionText = activity.action.toLowerCase().replace('_', ' ')
            break
        }

        return {
          id: activity.id,
          action: actionText,
          details,
          user: activity.user?.fullName || 'System',
          createdAt: activity.createdAt,
          timeAgo: this.getTimeAgo(activity.createdAt!),
        }
      })

      return {
        success: true,
        data: formattedActivities,
      }
    } catch (error) {
      console.error('Get system activity error:', error)
      return { success: false, error: 'Failed to get system activity' }
    }
  }

  // Helper method to format time ago
  private getTimeAgo(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `${Math.max(1, diffMinutes)} minute${diffMinutes > 1 ? 's' : ''} ago`
    }
  }

  // Create core admin user (run once during setup)
  async createCoreAdmin(data: { email: string; password: string; fullName: string }) {
    try {
      // Check if core admin already exists
      const existingAdmin = await this.db.query.coreUsers.findFirst({
        where: eq(coreSchema.coreUsers.email, data.email),
      })

      if (existingAdmin) {
        return { success: false, error: 'Core admin already exists' }
      }

      const passwordHash = await hashPassword(data.password)

      const admin = await this.db
        .insert(coreSchema.coreUsers)
        .values({
          email: data.email,
          fullName: data.fullName,
          passwordHash,
          emailVerified: true, // Auto-verify for core admin
          isActive: true,
        })
        .returning()

      // Log admin creation
      await AuditService.logCore({
        userId: admin[0].id,
        action: 'CREATE_CORE_ADMIN',
        resource: 'coreUsers',
        resourceId: admin[0].id,
        newValues: { email: data.email, fullName: data.fullName },
      })

      return { success: true, data: admin[0] }
    } catch (error) {
      console.error('Create core admin error:', error)
      return { success: false, error: 'Failed to create core admin' }
    }
  }
}
