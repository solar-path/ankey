/**
 * OrgChart Approval Service
 * Handles approval workflow for organizational charts
 */

import { orgchartsDB } from "@/modules/shared/database/db";
import { userCompaniesDB, companiesDB } from "@/modules/shared/database/db";
import type { OrgChart } from "./orgchart.types";

export interface ApprovalWorkflow {
  _id: string;
  _rev?: string;
  type: "approval_workflow";
  companyId: string;

  // Entity being approved
  entityType: "orgchart";
  entityId: string; // orgchart ID without partition prefix

  // Workflow status
  status: "pending" | "approved" | "declined";

  // Participants
  initiatorId: string; // User who submitted for approval
  approverId: string; // User who needs to approve (owner)

  // Approval data
  submittedAt: number;
  respondedAt?: number;
  comments?: string; // Comments from approver

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

export interface ApprovalTask {
  _id: string;
  _rev?: string;
  type: "task";
  companyId: string;

  // Task details
  taskType: "approval_pending" | "approval_response";
  userId: string; // Task assignee

  // Related workflow
  workflowId: string;
  entityType: "orgchart";
  entityId: string;

  // Task status
  completed: boolean;
  completedAt?: number;

  // Task content
  title: string;
  description: string;
  priority: "low" | "medium" | "high";

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

export class OrgChartApprovalService {
  /**
   * Get company owner (first user associated with company)
   */
  private static async getCompanyOwner(companyId: string): Promise<string | null> {
    try {
      const result = await userCompaniesDB.find({
        selector: {
          companyId,
          role: "owner",
          type: "user_company"
        },
        limit: 1
      });

      if (result.docs.length === 0) {
        // Fallback: get first user with any role
        const fallbackResult = await userCompaniesDB.find({
          selector: {
            companyId,
            type: "user_company"
          },
          limit: 1
        });

        return fallbackResult.docs[0]?.userId || null;
      }

      return result.docs[0].userId;
    } catch (error) {
      console.error("[OrgChartApprovalService] Failed to get company owner:", error);
      return null;
    }
  }

  /**
   * Get company details
   */
  private static async getCompanyDetails(companyId: string): Promise<{ title: string } | null> {
    try {
      const doc = await companiesDB.get(companyId);
      return doc.type === "company" ? { title: doc.title } : null;
    } catch (error) {
      console.error("[OrgChartApprovalService] Failed to get company details:", error);
      return null;
    }
  }

