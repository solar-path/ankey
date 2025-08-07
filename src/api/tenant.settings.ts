import { eq, like, count, and } from 'drizzle-orm';
import { createCoreConnection, createTenantDatabase, runTenantMigrations, seedTenantDatabase } from './database.settings';
import * as coreSchema from './db/schemas/core';
import { hashPassword, generateSecureToken } from './auth.settings';
import { EmailService } from './email.settings';
import { AuditService } from '@/api/audit.settings';
import type { RegisterData, Tenant } from '@/shared';

export class TenantService {
  private db = createCoreConnection();
  private emailService = new EmailService();

  // Slugify workspace name for subdomain
  private slugifyWorkspace(workspace: string): string {
    return workspace
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Check if subdomain is reserved
  private isReservedSubdomain(subdomain: string): boolean {
    const reservedSubdomains = ['shop', 'hunt', 'edu', 'swap', 'www', 'api', 'admin', 'core'];
    return reservedSubdomains.includes(subdomain);
  }

  // Create new tenant workspace
  async createTenant(data: RegisterData, createdBy?: string) {
    try {
      const slug = this.slugifyWorkspace(data.workspace);
      const databaseName = `ankey_${slug}`;

      // Validate subdomain
      if (this.isReservedSubdomain(slug)) {
        return { 
          success: false, 
          error: 'This workspace name is reserved. Please choose another name.' 
        };
      }

      // Check if subdomain already exists
      const existingTenant = await this.db.query.tenants.findFirst({
        where: eq(coreSchema.tenants.subdomain, slug),
      });

      if (existingTenant) {
        return { 
          success: false, 
          error: 'Workspace name already exists. Please choose another name.' 
        };
      }

      // Hash password for tenant owner
      const passwordHash = await hashPassword(data.password);

      // Create tenant database
      const dbCreated = await createTenantDatabase(databaseName);
      if (!dbCreated) {
        // Database might already exist, continue but log
        console.warn(`Database ${databaseName} might already exist`);
      }

      // Run tenant migrations
      await runTenantMigrations(databaseName);

      // Create tenant record in core database
      const tenant = await this.db
        .insert(coreSchema.tenants)
        .values({
          name: data.workspace,
          subdomain: slug,
          database: databaseName,
          billingEmail: data.email,
          isActive: true,
        })
        .returning();

      // Seed tenant database with owner
      const seedResult = await seedTenantDatabase(databaseName, {
        email: data.email,
        fullName: data.fullName,
        passwordHash,
      });

      if (!seedResult.success) {
        // Rollback tenant creation
        await this.db
          .delete(coreSchema.tenants)
          .where(eq(coreSchema.tenants.id, tenant[0].id));
        
        return { 
          success: false, 
          error: 'Failed to set up workspace. Please try again.' 
        };
      }

      // Update user count
      await this.updateUserCount(tenant[0].id);

      // Log tenant creation
      if (createdBy) {
        await AuditService.logCore({
          userId: createdBy,
          action: 'CREATE_TENANT',
          resource: 'tenants',
          resourceId: tenant[0].id,
          newValues: tenant[0],
        });
      }

      // Send welcome email
      const workspaceUrl = `http://${slug}.localhost:3000`;
      await this.emailService.sendWorkspaceWelcome({
        to: data.email,
        workspaceName: data.workspace,
        workspaceUrl,
        ownerName: data.fullName,
      });

      return { 
        success: true, 
        data: { 
          tenant: tenant[0], 
          workspaceUrl,
          ownerId: seedResult.ownerId 
        } 
      };
    } catch (error) {
      console.error('Create tenant error:', error);
      return { success: false, error: 'Failed to create workspace' };
    }
  }

  // Get all tenants with pagination
  async getAllTenants(filters: {
    search?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const conditions = [];
      
      if (filters.search) {
        conditions.push(
          like(coreSchema.tenants.name, `%${filters.search}%`)
        );
      }
      
      if (filters.isActive !== undefined) {
        conditions.push(eq(coreSchema.tenants.isActive, filters.isActive));
      }

      const tenants = await this.db.query.tenants.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
        orderBy: [coreSchema.tenants.createdAt],
      });

      // Get total count
      const totalResult = await this.db
        .select({ count: count() })
        .from(coreSchema.tenants)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return { 
        success: true, 
        data: tenants,
        total: totalResult[0].count,
      };
    } catch (error) {
      console.error('Get tenants error:', error);
      return { success: false, error: 'Failed to get tenants' };
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
      });

      if (!tenant) {
        return { success: false, error: 'Tenant not found' };
      }

      return { success: true, data: tenant };
    } catch (error) {
      console.error('Get tenant by subdomain error:', error);
      return { success: false, error: 'Failed to get tenant' };
    }
  }

  // Get tenant by ID
  async getTenantById(id: string) {
    try {
      const tenant = await this.db.query.tenants.findFirst({
        where: eq(coreSchema.tenants.id, id),
      });

      if (!tenant) {
        return { success: false, error: 'Tenant not found' };
      }

      return { success: true, data: tenant };
    } catch (error) {
      console.error('Get tenant by ID error:', error);
      return { success: false, error: 'Failed to get tenant' };
    }
  }

  // Update tenant
  async updateTenant(
    id: string, 
    data: Partial<Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>>,
    updatedBy: string
  ) {
    try {
      const oldTenant = await this.getTenantById(id);
      if (!oldTenant.success) {
        return oldTenant;
      }

      const updatedTenant = await this.db
        .update(coreSchema.tenants)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(coreSchema.tenants.id, id))
        .returning();

      if (updatedTenant.length === 0) {
        return { success: false, error: 'Tenant not found' };
      }

      // Log tenant update
      await AuditService.logCore({
        userId: updatedBy,
        action: 'UPDATE_TENANT',
        resource: 'tenants',
        resourceId: id,
        oldValues: oldTenant.data,
        newValues: updatedTenant[0],
      });

      return { success: true, data: updatedTenant[0] };
    } catch (error) {
      console.error('Update tenant error:', error);
      return { success: false, error: 'Failed to update tenant' };
    }
  }

  // Deactivate tenant (safe delete)
  async deactivateTenant(id: string, deactivatedBy: string, reason?: string) {
    try {
      const result = await this.updateTenant(id, { isActive: false }, deactivatedBy);
      
      if (result.success) {
        // Log deactivation with reason
        await AuditService.logCore({
          userId: deactivatedBy,
          action: 'DEACTIVATE_TENANT',
          resource: 'tenants',
          resourceId: id,
          newValues: { reason },
        });
      }

      return result;
    } catch (error) {
      console.error('Deactivate tenant error:', error);
      return { success: false, error: 'Failed to deactivate tenant' };
    }
  }

  // Reactivate tenant
  async reactivateTenant(id: string, reactivatedBy: string) {
    try {
      const result = await this.updateTenant(id, { isActive: true }, reactivatedBy);
      
      if (result.success) {
        await AuditService.logCore({
          userId: reactivatedBy,
          action: 'REACTIVATE_TENANT',
          resource: 'tenants',
          resourceId: id,
        });
      }

      return result;
    } catch (error) {
      console.error('Reactivate tenant error:', error);
      return { success: false, error: 'Failed to reactivate tenant' };
    }
  }

  // Update user count for billing
  async updateUserCount(tenantId: string) {
    try {
      const tenant = await this.getTenantById(tenantId);
      if (!tenant.success) {
        return tenant;
      }

      // This would require querying the tenant database to count users
      // For now, we'll implement a placeholder
      const userCount = 1; // TODO: Implement actual user counting

      await this.db
        .update(coreSchema.tenants)
        .set({ 
          userCount, 
          updatedAt: new Date() 
        })
        .where(eq(coreSchema.tenants.id, tenantId));

      return { success: true, userCount };
    } catch (error) {
      console.error('Update user count error:', error);
      return { success: false, error: 'Failed to update user count' };
    }
  }

  // Calculate billing for tenant
  async calculateBilling(tenantId: string, startDate: Date, endDate: Date) {
    try {
      const tenant = await this.getTenantById(tenantId);
      if (!tenant.success) {
        return tenant;
      }

      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const monthlyRate = tenant.data!.monthlyRate ?? 25;
      const userCount = tenant.data!.userCount ?? 0;
      const dailyRate = monthlyRate / 30;
      const totalAmount = dailyRate * days * userCount;

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
      };
    } catch (error) {
      console.error('Calculate billing error:', error);
      return { success: false, error: 'Failed to calculate billing' };
    }
  }

  // Generate billing report for all tenants
  async generateBillingReport(startDate: Date, endDate: Date) {
    try {
      const tenantsResult = await this.getAllTenants({ isActive: true });
      
      if (!tenantsResult.success || !tenantsResult.data) {
        return tenantsResult;
      }

      const billingData = await Promise.all(
        tenantsResult.data.map(async (tenant) => {
          const billing = await this.calculateBilling(tenant.id, startDate, endDate);
          return billing.success ? billing.data : null;
        })
      );

      const validBillingData = billingData.filter((data): data is NonNullable<typeof data> => data !== null);
      const totalRevenue = validBillingData.reduce((sum, data) => sum + (data.totalAmount || 0), 0);
      const totalUsers = validBillingData.reduce((sum, data) => sum + (data.userCount || 0), 0);

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
      };
    } catch (error) {
      console.error('Generate billing report error:', error);
      return { success: false, error: 'Failed to generate billing report' };
    }
  }

  // Create core admin user (run once during setup)
  async createCoreAdmin(data: {
    email: string;
    password: string;
    fullName: string;
  }) {
    try {
      // Check if core admin already exists
      const existingAdmin = await this.db.query.coreUsers.findFirst({
        where: eq(coreSchema.coreUsers.email, data.email),
      });

      if (existingAdmin) {
        return { success: false, error: 'Core admin already exists' };
      }

      const passwordHash = await hashPassword(data.password);

      const admin = await this.db
        .insert(coreSchema.coreUsers)
        .values({
          email: data.email,
          fullName: data.fullName,
          passwordHash,
          emailVerified: true, // Auto-verify for core admin
          isActive: true,
        })
        .returning();

      // Log admin creation
      await AuditService.logCore({
        userId: admin[0].id,
        action: 'CREATE_CORE_ADMIN',
        resource: 'coreUsers',
        resourceId: admin[0].id,
        newValues: { email: data.email, fullName: data.fullName },
      });

      return { success: true, data: admin[0] };
    } catch (error) {
      console.error('Create core admin error:', error);
      return { success: false, error: 'Failed to create core admin' };
    }
  }
}