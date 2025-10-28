/**
 * Database Schema Types
 *
 * Type definitions for the backend database entities used in API calls.
 * These match the Drizzle schema definitions from the backend.
 */

/**
 * Approval Block - A single approval step in the workflow
 */
export interface ApprovalBlock {
  id?: string;
  level: number; // Sequential order (1, 2, 3, ...)
  approvers: string[]; // Array of user IDs
  requiresAll: boolean; // true = all must approve, false = any can approve
  minApprovals?: number; // Minimum approvals needed (for requiresAll: false)
}

/**
 * Approval Matrix - Defines the approval workflow for a document type
 */
export interface ApprovalMatrix {
  id?: string;
  companyId: string;
  name: string;
  description?: string;
  documentType: string; // e.g., "orgchart", "expense", "purchase_order"
  status: "active" | "inactive" | "draft";
  approvalBlocks: ApprovalBlock[];
  minAmount?: number; // Optional: minimum transaction amount
  maxAmount?: number; // Optional: maximum transaction amount
  currency?: string; // Optional: currency code (USD, EUR, etc.)
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Approval Workflow - Tracks an approval process instance
 */
export interface ApprovalWorkflow {
  id?: string;
  matrixId: string;
  companyId: string;
  entityType: string; // Type of entity being approved
  entityId: string; // ID of entity being approved
  status: "pending" | "approved" | "rejected" | "cancelled";
  currentLevel: number;
  steps: ApprovalStep[];
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

/**
 * Approval Step - Individual approval action
 */
export interface ApprovalStep {
  level: number;
  approverId: string;
  status: "pending" | "approved" | "rejected";
  comments?: string;
  approvedAt?: string;
}

/**
 * User - Basic user info for approvals
 */
export interface User {
  id: string;
  email: string;
  fullname: string;
  role?: string;
}
