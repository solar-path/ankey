/**
 * Document Approval Service
 *
 * ⚠️ MIGRATION NEEDED: This module needs PostgreSQL migration
 * TODO: Migrate to PostgreSQL-centered architecture following ARCHITECTURE.md
 * - Create src/modules/shared/sql/document-approval.sql with PostgreSQL functions
 * - Update this service to thin client pattern (API calls only)
 * - Remove direct database access
 * - Implement approval workflow logic in PostgreSQL
 *
 * TEMPORARY: All methods return empty/placeholder data until migration is complete
 */

import type {
  ApprovalWorkflow,
  ApprovalTask,
  ApprovalDecision,
  DocumentType,
} from "@/modules/shared/types/database.types";

export interface DocumentMetadata {
  id: string; // Document ID without partition prefix
  type: DocumentType;
  title: string;
  version?: number;
}

export class DocumentApprovalService {
  /**
   * Submit document for approval
   * TODO: Implement via PostgreSQL function call
   */
  static async submitForApproval(
    _companyId: string,
    _document: DocumentMetadata,
    _initiatorId: string
  ): Promise<{ workflow: ApprovalWorkflow; tasks: ApprovalTask[] }> {
    console.warn("[DocumentApprovalService] submitForApproval: Not implemented - awaiting PostgreSQL migration");
    throw new Error("Document approval module not yet migrated to PostgreSQL");
  }

  /**
   * Approve document at current approval level
   * TODO: Implement via PostgreSQL function call
   */
  static async approveDocument(
    _workflowId: string,
    _approverId: string,
    _comments?: string
  ): Promise<{ workflow: ApprovalWorkflow; completed: boolean }> {
    console.warn("[DocumentApprovalService] approveDocument: Not implemented - awaiting PostgreSQL migration");
    throw new Error("Document approval module not yet migrated to PostgreSQL");
  }

  /**
   * Reject/decline document
   * TODO: Implement via PostgreSQL function call
   */
  static async rejectDocument(
    _workflowId: string,
    _approverId: string,
    _comments: string
  ): Promise<ApprovalWorkflow> {
    console.warn("[DocumentApprovalService] rejectDocument: Not implemented - awaiting PostgreSQL migration");
    throw new Error("Document approval module not yet migrated to PostgreSQL");
  }

  /**
   * Get workflow by ID
   * TODO: Implement via PostgreSQL function call
   */
  static async getWorkflow(_workflowId: string): Promise<ApprovalWorkflow | null> {
    console.warn("[DocumentApprovalService] getWorkflow: Not implemented - awaiting PostgreSQL migration");
    return null;
  }

  /**
   * Get all workflows for a company
   * TODO: Implement via PostgreSQL function call
   */
  static async getCompanyWorkflows(
    _companyId: string,
    _status?: ApprovalWorkflow["status"]
  ): Promise<ApprovalWorkflow[]> {
    console.warn("[DocumentApprovalService] getCompanyWorkflows: Not implemented - awaiting PostgreSQL migration");
    return [];
  }

  /**
   * Get workflows by document
   * TODO: Implement via PostgreSQL function call
   */
  static async getDocumentWorkflows(_entityType: DocumentType, _entityId: string): Promise<ApprovalWorkflow[]> {
    console.warn("[DocumentApprovalService] getDocumentWorkflows: Not implemented - awaiting PostgreSQL migration");
    return [];
  }

  /**
   * Get approval tasks for user
   * TODO: Implement via PostgreSQL function call
   */
  static async getUserTasks(_userId: string, _status?: ApprovalTask["status"]): Promise<ApprovalTask[]> {
    console.warn("[DocumentApprovalService] getUserTasks: Not implemented - awaiting PostgreSQL migration");
    return [];
  }

  /**
   * Get task by ID
   * TODO: Implement via PostgreSQL function call
   */
  static async getTask(_taskId: string): Promise<ApprovalTask | null> {
    console.warn("[DocumentApprovalService] getTask: Not implemented - awaiting PostgreSQL migration");
    return null;
  }

  /**
   * Complete an approval task
   * TODO: Implement via PostgreSQL function call
   */
  static async completeTask(
    _taskId: string,
    _decision: "approved" | "rejected",
    _comments?: string
  ): Promise<ApprovalTask> {
    console.warn("[DocumentApprovalService] completeTask: Not implemented - awaiting PostgreSQL migration");
    throw new Error("Document approval module not yet migrated to PostgreSQL");
  }

  /**
   * Cancel approval workflow
   * TODO: Implement via PostgreSQL function call
   */
  static async cancelWorkflow(_workflowId: string, _reason?: string): Promise<ApprovalWorkflow> {
    console.warn("[DocumentApprovalService] cancelWorkflow: Not implemented - awaiting PostgreSQL migration");
    throw new Error("Document approval module not yet migrated to PostgreSQL");
  }

  /**
   * Get approval history for document
   * TODO: Implement via PostgreSQL function call
   */
  static async getApprovalHistory(_entityType: DocumentType, _entityId: string): Promise<ApprovalDecision[]> {
    console.warn("[DocumentApprovalService] getApprovalHistory: Not implemented - awaiting PostgreSQL migration");
    return [];
  }

  /**
   * Check if user can approve document
   * TODO: Implement via PostgreSQL function call
   */
  static async canUserApprove(_userId: string, _workflowId: string): Promise<boolean> {
    console.warn("[DocumentApprovalService] canUserApprove: Not implemented - awaiting PostgreSQL migration");
    return false;
  }

  /**
   * Approve (alias for approveDocument)
   * TODO: Implement via PostgreSQL function call
   */
  static async approve(
    _workflowId: string,
    _approverId: string,
    _comments?: string
  ): Promise<{ workflow: ApprovalWorkflow; completed: boolean }> {
    return this.approveDocument(_workflowId, _approverId, _comments);
  }

  /**
   * Decline (alias for rejectDocument)
   * TODO: Implement via PostgreSQL function call
   */
  static async decline(
    _workflowId: string,
    _approverId: string,
    _comments: string
  ): Promise<ApprovalWorkflow> {
    return this.rejectDocument(_workflowId, _approverId, _comments);
  }

  /**
   * Get document type name for display
   */
  static getDocumentTypeName(docType: DocumentType): string {
    const names: Partial<Record<DocumentType, string>> = {
      department_charter: "Department Charter",
      job_description: "Job Description",
      job_offer: "Job Offer",
      employment_contract: "Employment Contract",
      termination_notice: "Termination Notice",
      orgchart: "Organization Chart",
      purchase_order: "Purchase Order",
      sales_order: "Sales Order",
      invoice: "Invoice",
      payment: "Payment",
      contract: "Contract",
      other: "Other Document",
    };
    return names[docType] || docType;
  }
}
