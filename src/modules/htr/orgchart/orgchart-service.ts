/**
 * OrgChart Service - Thin Client Layer
 *
 * All business logic is in PostgreSQL functions (orgchart.sql)
 * This service just calls Hono API which executes SQL functions
 */

import { callFunction } from "@/lib/api";
import type {
  OrgChart,
  Department,
  Position,
} from "./orgchart.types";

// TODO: OrgChartNode type should be exported from orgchart.types.ts
type OrgChartNode = OrgChart | Department | Position | any;

export class OrgChartService {
  /**
   * Create root organizational chart
   */
  static async createOrgChart(
    companyId: string,
    userId: string,
    data: {
      title: string;
      description?: string;
      code?: string;
      version?: string;
      status?: 'draft' | 'pending_approval' | 'approved' | 'revoked';
    }
  ): Promise<OrgChart> {
    return callFunction("orgchart.create_orgchart", {
      company_id: companyId,
      user_id: userId,
      title: data.title,
      description: data.description,
      code: data.code,
      version: data.version,
      status: data.status,
    });
  }

  /**
   * Create department (auto-creates head position)
   */
  static async createDepartment(
    companyId: string,
    userId: string,
    data: {
      orgChartId: string;
      title: string;
      description?: string;
      code?: string;
      headcount?: number;
      charter?: {
        mission?: string;
        objectives?: string[];
        responsibilities?: string[];
        kpis?: string[];
      };
      parentDepartmentId?: string;
    }
  ): Promise<{ department: Department; headPosition: Position }> {
    return callFunction("orgchart.create_department", {
      company_id: companyId,
      user_id: userId,
      parent_id: data.parentDepartmentId || data.orgChartId, // Use orgChartId if no parent
      title: data.title,
      description: data.description,
      code: data.code,
      headcount: data.headcount,
      charter_mission: data.charter?.mission,
      charter_objectives: data.charter?.objectives,
      charter_responsibilities: data.charter?.responsibilities,
      charter_kpis: data.charter?.kpis,
    });
  }

  /**
   * Create position within department
   */
  static async createPosition(
    companyId: string,
    userId: string,
    data: {
      orgChartId: string;
      departmentId: string;
      title: string;
      description?: string;
      salaryMin?: number;
      salaryMax?: number;
      salaryCurrency?: string;
      salaryFrequency?: string;
      jobDescription?: {
        summary?: string;
        responsibilities?: string[];
        requirements?: string[];
        qualifications?: string[];
        benefits?: string[];
      };
    }
  ): Promise<Position> {
    return callFunction("orgchart.create_position", {
      company_id: companyId,
      user_id: userId,
      parent_id: data.departmentId,
      title: data.title,
      description: data.description,
      salary_min: data.salaryMin,
      salary_max: data.salaryMax,
      salary_currency: data.salaryCurrency || 'USD',
      salary_frequency: data.salaryFrequency || 'annual',
      job_summary: data.jobDescription?.summary,
      job_responsibilities: data.jobDescription?.responsibilities,
      job_requirements: data.jobDescription?.requirements,
      job_qualifications: data.jobDescription?.qualifications,
      job_benefits: data.jobDescription?.benefits,
    });
  }

  /**
   * Appoint user to position
   */
  static async createAppointment(
    companyId: string,
    actingUserId: string,
    data: {
      positionId: string;
      userId: string;
      fullname: string;
      email: string;
      reportsToPositionId?: string;
      jobOffer?: {
        salary?: number;
        startDate?: number;
        benefits?: string[];
        conditions?: string[];
      };
    }
  ): Promise<any> {
    return callFunction("orgchart.create_appointment", {
      company_id: companyId,
      acting_user_id: actingUserId,
      position_id: data.positionId,
      user_id: data.userId,
      appointee_fullname: data.fullname,
      appointee_email: data.email,
      reports_to_position_id: data.reportsToPositionId,
      job_offer_salary: data.jobOffer?.salary,
      job_offer_start_date: data.jobOffer?.startDate ? new Date(data.jobOffer.startDate).toISOString() : null,
      job_offer_benefits: data.jobOffer?.benefits,
      job_offer_conditions: data.jobOffer?.conditions,
    });
  }

  /**
   * Remove appointment from position
   */
  static async removeAppointment(
    companyId: string,
    actingUserId: string,
    positionId: string,
    endReason: 'resigned' | 'terminated' | 'transferred' | 'promoted' | 'reorganization' = 'resigned'
  ): Promise<void> {
    await callFunction("orgchart.remove_appointment", {
      company_id: companyId,
      acting_user_id: actingUserId,
      position_id: positionId,
      end_reason: endReason,
    });
  }

