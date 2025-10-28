/**
 * OrgChart Approval Service - Thin Client Layer
 *
 * Handles approval workflow for organizational charts
 */

import type { ApprovalTask, ApprovalWorkflow } from "@/modules/shared/types/database.types";

// Re-export types for backward compatibility
export type { ApprovalTask, ApprovalWorkflow };

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Helper function to call Postgres functions via Hono API
 */
async function callFunction(functionName: string, params: Record<string, any> = {}) {
  const response = await fetch(`${API_URL}/api/${functionName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to call ${functionName}`);
  }

  return response.json();
}

export class OrgChartApprovalService {
  /**
   * Submit orgchart for approval
   */
  static async submitForApproval(_companyId: string, orgchartId: string, _userId: string): Promise<void> {
    await callFunction("orgchart.update_status", {
      orgchart_id: orgchartId,
      status: 'pending_approval',
    });
  }

  /**
   * Approve orgchart
   */
  static async approve(orgchartId: string): Promise<void> {
    await callFunction("orgchart.update_status", {
      orgchart_id: orgchartId,
      status: 'approved',
    });
  }

  /**
   * Revoke orgchart approval
   */
  static async revoke(orgchartId: string): Promise<void> {
    await callFunction("orgchart.update_status", {
      orgchart_id: orgchartId,
      status: 'revoked',
    });
  }

  /**
   * Return orgchart to draft
   */
  static async returnToDraft(orgchartId: string): Promise<void> {
    await callFunction("orgchart.update_status", {
      orgchart_id: orgchartId,
      status: 'draft',
    });
  }

  /**
   * Approve orgchart (alias for approve)
   * TODO: Implement full approval workflow via PostgreSQL
   */
  static async approveOrgChart(_companyId: string, _orgchartId: string, _userId: string, _comments?: string): Promise<void> {
    console.warn("[OrgChartApprovalService] approveOrgChart: Using simplified approval - full workflow not yet implemented");
    // await this.approve(orgchartId);
    throw new Error("Full approval workflow not yet migrated to PostgreSQL");
  }

  /**
   * Decline orgchart
   * TODO: Implement via PostgreSQL function call
   */
  static async declineOrgChart(_companyId: string, _orgchartId: string, _userId: string, _comments: string): Promise<void> {
    console.warn("[OrgChartApprovalService] declineOrgChart: Not fully implemented - awaiting complete migration");
    throw new Error("Decline workflow not yet migrated to PostgreSQL");
  }

  /**
   * Get user approval tasks
   * TODO: Implement via PostgreSQL function call
   */
  static async getUserTasks(_userId: string): Promise<ApprovalTask[]> {
    console.warn("[OrgChartApprovalService] getUserTasks: Not fully implemented - awaiting complete migration");
    return [];
  }

  /**
   * Complete approval task
   * TODO: Implement via PostgreSQL function call
   */
  static async completeTask(_taskId: string, _decision: "approved" | "rejected", _comments?: string): Promise<ApprovalTask> {
    console.warn("[OrgChartApprovalService] completeTask: Not fully implemented - awaiting complete migration");
    throw new Error("Task completion not yet migrated to PostgreSQL");
  }
}
