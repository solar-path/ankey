import { requireTenantAuth } from '@/api/middleware'
import { PlanLimitsService } from '@/api/plan-limits.service'
import { Hono } from 'hono'

export const tenantUsageRoutes = new Hono()
  .use('*', requireTenantAuth)

  // Get complete usage information for the tenant
  .get('/', async c => {
    try {
      const tenant = c.get('tenant')
      const limitsService = new PlanLimitsService()
      
      const limits = await limitsService.getTenantPlanLimits(tenant.id)
      
      if (!limits) {
        return c.json({ 
          success: false, 
          error: 'Unable to fetch plan limits' 
        }, 500)
      }

      const percentages = await limitsService.getUsagePercentages(tenant.id)

      return c.json({ 
        success: true, 
        data: {
          users: {
            current: limits.currentUsers,
            max: limits.maxUsers,
            remaining: limits.remainingUsers,
            canAdd: limits.canAddUsers,
            usagePercent: percentages.userUsagePercent,
          },
          companies: {
            current: limits.currentCompanies,
            max: limits.maxCompanies,
            remaining: limits.remainingCompanies,
            canAdd: limits.canAddCompanies,
            usagePercent: percentages.companyUsagePercent,
          },
          summary: {
            planName: tenant.name, // You might want to fetch actual plan name
            status: 'active', // You might want to fetch actual status
          }
        }
      })
    } catch (error) {
      console.error('Error fetching usage:', error)
      return c.json({ success: false, error: 'Failed to fetch usage information' }, 500)
    }
  })

  // Check if a specific operation is allowed
  .post('/validate', async c => {
    try {
      const tenant = c.get('tenant')
      const body = await c.req.json()
      const { operation } = body as { operation: 'ADD_USER' | 'ADD_COMPANY' }
      
      if (!operation || !['ADD_USER', 'ADD_COMPANY'].includes(operation)) {
        return c.json({ 
          success: false, 
          error: 'Invalid operation. Must be ADD_USER or ADD_COMPANY' 
        }, 400)
      }

      const limitsService = new PlanLimitsService()
      const result = await limitsService.validateOperation(tenant.id, operation)

      return c.json({ 
        success: result.valid, 
        allowed: result.valid,
        reason: result.error 
      })
    } catch (error) {
      console.error('Error validating operation:', error)
      return c.json({ success: false, error: 'Failed to validate operation' }, 500)
    }
  })