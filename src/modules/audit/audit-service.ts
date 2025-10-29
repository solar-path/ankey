/**
 * Audit Service
 * Thin client service for audit logging API calls
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Audit log entry interface
 */
export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  table_name: string;
  record_id: string;
  company_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  notes: string | null;
  created_at: string;
}

/**
 * Active session interface
 */
export interface ActiveSession {
  id: string;
  user_id: string;
  user_email: string;
  login_at: string;
  login_ip: string | null;
  last_activity_at: string | null;
  actions_count: number;
  is_suspicious: boolean;
  suspicious_reason: string | null;
}

/**
 * Soft-deleted record interface
 */
export interface SoftDeletedRecord {
  id: string;
  table_name: string;
  record_id: string;
  deleted_by: string;
  deleted_at: string;
  data_snapshot: Record<string, any>;
  company_id: string | null;
  restored: boolean;
  restored_by: string | null;
  restored_at: string | null;
  permanent_delete_at: string | null;
}

export class AuditService {
  /**
   * Get audit trail for a specific record
   *
   * @param table - Table name (e.g., 'companies', 'users', 'inquiries')
   * @param recordId - Record ID
   * @returns Array of audit logs for this record
   */
  static async getAuditTrail(
    table: string,
    recordId: string
  ): Promise<AuditLog[]> {
    const response = await fetch(
      `${API_URL}/api/audit/trail/${table}/${recordId}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch audit trail");
    }

    return response.json();
  }

  /**
   * Get user activity for a time period
   *
   * @param userId - User ID
   * @param from - Start date (optional, defaults to 30 days ago)
   * @param to - End date (optional, defaults to now)
   * @returns User activity statistics
   */
  static async getUserActivity(
    userId: string,
    from?: Date,
    to?: Date
  ): Promise<any> {
    const params = new URLSearchParams();
    if (from) params.set("from", from.toISOString());
    if (to) params.set("to", to.toISOString());

    const response = await fetch(
      `${API_URL}/api/audit/user/${userId}/activity?${params}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch user activity");
    }

    return response.json();
  }

  /**
   * Generate SOC/SoX compliance report
   *
   * @param reportType - Report type (e.g., 'SOC2', 'SOX')
   * @param periodStart - Start date
   * @param periodEnd - End date
   * @param generatedBy - User ID of person generating report
   * @returns Report data
   */
  static async generateReport(
    reportType: string,
    periodStart: Date,
    periodEnd: Date,
    generatedBy: string
  ): Promise<any> {
    const response = await fetch(`${API_URL}/api/audit/report/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        reportType,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        generatedBy,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate report");
    }

    return response.json();
  }

  /**
   * Get all active sessions
   *
   * @returns Array of active sessions
   */
  static async getActiveSessions(): Promise<ActiveSession[]> {
    const response = await fetch(`${API_URL}/api/audit/sessions/active`, {
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch active sessions");
    }

    return response.json();
  }

  /**
   * Get suspicious sessions
   *
   * @returns Array of suspicious sessions
   */
  static async getSuspiciousSessions(): Promise<ActiveSession[]> {
    const response = await fetch(`${API_URL}/api/audit/sessions/suspicious`, {
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch suspicious sessions");
    }

    return response.json();
  }

  /**
   * Get recent audit logs
   *
   * @param limit - Number of logs to return (default: 100)
   * @param action - Filter by action type (optional)
   * @param table - Filter by table name (optional)
   * @returns Array of audit logs
   */
  static async getRecentLogs(
    limit: number = 100,
    action?: string,
    table?: string
  ): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    params.set("limit", limit.toString());
    if (action) params.set("action", action);
    if (table) params.set("table", table);

    const response = await fetch(
      `${API_URL}/api/audit/logs/recent?${params}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch recent logs");
    }

    return response.json();
  }

  /**
   * Get soft-deleted records
   *
   * @param table - Filter by table name (optional)
   * @returns Array of soft-deleted records
   */
  static async getSoftDeletes(table?: string): Promise<SoftDeletedRecord[]> {
    const params = new URLSearchParams();
    if (table) params.set("table", table);

    const response = await fetch(
      `${API_URL}/api/audit/soft-deletes?${params}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch soft deletes");
    }

    return response.json();
  }

  /**
   * Restore a soft-deleted record
   *
   * @param table - Table name
   * @param recordId - Record ID
   * @param restoredBy - User ID of person restoring
   * @returns Restore result
   */
  static async restoreSoftDelete(
    table: string,
    recordId: string,
    restoredBy: string
  ): Promise<any> {
    const response = await fetch(
      `${API_URL}/api/audit/restore/${table}/${recordId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ restoredBy }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to restore record");
    }

    return response.json();
  }
}