  /**
   * Submit orgchart for approval
   */
  static async submitForApproval(
    companyId: string,
    orgChartId: string,
    initiatorId: string
  ): Promise<{ workflow: ApprovalWorkflow; tasks: ApprovalTask[] }> {
    const now = Date.now();

    // Get orgchart
    const partitionKey = `company:${companyId}:${orgChartId}`;
    const orgChart = await orgchartsDB.get(partitionKey) as OrgChart;

    if (!orgChart || orgChart.type !== "orgchart") {
      throw new Error("OrgChart not found");
    }

    if (orgChart.status !== "draft") {
      throw new Error("Only draft orgcharts can be submitted for approval");
    }

    // Get company owner
    const ownerId = await this.getCompanyOwner(companyId);
    if (!ownerId) {
      throw new Error("Company owner not found");
    }

    // Get company details
    const company = await this.getCompanyDetails(companyId);
    const companyTitle = company?.title || "Company";

    // Create workflow
    const workflowId = `workflow_${orgChartId}_${now}`;
    const workflow: ApprovalWorkflow = {
      _id: `company:${companyId}:${workflowId}`,
      type: "approval_workflow",
      companyId,
      entityType: "orgchart",
      entityId: orgChartId,
      status: "pending",
      initiatorId,
      approverId: ownerId,
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    // Create tasks
    const tasks: ApprovalTask[] = [
      // Task for initiator (pending approval)
      {
        _id: `company:${companyId}:task_initiator_${workflowId}`,
        type: "task",
        companyId,
        taskType: "approval_pending",
        userId: initiatorId,
        workflowId,
        entityType: "orgchart",
        entityId: orgChartId,
        completed: false,
        title: `Org Chart Approval Pending - ${orgChart.title}`,
        description: `Your organizational chart "${orgChart.title}" (v${orgChart.version}) has been submitted for approval and is pending review.`,
        priority: "medium",
        createdAt: now,
        updatedAt: now,
      },
      // Task for owner (approval request)
      {
        _id: `company:${companyId}:task_approver_${workflowId}`,
        type: "task",
        companyId,
        taskType: "approval_pending",
        userId: ownerId,
        workflowId,
        entityType: "orgchart",
        entityId: orgChartId,
        completed: false,
        title: `Approve Org Chart - ${orgChart.title}`,
        description: `Please review and approve the organizational chart "${orgChart.title}" (v${orgChart.version}) for ${companyTitle}.`,
        priority: "high",
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Update orgchart status
    orgChart.status = "pending_approval";
    orgChart.submittedForApprovalAt = now;
    orgChart.submittedForApprovalBy = initiatorId;
    orgChart.updatedAt = now;
    orgChart.updatedBy = initiatorId;

    // Save to database
    await orgchartsDB.put(orgChart);
    await orgchartsDB.put(workflow as any);
    for (const task of tasks) {
      await orgchartsDB.put(task as any);
    }

    return { workflow, tasks };
  }

  /**
   * Approve orgchart
   */
  static async approveOrgChart(
    companyId: string,
    workflowId: string,
    approverId: string,
    comments?: string
  ): Promise<void> {
    const now = Date.now();
    const partitionKey = `company:${companyId}:${workflowId}`;

    // Get workflow
    const workflow = await orgchartsDB.get(partitionKey) as ApprovalWorkflow;
    if (!workflow || workflow.type !== "approval_workflow") {
      throw new Error("Workflow not found");
    }

    if (workflow.status !== "pending") {
      throw new Error("Workflow is not pending approval");
    }

    if (workflow.approverId !== approverId) {
      throw new Error("You are not authorized to approve this workflow");
    }

    // Update workflow
    workflow.status = "approved";
    workflow.respondedAt = now;
    workflow.comments = comments;
    workflow.updatedAt = now;

    // Get orgchart
    const orgChartKey = `company:${companyId}:${workflow.entityId}`;
    const orgChart = await orgchartsDB.get(orgChartKey) as OrgChart;

    // Update orgchart status
    orgChart.status = "approved";
    orgChart.approvedAt = now;
    orgChart.approvedBy = approverId;
    orgChart.enforcedAt = now; // Set enforcement date
    orgChart.updatedAt = now;
    orgChart.updatedBy = approverId;

    // Complete approver task
    const approverTaskId = `company:${companyId}:task_approver_${workflowId}`;
    try {
      const approverTask = await orgchartsDB.get(approverTaskId) as ApprovalTask;
      approverTask.completed = true;
      approverTask.completedAt = now;
      approverTask.updatedAt = now;
      await orgchartsDB.put(approverTask as any);
    } catch (error) {
      console.warn("[OrgChartApprovalService] Approver task not found");
    }

    // Update initiator task
    const initiatorTaskId = `company:${companyId}:task_initiator_${workflowId}`;
    try {
      const initiatorTask = await orgchartsDB.get(initiatorTaskId) as ApprovalTask;
      initiatorTask.title = `Org Chart Approved - ${orgChart.title}`;
      initiatorTask.description = `Your organizational chart "${orgChart.title}" (v${orgChart.version}) has been approved.${comments ? `\n\nComments: ${comments}` : ""}`;
      initiatorTask.taskType = "approval_response";
      initiatorTask.completed = false; // Needs to be acknowledged
      initiatorTask.updatedAt = now;
      await orgchartsDB.put(initiatorTask as any);
    } catch (error) {
      console.warn("[OrgChartApprovalService] Initiator task not found");
    }

    // Revoke all other approved orgcharts for this company
    const allOrgCharts = await orgchartsDB.find({
      selector: {
        _id: {
          $gte: `company:${companyId}:`,
          $lte: `company:${companyId}:\ufff0`,
        },
        type: "orgchart",
        status: "approved",
      },
    });

    for (const doc of allOrgCharts.docs) {
      const chart = doc as OrgChart;
      if (chart._id !== orgChartKey) {
        chart.status = "revoked";
        chart.revokedAt = now;
        chart.updatedAt = now;
        chart.updatedBy = approverId;
        await orgchartsDB.put(chart);
      }
    }

    // Save workflow and orgchart
    await orgchartsDB.put(workflow as any);
    await orgchartsDB.put(orgChart);
  }

  /**
   * Decline orgchart
   */
  static async declineOrgChart(
    companyId: string,
    workflowId: string,
    approverId: string,
    comments: string
  ): Promise<void> {
    const now = Date.now();
    const partitionKey = `company:${companyId}:${workflowId}`;

    if (!comments || comments.trim().length === 0) {
      throw new Error("Comments are required when declining");
    }

    // Get workflow
    const workflow = await orgchartsDB.get(partitionKey) as ApprovalWorkflow;
    if (!workflow || workflow.type !== "approval_workflow") {
      throw new Error("Workflow not found");
    }

    if (workflow.status !== "pending") {
      throw new Error("Workflow is not pending approval");
    }

    if (workflow.approverId !== approverId) {
      throw new Error("You are not authorized to decline this workflow");
    }

    // Update workflow
    workflow.status = "declined";
    workflow.respondedAt = now;
    workflow.comments = comments;
    workflow.updatedAt = now;

    // Get orgchart
    const orgChartKey = `company:${companyId}:${workflow.entityId}`;
    const orgChart = await orgchartsDB.get(orgChartKey) as OrgChart;

    // Update orgchart status back to draft
    orgChart.status = "draft";
    orgChart.updatedAt = now;
    orgChart.updatedBy = approverId;

    // Complete approver task
    const approverTaskId = `company:${companyId}:task_approver_${workflowId}`;
    try {
      const approverTask = await orgchartsDB.get(approverTaskId) as ApprovalTask;
      approverTask.completed = true;
      approverTask.completedAt = now;
      approverTask.updatedAt = now;
      await orgchartsDB.put(approverTask as any);
    } catch (error) {
      console.warn("[OrgChartApprovalService] Approver task not found");
    }

    // Update initiator task
    const initiatorTaskId = `company:${companyId}:task_initiator_${workflowId}`;
    try {
      const initiatorTask = await orgchartsDB.get(initiatorTaskId) as ApprovalTask;
      initiatorTask.title = `Org Chart Declined - ${orgChart.title}`;
      initiatorTask.description = `Your organizational chart "${orgChart.title}" (v${orgChart.version}) has been declined.\n\nComments: ${comments}`;
      initiatorTask.taskType = "approval_response";
      initiatorTask.priority = "high";
      initiatorTask.completed = false; // Needs to be acknowledged
      initiatorTask.updatedAt = now;
      await orgchartsDB.put(initiatorTask as any);
    } catch (error) {
      console.warn("[OrgChartApprovalService] Initiator task not found");
    }

    // Save workflow and orgchart
    await orgchartsDB.put(workflow as any);
    await orgchartsDB.put(orgChart);
  }

  /**
   * Get workflow for orgchart
   */
  static async getWorkflowForOrgChart(
    companyId: string,
    orgChartId: string
  ): Promise<ApprovalWorkflow | null> {
    try {
      const result = await orgchartsDB.find({
        selector: {
          _id: {
            $gte: `company:${companyId}:workflow_${orgChartId}`,
            $lte: `company:${companyId}:workflow_${orgChartId}\ufff0`,
          },
          type: "approval_workflow",
          entityId: orgChartId,
        },
      });

      // Sort manually and return first
      const sorted = (result.docs as ApprovalWorkflow[]).sort((a, b) => b.createdAt - a.createdAt);
      return sorted[0] || null;
    } catch (error) {
      console.error("[OrgChartApprovalService] Failed to get workflow:", error);
      return null;
    }
  }

  /**
   * Get tasks for user
   */
  static async getUserTasks(companyId: string, userId: string): Promise<ApprovalTask[]> {
    try {
      const result = await orgchartsDB.find({
        selector: {
          _id: {
            $gte: `company:${companyId}:`,
            $lte: `company:${companyId}:\ufff0`,
          },
          type: "task",
          userId,
          completed: false,
        },
      });

      return result.docs as ApprovalTask[];
    } catch (error) {
      console.error("[OrgChartApprovalService] Failed to get user tasks:", error);
      return [];
    }
  }

  /**
   * Mark task as complete (acknowledge response)
   */
  static async completeTask(companyId: string, taskId: string): Promise<void> {
    const now = Date.now();
    const partitionKey = taskId.startsWith("company:") ? taskId : `company:${companyId}:${taskId}`;

    const task = await orgchartsDB.get(partitionKey) as ApprovalTask;
    if (!task || task.type !== "task") {
      throw new Error("Task not found");
    }

    task.completed = true;
    task.completedAt = now;
    task.updatedAt = now;

    await orgchartsDB.put(task as any);
  }
}