  /**
   * Get complete orgchart tree with all descendants
   */
  static async getOrgChartTree(
    companyId: string,
    orgchartId: string
  ): Promise<OrgChartNode[]> {
    const result = await callFunction("orgchart.get_tree", {
      company_id: companyId,
      orgchart_id: orgchartId,
    });
    return result as OrgChartNode[];
  }

  /**
   * Update any node (orgchart/department/position)
   */
  static async updateNode(
    nodeId: string,
    data: {
      title?: string;
      description?: string;
      code?: string;
      version?: string;
      status?: string;
      headcount?: number;
      charter?: string;
      salaryMin?: number;
      salaryMax?: number;
      salaryCurrency?: string;
      salaryFrequency?: string;
      jobDescription?: string;
      reportsToPositionId?: string;
    }
  ): Promise<any> {
    return callFunction("orgchart.update_node", {
      node_id: nodeId,
      title: data.title,
      description: data.description,
      code: data.code,
      version: data.version,
      status: data.status,
      headcount: data.headcount,
      charter: data.charter,
      salary_min: data.salaryMin,
      salary_max: data.salaryMax,
      salary_currency: data.salaryCurrency,
      salary_frequency: data.salaryFrequency,
      job_description: data.jobDescription,
      reports_to_position_id: data.reportsToPositionId,
    });
  }

  /**
   * Rename orgchart
   */
  static async renameOrgChart(
    orgchartId: string,
    title: string,
    description?: string
  ): Promise<any> {
    return this.updateNode(orgchartId, { title, description });
  }

  /**
   * Delete node (with optional cascade)
   */
  static async deleteNode(nodeId: string, cascade: boolean = false): Promise<void> {
    await callFunction("orgchart.delete_node", {
      node_id: nodeId,
      cascade: cascade,
    });
  }

  /**
   * Get all orgcharts for company
   */
  static async getAllOrgCharts(companyId: string): Promise<OrgChart[]> {
    const result = await callFunction("orgchart.get_all_orgcharts", {
      company_id: companyId,
    });
    return result as OrgChart[];
  }

  /**
   * Update orgchart status (approval workflow)
   */
  static async updateStatus(
    orgchartId: string,
    status: 'draft' | 'pending_approval' | 'approved' | 'revoked'
  ): Promise<void> {
    await callFunction("orgchart.update_status", {
      orgchart_id: orgchartId,
      status: status,
    });
  }

  /**
   * Get orgchart by ID (get root node from tree)
   */
  static async getOrgChartById(
    companyId: string,
    orgchartId: string
  ): Promise<OrgChart | null> {
    const tree = await this.getOrgChartTree(companyId, orgchartId);
    return tree.find(node => node.id === orgchartId) as OrgChart || null;
  }

  /**
   * Get departments for orgchart
   */
  static async getDepartments(
    companyId: string,
    orgchartId: string
  ): Promise<Department[]> {
    const tree = await this.getOrgChartTree(companyId, orgchartId);
    return tree.filter(node => node.type === 'department') as Department[];
  }

  /**
   * Get positions for department
   */
  static async getPositions(
    companyId: string,
    orgchartId: string,
    departmentId: string
  ): Promise<Position[]> {
    const tree = await this.getOrgChartTree(companyId, orgchartId);
    return tree.filter(
      node => node.type === 'position' && node.parentId === departmentId
    ) as Position[];
  }

  /**
   * Get all orgcharts for company
   */
  static async getCompanyOrgCharts(companyId: string): Promise<OrgChart[]> {
    return this.getAllOrgCharts(companyId);
  }

  /**
   * Get orgchart hierarchy (tree structure)
   */
  static async getOrgChartHierarchy(companyId: string, orgChartId: string): Promise<any[]> {
    return this.getOrgChartTree(companyId, orgChartId);
  }

  /**
   * Update department
   * TODO: Implement via PostgreSQL function call
   */
  static async updateDepartment(
    _companyId: string,
    _departmentId: string,
    _userId: string,
    _data: Partial<Department>
  ): Promise<Department> {
    console.warn("[OrgChartService] updateDepartment: Not fully implemented - awaiting complete migration");
    throw new Error("Method not yet migrated to PostgreSQL");
  }

  /**
   * Update position
   */
  static async updatePosition(
    _companyId: string,
    positionId: string,
    _userId: string,
    data: Partial<Position>
  ): Promise<Position> {
    // Convert Position fields to updateNode format
    const updateData: any = {
      title: data.title,
      description: data.description,
    };

    // Handle salary fields
    if (data.salaryMin !== undefined) updateData.salaryMin = data.salaryMin;
    if (data.salaryMax !== undefined) updateData.salaryMax = data.salaryMax;
    if (data.salaryCurrency !== undefined) updateData.salaryCurrency = data.salaryCurrency;
    if (data.salaryFrequency !== undefined) updateData.salaryFrequency = data.salaryFrequency;

    // Handle reporting relationship
    if (data.reportsToPositionId !== undefined) updateData.reportsToPositionId = data.reportsToPositionId;

    // Handle job description - convert to JSONB string
    if (data.jobDescription) {
      updateData.jobDescription = JSON.stringify(data.jobDescription);
    }

    const result = await this.updateNode(positionId, updateData);
    return result as Position;
  }

