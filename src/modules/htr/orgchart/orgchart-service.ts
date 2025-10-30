/**
 * OrgChart Service - Thin Client Layer
 *
 * All business logic is in PostgreSQL functions (orgchart.sql)
 * This service just calls Hono API which executes SQL functions
 */

import type {
  OrgChart,
  Department,
  Position,
} from "./orgchart.types";

// TODO: OrgChartNode type should be exported from orgchart.types.ts
type OrgChartNode = OrgChart | Department | Position | any;

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
      charter?: string;
      parentDepartmentId?: string;
    }
  ): Promise<{ department: Department; headPosition: Position }> {
    return callFunction("orgchart.create_department", {
      company_id: companyId,
      parent_id: data.parentDepartmentId || data.orgChartId, // Use orgChartId if no parent
      title: data.title,
      description: data.description,
      code: data.code,
      headcount: data.headcount,
      charter: data.charter,
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
      jobDescription?: string;
    }
  ): Promise<Position> {
    return callFunction("orgchart.create_position", {
      company_id: companyId,
      user_id: userId,
      orgchart_id: data.orgChartId,
      department_id: data.departmentId,
      title: data.title,
      description: data.description,
      salary_min: data.salaryMin,
      salary_max: data.salaryMax,
      salary_currency: data.salaryCurrency,
      salary_frequency: data.salaryFrequency,
      job_description: data.jobDescription,
    });
  }

  /**
   * Appoint user to position
   */
  static async createAppointment(
    companyId: string,
    userId: string,
    data: {
      orgChartId: string;
      departmentId: string;
      positionId: string;
      userId?: string;
      isVacant: boolean;
      jobOffer?: any;
    }
  ): Promise<any> {
    return callFunction("orgchart.create_appointment", {
      company_id: companyId,
      user_id: userId,
      orgchart_id: data.orgChartId,
      department_id: data.departmentId,
      position_id: data.positionId,
      appointee_user_id: data.userId,
      is_vacant: data.isVacant,
      job_offer: data.jobOffer,
    });
  }

  /**
   * Remove appointment from position
   */
  static async removeAppointment(positionId: string): Promise<void> {
    await callFunction("orgchart.remove_appointment", {
      position_id: positionId,
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
      jobDescription?: string;
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
      job_description: data.jobDescription,
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
   * TODO: Implement via PostgreSQL function call
   */
  static async updatePosition(
    _companyId: string,
    _positionId: string,
    _userId: string,
    _data: Partial<Position>
  ): Promise<Position> {
    console.warn("[OrgChartService] updatePosition: Not fully implemented - awaiting complete migration");
    throw new Error("Method not yet migrated to PostgreSQL");
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
   * Delete department
   * TODO: Implement via PostgreSQL function call
   */
  static async deleteDepartment(_companyId: string, _departmentId: string): Promise<void> {
    console.warn("[OrgChartService] deleteDepartment: Not fully implemented - awaiting complete migration");
    throw new Error("Method not yet migrated to PostgreSQL");
  }

  /**
   * Delete position
   * TODO: Implement via PostgreSQL function call
   */
  static async deletePosition(_companyId: string, _positionId: string): Promise<void> {
    console.warn("[OrgChartService] deletePosition: Not fully implemented - awaiting complete migration");
    throw new Error("Method not yet migrated to PostgreSQL");
  }

  /**
   * Delete appointment
   * TODO: Implement via PostgreSQL function call
   */
  static async deleteAppointment(_companyId: string, _appointmentId: string): Promise<void> {
    console.warn("[OrgChartService] deleteAppointment: Not fully implemented - awaiting complete migration");
    throw new Error("Method not yet migrated to PostgreSQL");
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
}
