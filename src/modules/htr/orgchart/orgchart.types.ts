/**
 * Organizational Chart Types
 * Hierarchical structure: OrgChart > Department > Position > Appointment
 */

// ============================================================================
// Lifecycle Statuses
// ============================================================================

export type OrgChartStatus = "draft" | "pending_approval" | "approved" | "revoked";

// ============================================================================
// Salary Frequency
// ============================================================================

export type SalaryFrequency = "monthly" | "weekly" | "daily" | "hourly" | "per_job" | "annual";

// ============================================================================
// Base Document Interface (for CouchDB)
// ============================================================================

export interface BaseOrgDocument {
  _id: string;
  _rev?: string;
  type: "orgchart" | "department" | "position" | "appointment";
  companyId: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}

// ============================================================================
// OrgChart (Top-level structure)
// ============================================================================

export interface OrgChart extends BaseOrgDocument {
  type: "orgchart";
  title: string;
  description?: string;
  status: OrgChartStatus;
  version: string; // Format: "1.0" - major.minor (major = approved count, minor = draft version)

  // Temporal validity
  enforcedAt?: number; // When this orgchart becomes active
  revokedAt?: number; // When this orgchart was revoked

  // Approval tracking
  submittedForApprovalAt?: number;
  submittedForApprovalBy?: string;
  approvedAt?: number;
  approvedBy?: string;
}

// ============================================================================
// Department
// ============================================================================

export interface Department extends BaseOrgDocument {
  type: "department";
  orgChartId: string;
  parentDepartmentId?: string; // For nested departments

  title: string;
  description?: string;
  code?: string; // Department code (e.g., "FIN-001")

  // Headcount limits
  headcount: number; // Maximum number of positions allowed
  currentPositionCount?: number; // Calculated field

  // Department Charter data
  charter?: {
    mission?: string;
    objectives?: string[];
    responsibilities?: string[];
    kpis?: string[];
  };

  // Hierarchy
  level: number; // 0 = top level, 1 = first nested, etc.
  sortOrder: number; // For display ordering
}

// ============================================================================
// Position
// ============================================================================

export interface Position extends BaseOrgDocument {
  type: "position";
  orgChartId: string;
  departmentId: string;

  title: string;
  description?: string;
  code?: string; // Position code (e.g., "FIN-001-MGR")

  // Reporting relationship (management hierarchy)
  reportsToPositionId?: string; // Position ID that this position reports to

  // Salary range
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string; // ISO 4217 currency code (e.g., "USD")
  salaryFrequency: SalaryFrequency;

  // Job Description data
  jobDescription?: {
    summary?: string;
    responsibilities?: string[];
    requirements?: string[];
    qualifications?: string[];
    benefits?: string[];
  };

  // Hierarchy
  level: number;
  sortOrder: number;
}

// ============================================================================
// Appointment (User assigned to Position)
// ============================================================================

export interface Appointment extends BaseOrgDocument {
  type: "appointment";
  orgChartId: string;
  departmentId: string;
  positionId: string;

  userId?: string; // If vacant, this is undefined
  isVacant: boolean;

  // Reporting relationship (inherited from position, can be overridden)
  reportsToPositionId?: string; // Position ID that this appointment reports to

  // Job Offer data (when user is appointed)
  jobOffer?: {
    salary: number;
    salaryCurrency: string;
    salaryFrequency: SalaryFrequency;
    startDate?: number;
    benefits?: string[];
    conditions?: string[];
  };

  // Employment tracking
  employmentContractSignedAt?: number;
  employmentStartedAt?: number;
  employmentEndedAt?: number;
  terminationNoticeIssuedAt?: number;
  terminationReason?: string;

  // Hierarchy
  level: number;
  sortOrder: number;
}

// ============================================================================
// Flattened Row for Table Display
// ============================================================================

export interface OrgChartRow {
  _id: string;
  _rev?: string;
  type: "orgchart" | "department" | "position" | "appointment";
  companyId: string;

  // Display
  title: string;
  description?: string;
  code?: string;

  // Department-specific fields
  headcount?: number;

  // Position-specific fields
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryFrequency?: SalaryFrequency;

  // Reporting relationship
  reportsToPositionId?: string;

  // Hierarchy
  parentId?: string; // orgChartId, departmentId, or positionId
  level: number; // 0 = orgchart, 1 = department, 2 = position, 3 = appointment
  sortOrder: number;
  hasChildren: boolean;
  isExpanded?: boolean;

  // Status
  status?: OrgChartStatus;
  isVacant?: boolean;

  // Metadata
  createdAt: number;
  updatedAt: number;

  // Original document (for editing)
  original: OrgChart | Department | Position | Appointment;
}

// ============================================================================
// Permissions Helper
// ============================================================================

export interface OrgChartPermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;

  // Field-level permissions
  updatableFields?: string[];
}

export function getOrgChartPermissions(status: OrgChartStatus): OrgChartPermissions {
  switch (status) {
    case "draft":
      return {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: false, // OrgChart never deleted, only status changed
      };
    case "pending_approval":
    case "approved":
    case "revoked":
      return {
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false,
      };
    default:
      return {
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false,
      };
  }
}

export function getDepartmentPermissions(orgChartStatus: OrgChartStatus): OrgChartPermissions {
  switch (orgChartStatus) {
    case "draft":
      return {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
      };
    case "pending_approval":
    case "approved":
    case "revoked":
      return {
        canCreate: false,
        canRead: true,
        canUpdate: true, // Some fields updatable (charter)
        canDelete: false,
        updatableFields: ["charter", "description"],
      };
    default:
      return {
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false,
      };
  }
}

export function getPositionPermissions(orgChartStatus: OrgChartStatus): OrgChartPermissions {
  switch (orgChartStatus) {
    case "draft":
      return {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
      };
    case "pending_approval":
    case "approved":
    case "revoked":
      return {
        canCreate: false,
        canRead: true,
        canUpdate: true, // Some fields updatable (job description)
        canDelete: false,
        updatableFields: ["jobDescription", "description"],
      };
    default:
      return {
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false,
      };
  }
}

export function getAppointmentPermissions(orgChartStatus: OrgChartStatus): OrgChartPermissions {
  switch (orgChartStatus) {
    case "draft":
      return {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
      };
    case "pending_approval":
    case "approved":
    case "revoked":
      return {
        canCreate: true, // Can always appoint users
        canRead: true,
        canUpdate: true, // Can update job offers
        canDelete: true, // Can remove appointments
        updatableFields: ["userId", "isVacant", "jobOffer", "employmentContractSignedAt", "employmentStartedAt", "employmentEndedAt", "terminationNoticeIssuedAt", "terminationReason"],
      };
    default:
      return {
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false,
      };
  }
}