  /**
   * Update appointment
   * TODO: Implement via PostgreSQL function call
   */
  static async updateAppointment(
    _companyId: string,
    _appointmentId: string,
    _userId: string,
    _data: any
  ): Promise<any> {
    console.warn("[OrgChartService] updateAppointment: Not fully implemented - awaiting complete migration");
    throw new Error("Method not yet migrated to PostgreSQL");
  }

  /**
   * Delete department (with cascade)
   */
  static async deleteDepartment(_companyId: string, departmentId: string): Promise<void> {
    await this.deleteNode(departmentId, true); // Cascade delete
  }

  /**
   * Delete position (with cascade)
   */
  static async deletePosition(_companyId: string, positionId: string): Promise<void> {
    await this.deleteNode(positionId, true); // Cascade delete
  }

  /**
   * Delete appointment
   */
  static async deleteAppointment(_companyId: string, appointmentId: string): Promise<void> {
    await this.deleteNode(appointmentId, false); // No cascade for appointments
  }

  /**
   * Duplicate orgchart
   */
  static async duplicateOrgChart(companyId: string, orgChartId: string, _userId: string, newTitle?: string): Promise<OrgChart> {
    return callFunction("orgchart.duplicate_orgchart", {
      company_id: companyId,
      orgchart_id: orgChartId,
      new_title: newTitle,
    });
  }

  /**
   * Get payroll forecast
   * TODO: Implement via PostgreSQL function call
   */
  static async getPayrollForecast(_companyId: string, _orgChartId: string): Promise<any> {
    console.warn("[OrgChartService] getPayrollForecast: Not fully implemented - awaiting complete migration");
    return { total: 0, positions: [] };
  }

  // ============================================================================
  // NEW METHODS - Appointment History & Hierarchical Reporting
  // ============================================================================

  /**
   * Get appointment history for a position
   */
  static async getAppointmentHistory(positionId: string): Promise<any[]> {
    const result = await callFunction("orgchart.get_appointment_history", {
      position_id: positionId,
    });
    return result as any[];
  }

  /**
   * Get direct reports for a position (hierarchical reporting)
   */
  static async getDirectReports(positionId: string): Promise<any[]> {
    const result = await callFunction("orgchart.get_direct_reports", {
      position_id: positionId,
    });
    return result as any[];
  }

  /**
   * Get reporting chain from position to top (position -> manager -> director -> ...)
   */
  static async getReportingChain(positionId: string): Promise<any[]> {
    const result = await callFunction("orgchart.get_reporting_chain", {
      position_id: positionId,
    });
    return result as any[];
  }

  /**
   * Transfer appointment from one position to another
   */
  static async transferAppointment(
    companyId: string,
    actingUserId: string,
    data: {
      fromPositionId: string;
      toPositionId: string;
      transferReason?: string;
      newReportsToPositionId?: string;
      newJobOffer?: {
        salary?: number;
        startDate?: number;
        benefits?: string[];
        conditions?: string[];
      };
    }
  ): Promise<any> {
    return callFunction("orgchart.transfer_appointment", {
      company_id: companyId,
      acting_user_id: actingUserId,
      from_position_id: data.fromPositionId,
      to_position_id: data.toPositionId,
      transfer_reason: data.transferReason || 'transferred',
      new_reports_to_position_id: data.newReportsToPositionId,
      new_job_offer_data: data.newJobOffer ? {
        salary: data.newJobOffer.salary,
        start_date: data.newJobOffer.startDate,
        benefits: data.newJobOffer.benefits,
        conditions: data.newJobOffer.conditions,
      } : null,
    });
  }

  /**
   * Update job offer for current appointment
   */
  static async updateJobOffer(
    companyId: string,
    actingUserId: string,
    positionId: string,
    jobOffer: {
      salary?: number;
      startDate?: number;
      benefits?: string[];
      conditions?: string[];
    }
  ): Promise<any> {
    return callFunction("orgchart.update_job_offer", {
      company_id: companyId,
      acting_user_id: actingUserId,
      position_id: positionId,
      job_offer_data: {
        salary: jobOffer.salary,
        start_date: jobOffer.startDate,
        benefits: jobOffer.benefits,
        conditions: jobOffer.conditions,
      },
    });
  }
}
