/**
 * Database Type Definitions
 *
 * These types match the PostgreSQL schema and are used throughout the application.
 * Previously migrated from PouchDB/CouchDB to PostgreSQL.
 */

export interface User {
  id: string;
  _id: string;
  _rev?: string;
  type: "user";
  email: string;
  password: string;
  fullname: string;
  verified: boolean;
  verificationCode?: string;
  resetToken?: string;
  resetTokenExpires?: number;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  preferredLanguage?: string; // Top-level for quick access
  createdAt: number;
  updatedAt: number;
  profile?: {
    avatar?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    preferredLanguage?: string; // Also in profile for backward compatibility
  };
}

export interface Session {
  id: string;
  _id: string;
  _rev?: string;
  type: "session";
  userId: string;
  token: string;
  expiresAt: number;
  createdAt: number;
}

export interface Inquiry {
  id: string;
  _id: string;
  _rev?: string;
  type: "inquiry";
  name?: string; // Alias for fullname
  fullname: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  status: "pending" | "in-progress" | "resolved" | "closed";
  inquiryNumber: string;
  createdAt: number;
  updatedAt: number;
  notes?: string;
  response?: string; // Response to inquiry
  assignedTo?: string;
  resolvedAt?: number;
  closedAt?: number;
  priority?: "low" | "medium" | "high" | "urgent";
  category?: string;
  tags?: string[];
  attachments?: Array<{
    name: string;
    url?: string;
    type: string;
    size?: number;
    data?: string; // Base64 data
    uploadedAt?: number;
  }>;
}

export interface Company {
  id: string;
  _id: string;
  _rev?: string;
  type: "company" | "customer" | "supplier" | "workspace" | "service provider" | "product vendor" | "partner" | "contractor" | "freelancer" | "consultant" | "other";
  title: string;
  legalName?: string;
  businessRegistrationNumber?: string;
  taxIdentificationNumber?: string;
  vatNumber?: string;
  industry?: string;
  numberOfEmployees?: string;
  website?: string;
  email?: string;
  phone?: string;
  residence?: string; // Country code
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    swiftCode?: string;
    iban?: string;
  };
  settings?: {
    fiscalYearStart?: string;
    fiscalYearEnd?: string;
    defaultCurrency?: string;
    workingCurrency?: string;
    reportingCurrency?: string;
    additionalCurrencies?: string[];
    taxRate?: number;
    defaultTaxRate?: number;
    taxIdLabel?: string;
    language?: string;
    timezone?: string;
    dateFormat?: string;
    numberFormat?: string;
    invoicePrefix?: string;
    invoiceNumbering?: string;
    paymentTerms?: number;
    latePaymentFee?: number;
    autoApprovalThreshold?: number;
    twoFactorRequired?: boolean;
    twoFactorDeadline?: string;
    passwordChangeDays?: number;
  };
  logo?: string;
  description?: string;
  status: "active" | "inactive" | "suspended";
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface UserCompany {
  id: string;
  _id: string;
  _rev?: string;
  type: "user_company";
  userId: string;
  companyId: string;
  role: "owner" | "admin" | "member";
  status: "active" | "invited" | "inactive";
  invitedAt?: number;
  joinedAt?: number;
  leftAt?: number;
  invitedBy?: string;
}

export interface OrgChart {
  id: string;
  _id: string;
  _rev?: string;
  companyId: string;
  type: "orgchart" | "department" | "position" | "appointment";
  level: number;
  title: string;
  code?: string;
  description?: string;
  headcountLimit?: number;
  parentId?: string;
  status: "draft" | "pending_approval" | "approved" | "revoked";
  approvedAt?: number;
  approvedBy?: string;
  revokedAt?: number;
  revokedBy?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  appointedUserId?: string;
  appointedAt?: number;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  jobDescription?: string;
}

export interface ChartOfAccounts {
  id: string;
  _id: string;
  _rev?: string;
  companyId: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  category: string;
  subcategory?: string;
  parentId?: string;
  level: number;
  isActive: boolean;
  description?: string;
  currency?: string;
  taxable?: boolean;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export type DocumentType =
  | "purchase_order"
  | "sales_order"
  | "invoice"
  | "payment"
  | "contract"
  | "department_charter"
  | "job_description"
  | "job_offer"
  | "employment_contract"
  | "termination_notice"
  | "orgchart"
  | "other";

export interface ApprovalBlock {
  id?: string;
  level: number;
  order: number;
  approvers: string[] | Array<{ userId: string; name: string }>;
  requiresAll: boolean;
  minApprovals?: number;
}

export interface ApprovalMatrix {
  id?: string;
  _id: string;
  _rev?: string;
  type?: "approval_matrix";
  companyId: string;
  name: string;
  description?: string;
  documentType: DocumentType;
  status?: "active" | "inactive";
  minAmount?: number;
  maxAmount?: number;
  currency: string;
  approvalBlocks: ApprovalBlock[];
  isActive: boolean;
  effectiveFrom?: number;
  effectiveTo?: number | null;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface ApprovalDecision {
  userId: string;
  userName?: string;
  level?: number;
  decision: "approved" | "rejected" | "declined";
  comments?: string;
  timestamp?: number;
  decidedAt: number;
}

export interface ApprovalWorkflow {
  id?: string;
  _id: string;
  _rev?: string;
  type?: "approval_workflow" | "approval_request" | "approval_response";
  companyId: string;
  matrixId: string;
  entityType: string;
  entityId: string;
  currentLevel?: number;
  currentBlock: number;
  status: "pending" | "approved" | "rejected" | "declined" | "approval_pending";
  decisions: ApprovalDecision[];
  initiatorId?: string;
  approverId?: string;
  submittedAt?: number;
  respondedAt?: number;
  comments?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  document?: {
    type: DocumentType;
    amount: number;
    currency: string;
    description: string;
    metadata?: Record<string, any>;
  };
}

export interface ApprovalTask {
  id?: string;
  _id: string;
  _rev?: string;
  type?: "task";
  companyId: string;
  taskType?: "approval_request" | "approval_response";
  workflowId: string;
  userId: string;
  blockId?: string;
  blockOrder?: number;
  status?: "pending" | "completed";
  completed?: boolean;
  completedAt?: number;
  createdAt: number;
  updatedAt?: number;
  entityType: string;
  entityId: string;
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  documentType?: DocumentType;
  documentAmount?: number;
  documentCurrency?: string;
  documentDescription?: string;
}
