import { eq, and, count } from 'drizzle-orm'
import { createCoreConnection, createTenantConnection } from './database.settings'
import * as coreSchema from './db/schemas/core.drizzle'
import * as tenantSchema from './db/schemas/tenant.drizzle'

export interface PlanLimits {
  maxUsers: number | null
  maxCompanies: number | null
  currentUsers: number
  currentCompanies: number
  canAddUsers: boolean
  canAddCompanies: boolean
  remainingUsers: number | null
  remainingCompanies: number | null
}

export class PlanLimitsService {
  private coreDb = createCoreConnection()

  /**
   * Get the current plan limits and usage for a tenant
   */
  async getTenantPlanLimits(tenantId: string): Promise<PlanLimits | null> {
    try {
      // Get tenant's current subscription and plan
      const subscriptions = await this.coreDb
        .select({
          subscription: coreSchema.tenantSubscriptions,
          plan: coreSchema.pricingPlans,
          tenant: coreSchema.tenants,
        })
        .from(coreSchema.tenantSubscriptions)
        .innerJoin(
          coreSchema.pricingPlans,
          eq(coreSchema.tenantSubscriptions.planId, coreSchema.pricingPlans.id)
        )
        .innerJoin(
          coreSchema.tenants,
          eq(coreSchema.tenantSubscriptions.tenantId, coreSchema.tenants.id)
        )
        .where(
          and(
            eq(coreSchema.tenantSubscriptions.tenantId, tenantId),
            eq(coreSchema.tenantSubscriptions.status, 'active')
          )
        )
        .limit(1)

      if (subscriptions.length === 0) {
        return null
      }

      const { subscription, plan, tenant } = subscriptions[0]

      if (!plan || !tenant) {
        return null
      }

      // Get current user count from tenant database
      let currentUsers = 0
      let currentCompanies = 0

      if (tenant.database) {
        const tenantDb = createTenantConnection(tenant.database)
        
        // Count users
        const userCount = await tenantDb
          .select({ count: count() })
          .from(tenantSchema.users)
        currentUsers = userCount[0]?.count || 0

        // Count companies (assuming there's a companies table in tenant schema)
        // Note: You'll need to create this table if it doesn't exist
        try {
          const companyCount = await tenantDb
            .select({ count: count() })
            .from(tenantSchema.companies)
          currentCompanies = companyCount[0]?.count || 0
        } catch (error) {
          // Companies table might not exist yet
          console.log('Companies table not found, defaulting to 0')
        }
      }

      const maxUsers = plan.maxUsers
      const maxCompanies = plan.maxCompanies

      return {
        maxUsers,
        maxCompanies,
        currentUsers,
        currentCompanies,
        canAddUsers: maxUsers === null || currentUsers < maxUsers,
        canAddCompanies: maxCompanies === null || currentCompanies < maxCompanies,
        remainingUsers: maxUsers ? maxUsers - currentUsers : null,
        remainingCompanies: maxCompanies ? maxCompanies - currentCompanies : null,
      }
    } catch (error) {
      console.error('Error getting tenant plan limits:', error)
      return null
    }
  }

  /**
   * Check if a tenant can add more users
   */
  async canAddUser(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getTenantPlanLimits(tenantId)
    
    if (!limits) {
      return { 
        allowed: false, 
        reason: 'Unable to verify plan limits. Please contact support.' 
      }
    }

    if (!limits.canAddUsers) {
      return {
        allowed: false,
        reason: `User limit reached. Your plan allows maximum ${limits.maxUsers} users. Current: ${limits.currentUsers}`
      }
    }

    return { allowed: true }
  }

  /**
   * Check if a tenant can add more companies
   */
  async canAddCompany(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
    const limits = await this.getTenantPlanLimits(tenantId)
    
    if (!limits) {
      return { 
        allowed: false, 
        reason: 'Unable to verify plan limits. Please contact support.' 
      }
    }

    if (!limits.canAddCompanies) {
      return {
        allowed: false,
        reason: `Company limit reached. Your plan allows maximum ${limits.maxCompanies} companies. Current: ${limits.currentCompanies}`
      }
    }

    return { allowed: true }
  }

  /**
   * Get usage percentage for dashboard display
   */
  async getUsagePercentages(tenantId: string): Promise<{
    userUsagePercent: number | null
    companyUsagePercent: number | null
  }> {
    const limits = await this.getTenantPlanLimits(tenantId)
    
    if (!limits) {
      return { userUsagePercent: null, companyUsagePercent: null }
    }

    const userUsagePercent = limits.maxUsers 
      ? Math.round((limits.currentUsers / limits.maxUsers) * 100)
      : null

    const companyUsagePercent = limits.maxCompanies
      ? Math.round((limits.currentCompanies / limits.maxCompanies) * 100)
      : null

    return { userUsagePercent, companyUsagePercent }
  }

  /**
   * Validate operation against plan limits
   */
  async validateOperation(
    tenantId: string, 
    operation: 'ADD_USER' | 'ADD_COMPANY'
  ): Promise<{ valid: boolean; error?: string }> {
    switch (operation) {
      case 'ADD_USER': {
        const result = await this.canAddUser(tenantId)
        return { valid: result.allowed, error: result.reason }
      }
      case 'ADD_COMPANY': {
        const result = await this.canAddCompany(tenantId)
        return { valid: result.allowed, error: result.reason }
      }
      default:
        return { valid: false, error: 'Invalid operation' }
    }
  }
}