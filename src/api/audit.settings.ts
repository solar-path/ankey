import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { createCoreConnection, createTenantConnection } from '@/api/database.settings';
import * as coreSchema from '@/api/db/schemas/core';
import * as tenantSchema from '@/api/db/schemas/tenant';

export interface AuditLogData {
  userId: string;
  tenantId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export class AuditService {
  // Log action in core database
  static async logCore(data: Omit<AuditLogData, 'tenantId'>) {
    try {
      const db = createCoreConnection();
      
      const auditLog = await db
        .insert(coreSchema.coreAuditLogs)
        .values({
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
          newValues: data.newValues ? JSON.stringify(data.newValues) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        })
        .returning();

      return { success: true, data: auditLog[0] };
    } catch (error) {
      console.error('Core audit log error:', error);
      return { success: false, error: 'Failed to create audit log' };
    }
  }

  // Log action in tenant database
  static async logTenant(tenantDatabase: string, data: AuditLogData) {
    try {
      const db = createTenantConnection(tenantDatabase);
      
      const auditLog = await db
        .insert(tenantSchema.auditLogs)
        .values({
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          oldValues: data.oldValues || null,
          newValues: data.newValues || null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          sessionId: data.sessionId,
        })
        .returning();

      return { success: true, data: auditLog[0] };
    } catch (error) {
      console.error('Tenant audit log error:', error);
      return { success: false, error: 'Failed to create audit log' };
    }
  }

  // Safe delete implementation - mark as deleted instead of actual deletion
  static async safeDelete(
    tenantDatabase: string,
    tableName: string,
    recordId: string,
    userId: string,
    additionalData?: Record<string, any>
  ) {
    try {
      const db = createTenantConnection(tenantDatabase);
      
      // First, get the current record for audit trail
      const currentRecord = await db
        .select()
        .from(tenantSchema[tableName as keyof typeof tenantSchema])
        .where(eq(tenantSchema[tableName as keyof typeof tenantSchema].id, recordId))
        .limit(1);

      if (currentRecord.length === 0) {
        return { success: false, error: 'Record not found' };
      }

      // Mark as deleted (assuming deletedAt field exists)
      const updatedRecord = await db
        .update(tenantSchema[tableName as keyof typeof tenantSchema])
        .set({ 
          deletedAt: new Date(),
          isActive: false,
          ...additionalData 
        })
        .where(eq(tenantSchema[tableName as keyof typeof tenantSchema].id, recordId))
        .returning();

      // Log the safe deletion
      await this.logTenant(tenantDatabase, {
        userId,
        action: 'SAFE_DELETE',
        resource: tableName,
        resourceId: recordId,
        oldValues: currentRecord[0],
        newValues: updatedRecord[0],
      });

      return { success: true, data: updatedRecord[0] };
    } catch (error) {
      console.error('Safe delete error:', error);
      return { success: false, error: 'Failed to perform safe delete' };
    }
  }

  // Track field changes for audit trail
  static trackChanges(oldObject: Record<string, any>, newObject: Record<string, any>) {
    const changes: Record<string, { from: any; to: any }> = {};
    
    // Check for changed fields
    Object.keys(newObject).forEach(key => {
      if (oldObject[key] !== newObject[key]) {
        changes[key] = {
          from: oldObject[key],
          to: newObject[key],
        };
      }
    });

    // Check for removed fields
    Object.keys(oldObject).forEach(key => {
      if (!(key in newObject)) {
        changes[key] = {
          from: oldObject[key],
          to: null,
        };
      }
    });

    return changes;
  }

  // Middleware for automatic audit logging
  static createAuditMiddleware(tenantDatabase?: string) {
    return async (c: any, next: any) => {
      const startTime = Date.now();
      
      // Extract request information
      const method = c.req.method;
      const path = c.req.path;
      const userId = c.get('user')?.id;
      const sessionId = c.get('sessionId');
      const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
      const userAgent = c.req.header('user-agent') || 'unknown';

      // Determine action based on HTTP method
      let action = method.toUpperCase();
      if (method === 'POST') action = 'CREATE';
      else if (method === 'PUT' || method === 'PATCH') action = 'UPDATE';
      else if (method === 'DELETE') action = 'DELETE';
      else if (method === 'GET') action = 'READ';

      // Extract resource from path
      const pathParts = path.split('/').filter(Boolean);
      const resource = pathParts[pathParts.length - 1] || 'unknown';

      try {
        await next();
        
        // Log successful action
        if (userId && c.res.status < 400) {
          const auditData: AuditLogData = {
            userId,
            action,
            resource,
            ipAddress,
            userAgent,
            sessionId,
          };

          if (tenantDatabase) {
            await this.logTenant(tenantDatabase, auditData);
          } else {
            await this.logCore(auditData);
          }
        }
      } catch (error) {
        // Log failed action
        if (userId) {
          const auditData: AuditLogData = {
            userId,
            action: `${action}_FAILED`,
            resource,
            ipAddress,
            userAgent,
            sessionId,
            newValues: { error: error.message },
          };

          if (tenantDatabase) {
            await this.logTenant(tenantDatabase, auditData);
          } else {
            await this.logCore(auditData);
          }
        }
        
        throw error;
      }
    };
  }

  // Get audit logs with filtering
  static async getAuditLogs(
    tenantDatabase: string | null,
    filters: {
      userId?: string;
      resource?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    try {
      const db = tenantDatabase ? createTenantConnection(tenantDatabase) : createCoreConnection();
      const auditTable = tenantDatabase ? tenantSchema.auditLogs : coreSchema.coreAuditLogs;
      
      let query = db.select().from(auditTable);
      
      // Apply filters
      const conditions = [];
      if (filters.userId) conditions.push(eq(auditTable.userId, filters.userId));
      if (filters.resource) conditions.push(eq(auditTable.resource, filters.resource));
      if (filters.action) conditions.push(eq(auditTable.action, filters.action));
      if (filters.startDate) conditions.push(gte(auditTable.createdAt, filters.startDate));
      if (filters.endDate) conditions.push(lte(auditTable.createdAt, filters.endDate));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      query = query.orderBy(desc(auditTable.createdAt));
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters.offset) {
        query = query.offset(filters.offset);
      }
      
      const auditLogs = await query;
      
      return { success: true, data: auditLogs };
    } catch (error) {
      console.error('Get audit logs error:', error);
      return { success: false, error: 'Failed to get audit logs' };
    }
  }

  // Generate audit report for compliance
  static async generateComplianceReport(
    tenantDatabase: string | null,
    startDate: Date,
    endDate: Date
  ) {
    try {
      const auditLogs = await this.getAuditLogs(tenantDatabase, {
        startDate,
        endDate,
      });

      if (!auditLogs.success || !auditLogs.data) {
        return auditLogs;
      }

      const report = {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        summary: {
          totalActions: auditLogs.data.length,
          uniqueUsers: new Set(auditLogs.data.map(log => log.userId)).size,
          actionsByType: auditLogs.data.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          resourcesAccessed: auditLogs.data.reduce((acc, log) => {
            acc[log.resource] = (acc[log.resource] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        },
        criticalActions: auditLogs.data.filter(log => 
          ['DELETE', 'SAFE_DELETE', 'PERMISSION_CHANGE', 'ROLE_CHANGE'].includes(log.action)
        ),
        failedActions: auditLogs.data.filter(log => 
          log.action.endsWith('_FAILED')
        ),
        userActivity: auditLogs.data.reduce((acc, log) => {
          if (!acc[log.userId]) {
            acc[log.userId] = { count: 0, actions: [] };
          }
          acc[log.userId].count++;
          acc[log.userId].actions.push({
            action: log.action,
            resource: log.resource,
            timestamp: log.createdAt,
          });
          return acc;
        }, {} as Record<string, any>),
      };

      return { success: true, data: report };
    } catch (error) {
      console.error('Generate compliance report error:', error);
      return { success: false, error: 'Failed to generate compliance report' };
    }
  }
}