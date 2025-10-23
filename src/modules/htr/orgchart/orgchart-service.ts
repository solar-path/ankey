import { orgchartsDB, usersDB, type User } from "@/modules/shared/database/db";
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

    // Calculate version: major = count of approved/revoked orgcharts, minor = draft count
    const allOrgCharts = await this.getCompanyOrgCharts(companyId);
    const approvedCount = allOrgCharts.filter((o) => o.status === "approved" || o.status === "revoked").length;
    const draftCount = allOrgCharts.filter((o) => o.status === "draft" || o.status === "pending_approval").length;
    const version = `${approvedCount + 1}.${draftCount}`;

    const orgChart: OrgChart = {
      _id: this.getPartitionKey(companyId, docId),
      type: "orgchart",
      companyId,
      title: data.title,
      description: data.description,
      status: "draft",
      version,
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

    console.log("[OrgChartService] Raw orgcharts from DB:", result.docs);

    // Sort in memory (since PouchDB requires index for sorting)
    const orgCharts = result.docs as OrgChart[];

    // Migrate old documents without version field
    const chartsWithVersion = await Promise.all(
      orgCharts.map(async (chart) => {
        if (!chart.version) {
          console.warn("[OrgChartService] Migrating OrgChart without version:", chart._id);

          // Calculate proper version
          const allCharts = orgCharts.filter((c) => c._id !== chart._id);
          const approvedCount = allCharts.filter(
            (c) => (c.status === "approved" || c.status === "revoked") && c.version
          ).length;
          const draftCount = allCharts.filter(
            (c) => (c.status === "draft" || c.status === "pending_approval") && c.version
          ).length;

          const version =
            chart.status === "approved" || chart.status === "revoked"
              ? `${approvedCount + 1}.0`
              : `${approvedCount + 1}.${draftCount}`;

          // Update document in database
          const updated = {
            ...chart,
            version,
          };

          try {
            await orgchartsDB.put(updated);
            console.log(`[OrgChartService] Migrated ${chart._id} to version ${version}`);
            return updated as OrgChart;
          } catch (error) {
            console.error("[OrgChartService] Failed to migrate:", error);
            // Return with version in memory only
            return updated as OrgChart;
          }
        }
        return chart;
      })
    );

    return chartsWithVersion.sort((a, b) => b.createdAt - a.createdAt);
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

    // Update version: set minor to 0 (approved version)
    const [major] = doc.version.split(".");
    const version = `${major}.0`;

    const updated: OrgChart = {
      ...doc,
      status: "approved",
      version,
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
    // Cascade delete: Department -> Sub-Departments -> Positions -> Appointments
    const fullId = this.getPartitionKey(companyId, departmentId);

    // Find all sub-departments in this department
    const subDepartments = await orgchartsDB.find({
      selector: {
        _id: {
          $gte: `company:${companyId}:`,
          $lte: `company:${companyId}:\ufff0`,
        },
        type: "department",
        parentDepartmentId: departmentId,
      },
    });

    // Recursively delete all sub-departments
    for (const subDept of subDepartments.docs as Department[]) {
      const subDeptId = subDept._id.split(":").pop()!;
      await this.deleteDepartment(companyId, subDeptId);
    }

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
    data: Pick<Position, "orgChartId" | "departmentId" | "title" | "description" | "salaryMin" | "salaryMax" | "salaryCurrency" | "salaryFrequency">
  ): Promise<{ position: Position; vacantAppointment: Appointment }> {
    const now = Date.now();
    const posId = this.generateId("pos");

    // Get department to calculate level and generate code
    const dept = (await orgchartsDB.get(this.getPartitionKey(companyId, data.departmentId))) as Department;

    // Count existing positions in this department to generate sequential code
    const existingPositions = await orgchartsDB.find({
      selector: {
        _id: {
          $gte: `company:${companyId}:`,
          $lte: `company:${companyId}:\ufff0`,
        },
        type: "position",
        departmentId: data.departmentId,
      },
    });

    const positionNumber = existingPositions.docs.length + 1;
    const deptCode = dept.code || "DEPT";
    const autoCode = `${deptCode}-${String(positionNumber).padStart(3, "0")}`;

    // Create position
    const position: Position = {
      _id: this.getPartitionKey(companyId, posId),
      type: "position",
      companyId,
      ...data,
      code: autoCode,
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
    updates: Partial<Pick<Position, "title" | "description" | "salaryMin" | "salaryMax" | "salaryCurrency" | "salaryFrequency" | "jobDescription">>
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
  // Data Cleanup Utilities
  // ============================================================================

  /**
   * Remove duplicate documents from database
   * WARNING: This will permanently delete duplicate documents!
   */
  static async removeDuplicates(companyId: string): Promise<{ removed: number; kept: number }> {
    const result = await orgchartsDB.find({
      selector: {
        _id: {
          $gte: `company:${companyId}:`,
          $lte: `company:${companyId}:\ufff0`,
        },
      },
    });

    const docs = result.docs;
    const uniqueMap = new Map<string, any>();
    const duplicates: any[] = [];

    // Group by unique key (type + title + parentId)
    for (const doc of docs) {
      const uniqueKey = `${doc.type}:${(doc as any).title}:${(doc as any).parentDepartmentId || (doc as any).departmentId || (doc as any).positionId || "root"}`;

      if (uniqueMap.has(uniqueKey)) {
        // This is a duplicate - keep the older one (lower createdAt)
        const existing = uniqueMap.get(uniqueKey);
        if (doc.createdAt < existing.createdAt) {
          duplicates.push(existing);
          uniqueMap.set(uniqueKey, doc);
        } else {
          duplicates.push(doc);
        }
      } else {
        uniqueMap.set(uniqueKey, doc);
      }
    }

    console.log(`[removeDuplicates] Found ${duplicates.length} duplicates to remove`);
    console.log(`[removeDuplicates] Keeping ${uniqueMap.size} unique documents`);

    // Remove duplicates
    for (const duplicate of duplicates) {
      try {
        await orgchartsDB.remove(duplicate);
        console.log(`[removeDuplicates] Removed duplicate: ${duplicate._id}`);
      } catch (error) {
        console.error(`[removeDuplicates] Failed to remove ${duplicate._id}:`, error);
      }
    }

    return { removed: duplicates.length, kept: uniqueMap.size };
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

    console.log("[getOrgChartHierarchy] All docs:", result.docs.length);
    console.log("[getOrgChartHierarchy] All docs details:", result.docs.map((d: any) => ({
      _id: d._id,
      type: d.type,
      title: d.title || (d.isVacant ? "Vacant" : ""),
      departmentId: d.departmentId,
      positionId: d.positionId,
      parentDepartmentId: d.parentDepartmentId,
    })));

    const departments = result.docs.filter((d: any) => d.type === "department") as Department[];
    const positions = result.docs.filter((d: any) => d.type === "position") as Position[];
    const appointments = result.docs.filter((d: any) => d.type === "appointment") as Appointment[];

    console.log("[getOrgChartHierarchy] Filtered:", {
      departments: departments.length,
      positions: positions.length,
      appointments: appointments.length,
    });
    console.log("[getOrgChartHierarchy] Positions:", positions.map(p => ({ _id: p._id, title: p.title, departmentId: p.departmentId })));
    console.log("[getOrgChartHierarchy] Appointments:", appointments.map(a => ({ _id: a._id, positionId: a.positionId, isVacant: a.isVacant })));

    const rows: OrgChartRow[] = [];

    // Note: OrgChart itself is not added to rows - it's shown in the page header
    // Only departments, positions, and appointments are shown in the hierarchical table

    // Add departments
    for (const dept of departments.sort((a, b) => a.sortOrder - b.sortOrder)) {
      const deptPositions = positions.filter((p) => p.departmentId === dept._id.split(":").pop());

      // For nested departments, parentId should be the full _id of parent department
      // For top-level departments, parentId is undefined
      const parentId = dept.parentDepartmentId
        ? this.getPartitionKey(companyId, dept.parentDepartmentId)
        : undefined;

      rows.push({
        _id: dept._id,
        _rev: dept._rev,
        type: "department",
        companyId,
        title: dept.title,
        description: dept.description,
        code: dept.code,
        headcount: dept.headcount,
        parentId,
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
          salaryMin: pos.salaryMin,
          salaryMax: pos.salaryMax,
          salaryCurrency: pos.salaryCurrency,
          salaryFrequency: pos.salaryFrequency,
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
          // Load user fullname if not vacant
          let displayTitle = "Vacant";
          if (!appt.isVacant && appt.userId) {
            try {
              const user = (await usersDB.get(appt.userId)) as User;
              displayTitle = user.fullname || `User ${appt.userId}`;
            } catch (error) {
              displayTitle = `User ${appt.userId}`;
            }
          }

          rows.push({
            _id: appt._id,
            _rev: appt._rev,
            type: "appointment",
            companyId,
            title: displayTitle,
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
