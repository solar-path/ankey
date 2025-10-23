import { orgchartsDB } from "@/modules/shared/database/db";
import type {
  OrgChart,
  Department,
  Position,
  Appointment,
  OrgChartRow,
} from "./orgchart.types";

/**
 * OrgChart Service
 * Handles CRUD operations for organizational charts with cascade delete support
 */
export class OrgChartService {
  /**
   * Partition key pattern: company:{companyId}:orgchart_{id}
   */
  private static getPartitionKey(companyId: string, docId: string): string {
    return `company:${companyId}:${docId}`;
  }

  private static generateId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `${prefix}_${timestamp}_${random}`;
  }

  // ============================================================================
  // OrgChart CRUD
  // ============================================================================

  static async createOrgChart(
    companyId: string,
    userId: string,
    data: Pick<OrgChart, "title" | "description">
  ): Promise<OrgChart> {
    const now = Date.now();
    const docId = this.generateId("orgchart");

    const orgChart: OrgChart = {
      _id: this.getPartitionKey(companyId, docId),
      type: "orgchart",
      companyId,
      title: data.title,
      description: data.description,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    };

    const result = await orgchartsDB.put(orgChart);
    return { ...orgChart, _rev: result.rev };
  }

  static async getOrgChart(companyId: string, orgChartId: string): Promise<OrgChart | null> {
    try {
      const doc = await orgchartsDB.get(this.getPartitionKey(companyId, orgChartId));
      return doc.type === "orgchart" ? (doc as OrgChart) : null;
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  static async getCompanyOrgCharts(companyId: string): Promise<OrgChart[]> {
    // Get all orgcharts for this company
    const result = await orgchartsDB.find({
      selector: {
        _id: {
          $gte: `company:${companyId}:`,
          $lte: `company:${companyId}:\ufff0`,
        },
        type: "orgchart",
      },
    });

    // Sort in memory (since PouchDB requires index for sorting)
    const orgCharts = result.docs as OrgChart[];
    return orgCharts.sort((a, b) => b.createdAt - a.createdAt);
  }

  static async updateOrgChart(
    companyId: string,
    orgChartId: string,
    userId: string,
    updates: Partial<Pick<OrgChart, "title" | "description" | "status" | "enforcedAt" | "revokedAt">>
  ): Promise<OrgChart> {
    const fullId = this.getPartitionKey(companyId, orgChartId);
    const doc = (await orgchartsDB.get(fullId)) as OrgChart;

    const updated: OrgChart = {
      ...doc,
      ...updates,
      updatedAt: Date.now(),
      updatedBy: userId,
    };

    const result = await orgchartsDB.put(updated);
    return { ...updated, _rev: result.rev };
  }

  static async submitForApproval(companyId: string, orgChartId: string, userId: string): Promise<OrgChart> {
    return this.updateOrgChart(companyId, orgChartId, userId, {
      status: "pending_approval",
    });
  }

  static async approve(companyId: string, orgChartId: string, userId: string): Promise<OrgChart> {
    const now = Date.now();
    const fullId = this.getPartitionKey(companyId, orgChartId);
    const doc = (await orgchartsDB.get(fullId)) as OrgChart;

    const updated: OrgChart = {
      ...doc,
      status: "approved",
      approvedAt: now,
      approvedBy: userId,
      enforcedAt: doc.enforcedAt || now,
      updatedAt: now,
      updatedBy: userId,
    };

    const result = await orgchartsDB.put(updated);
    return { ...updated, _rev: result.rev };
  }

  static async revoke(companyId: string, orgChartId: string, userId: string): Promise<OrgChart> {
    const now = Date.now();
    return this.updateOrgChart(companyId, orgChartId, userId, {
      status: "revoked",
      revokedAt: now,
    });
  }

  // ============================================================================
  // Department CRUD
  // ============================================================================

  static async createDepartment(
    companyId: string,
    userId: string,
    data: Pick<Department, "orgChartId" | "title" | "description" | "code" | "headcount" | "parentDepartmentId">
  ): Promise<{ department: Department; headPosition: Position; vacantAppointment: Appointment }> {
    const now = Date.now();
    const deptId = this.generateId("dept");
    const deptPartitionKey = this.getPartitionKey(companyId, deptId);

    // Calculate level
    let level = 0;
    if (data.parentDepartmentId) {
      const parent = (await orgchartsDB.get(this.getPartitionKey(companyId, data.parentDepartmentId))) as Department;
      level = parent.level + 1;
    }

    // Create department
    const department: Department = {
      _id: deptPartitionKey,
      type: "department",
      companyId,
      orgChartId: data.orgChartId,
      parentDepartmentId: data.parentDepartmentId,
      title: data.title,
      description: data.description,
      code: data.code,
      headcount: data.headcount,
      currentPositionCount: 0,
      level,
      sortOrder: now,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    };

    const deptResult = await orgchartsDB.put(department);

    // Auto-create "Head of {department}" position
    const headPosId = this.generateId("pos");
    const headPosition: Position = {
      _id: this.getPartitionKey(companyId, headPosId),
      type: "position",
      companyId,
      orgChartId: data.orgChartId,
      departmentId: deptId,
      title: `Head of ${data.title}`,
      description: `Head of ${data.title} department`,
      salaryMin: 0,
      salaryMax: 0,
      salaryCurrency: "USD",
      salaryFrequency: "monthly",
      level: level + 1,
      sortOrder: now,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    };

    const posResult = await orgchartsDB.put(headPosition);

    // Auto-create "Vacant" appointment for head position
    const apptId = this.generateId("appt");
    const vacantAppointment: Appointment = {
      _id: this.getPartitionKey(companyId, apptId),
      type: "appointment",
      companyId,
      orgChartId: data.orgChartId,
      departmentId: deptId,
      positionId: headPosId,
      isVacant: true,
      level: level + 2,
      sortOrder: now,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    };

    const apptResult = await orgchartsDB.put(vacantAppointment);

    return {
      department: { ...department, _rev: deptResult.rev },
      headPosition: { ...headPosition, _rev: posResult.rev },
      vacantAppointment: { ...vacantAppointment, _rev: apptResult.rev },
    };
  }

  static async updateDepartment(
    companyId: string,
    departmentId: string,
    userId: string,
    updates: Partial<Pick<Department, "title" | "description" | "code" | "headcount" | "charter">>
  ): Promise<Department> {
    const fullId = this.getPartitionKey(companyId, departmentId);
    const doc = (await orgchartsDB.get(fullId)) as Department;

    const updated: Department = {
      ...doc,
      ...updates,
      updatedAt: Date.now(),
      updatedBy: userId,
    };

    const result = await orgchartsDB.put(updated);
    return { ...updated, _rev: result.rev };
  }

  static async deleteDepartment(companyId: string, departmentId: string): Promise<void> {
    // Cascade delete: Department -> Positions -> Appointments
    const fullId = this.getPartitionKey(companyId, departmentId);

    // Find all positions in this department
    const positions = await orgchartsDB.find({
      selector: {
        _id: {
          $gte: `company:${companyId}:`,
          $lte: `company:${companyId}:\ufff0`,
        },
        type: "position",
        departmentId,
      },
    });

    // Delete all appointments for each position
    for (const position of positions.docs as Position[]) {
      const positionId = position._id.split(":").pop()!;
      await this.deletePosition(companyId, positionId);
    }

    // Delete the department
    const dept = await orgchartsDB.get(fullId);
    await orgchartsDB.remove(dept);
  }

  // ============================================================================
  // Position CRUD
  // ============================================================================

  static async createPosition(
    companyId: string,
    userId: string,
    data: Pick<Position, "orgChartId" | "departmentId" | "title" | "description" | "code" | "salaryMin" | "salaryMax" | "salaryCurrency" | "salaryFrequency">
  ): Promise<{ position: Position; vacantAppointment: Appointment }> {
    const now = Date.now();
    const posId = this.generateId("pos");

    // Get department to calculate level
    const dept = (await orgchartsDB.get(this.getPartitionKey(companyId, data.departmentId))) as Department;

    // Create position
    const position: Position = {
      _id: this.getPartitionKey(companyId, posId),
      type: "position",
      companyId,
      ...data,
      level: dept.level + 1,
      sortOrder: now,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    };

    const posResult = await orgchartsDB.put(position);

    // Auto-create "Vacant" appointment
    const apptId = this.generateId("appt");
    const vacantAppointment: Appointment = {
      _id: this.getPartitionKey(companyId, apptId),
      type: "appointment",
      companyId,
      orgChartId: data.orgChartId,
      departmentId: data.departmentId,
      positionId: posId,
      isVacant: true,
      level: dept.level + 2,
      sortOrder: now,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    };

    const apptResult = await orgchartsDB.put(vacantAppointment);

    return {
      position: { ...position, _rev: posResult.rev },
      vacantAppointment: { ...vacantAppointment, _rev: apptResult.rev },
    };
  }

  static async updatePosition(
    companyId: string,
    positionId: string,
    userId: string,
    updates: Partial<Pick<Position, "title" | "description" | "code" | "salaryMin" | "salaryMax" | "salaryCurrency" | "salaryFrequency" | "jobDescription">>
  ): Promise<Position> {
    const fullId = this.getPartitionKey(companyId, positionId);
    const doc = (await orgchartsDB.get(fullId)) as Position;

    const updated: Position = {
      ...doc,
      ...updates,
      updatedAt: Date.now(),
      updatedBy: userId,
    };

    const result = await orgchartsDB.put(updated);
    return { ...updated, _rev: result.rev };
  }

  static async deletePosition(companyId: string, positionId: string): Promise<void> {
    // Cascade delete: Position -> Appointments
    const fullId = this.getPartitionKey(companyId, positionId);

    // Find all appointments for this position
    const appointments = await orgchartsDB.find({
      selector: {
        _id: {
          $gte: `company:${companyId}:`,
          $lte: `company:${companyId}:\ufff0`,
        },
        type: "appointment",
        positionId,
      },
    });

    // Delete all appointments
    for (const appt of appointments.docs) {
      await orgchartsDB.remove(appt);
    }

    // Delete the position
    const pos = await orgchartsDB.get(fullId);
    await orgchartsDB.remove(pos);
  }

  // ============================================================================
  // Appointment CRUD
  // ============================================================================

  static async createAppointment(
    companyId: string,
    userId: string,
    data: Pick<Appointment, "orgChartId" | "departmentId" | "positionId" | "userId" | "isVacant" | "jobOffer">
  ): Promise<Appointment> {
    const now = Date.now();
    const apptId = this.generateId("appt");

    // Get position to calculate level
    const pos = (await orgchartsDB.get(this.getPartitionKey(companyId, data.positionId))) as Position;

    const appointment: Appointment = {
      _id: this.getPartitionKey(companyId, apptId),
      type: "appointment",
      companyId,
      ...data,
      level: pos.level + 1,
      sortOrder: now,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    };

    const result = await orgchartsDB.put(appointment);
    return { ...appointment, _rev: result.rev };
  }

  static async updateAppointment(
    companyId: string,
    appointmentId: string,
    userId: string,
    updates: Partial<Pick<Appointment, "userId" | "isVacant" | "jobOffer" | "employmentContractSignedAt" | "employmentStartedAt" | "employmentEndedAt" | "terminationNoticeIssuedAt" | "terminationReason">>
  ): Promise<Appointment> {
    const fullId = this.getPartitionKey(companyId, appointmentId);
    const doc = (await orgchartsDB.get(fullId)) as Appointment;

    const updated: Appointment = {
      ...doc,
      ...updates,
      updatedAt: Date.now(),
      updatedBy: userId,
    };

    const result = await orgchartsDB.put(updated);
    return { ...updated, _rev: result.rev };
  }

  static async deleteAppointment(companyId: string, appointmentId: string): Promise<void> {
    const fullId = this.getPartitionKey(companyId, appointmentId);
    const appt = await orgchartsDB.get(fullId);
    await orgchartsDB.remove(appt);
  }

  // ============================================================================
  // Hierarchical Data Retrieval (for Table Display)
  // ============================================================================

  static async getOrgChartHierarchy(companyId: string, orgChartId: string): Promise<OrgChartRow[]> {
    // Get all documents for this orgchart
    const result = await orgchartsDB.find({
      selector: {
        _id: {
          $gte: `company:${companyId}:`,
          $lte: `company:${companyId}:\ufff0`,
        },
        $or: [
          { type: "orgchart", _id: this.getPartitionKey(companyId, orgChartId) },
          { type: "department", orgChartId },
          { type: "position", orgChartId },
          { type: "appointment", orgChartId },
        ],
      },
    });

    const orgChart = result.docs.find((d: any) => d.type === "orgchart") as OrgChart;
    const departments = result.docs.filter((d: any) => d.type === "department") as Department[];
    const positions = result.docs.filter((d: any) => d.type === "position") as Position[];
    const appointments = result.docs.filter((d: any) => d.type === "appointment") as Appointment[];

    const rows: OrgChartRow[] = [];

    // Add orgchart root
    if (orgChart) {
      rows.push({
        _id: orgChart._id,
        _rev: orgChart._rev,
        type: "orgchart",
        companyId,
        title: orgChart.title,
        description: orgChart.description,
        level: 0,
        sortOrder: orgChart.createdAt,
        hasChildren: departments.length > 0,
        status: orgChart.status,
        createdAt: orgChart.createdAt,
        updatedAt: orgChart.updatedAt,
        original: orgChart,
      });
    }

    // Add departments
    for (const dept of departments.sort((a, b) => a.sortOrder - b.sortOrder)) {
      const deptPositions = positions.filter((p) => p.departmentId === dept._id.split(":").pop());
      rows.push({
        _id: dept._id,
        _rev: dept._rev,
        type: "department",
        companyId,
        title: dept.title,
        description: dept.description,
        code: dept.code,
        parentId: dept.orgChartId,
        level: dept.level,
        sortOrder: dept.sortOrder,
        hasChildren: deptPositions.length > 0,
        createdAt: dept.createdAt,
        updatedAt: dept.updatedAt,
        original: dept,
      });

      // Add positions for this department
      for (const pos of deptPositions.sort((a, b) => a.sortOrder - b.sortOrder)) {
        const posAppointments = appointments.filter((a) => a.positionId === pos._id.split(":").pop());
        rows.push({
          _id: pos._id,
          _rev: pos._rev,
          type: "position",
          companyId,
          title: pos.title,
          description: pos.description,
          code: pos.code,
          parentId: dept._id,
          level: pos.level,
          sortOrder: pos.sortOrder,
          hasChildren: posAppointments.length > 0,
          createdAt: pos.createdAt,
          updatedAt: pos.updatedAt,
          original: pos,
        });

        // Add appointments for this position
        for (const appt of posAppointments.sort((a, b) => a.sortOrder - b.sortOrder)) {
          rows.push({
            _id: appt._id,
            _rev: appt._rev,
            type: "appointment",
            companyId,
            title: appt.isVacant ? "Vacant" : `User ${appt.userId}`,
            parentId: pos._id,
            level: appt.level,
            sortOrder: appt.sortOrder,
            hasChildren: false,
            isVacant: appt.isVacant,
            createdAt: appt.createdAt,
            updatedAt: appt.updatedAt,
            original: appt,
          });
        }
      }
    }

    return rows;
  }
}
