/**
 * Document Approval Service
 *
 * Unified approval system for all document types.
 * Uses DOA matrices to determine approval flow.
 */

import { orgchartsDB, userCompaniesDB, companiesDB } from "@/modules/shared/database/db";
import type {
  ApprovalWorkflow,
  ApprovalTask,
  ApprovalMatrix,
  ApprovalDecision,
  DocumentType,
} from "@/modules/shared/database/db";
import { DOAService } from "@/modules/doa/doa.service";

export interface DocumentMetadata {
  id: string; // Document ID without partition prefix
  type: DocumentType;
  title: string;
  version?: number;
}

export class DocumentApprovalService {
  /**
   * Get company owner (first user associated with company)
   */
  private static async getCompanyOwner(companyId: string): Promise<string | null> {
    try {
      const result = await userCompaniesDB.find({
        selector: {
          companyId,
          role: "owner",
          type: "user_company",
        },
        limit: 1,
      });

      if (result.docs.length === 0) {
        // Fallback: get first user with any role
        const fallbackResult = await userCompaniesDB.find({
          selector: {
            companyId,
            type: "user_company",
          },
          limit: 1,
        });

        return fallbackResult.docs[0]?.userId || null;
      }

      return result.docs[0].userId;
    } catch (error) {
      console.error("[DocumentApprovalService] Failed to get company owner:", error);
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
      console.error("[DocumentApprovalService] Failed to get company details:", error);
      return null;
    }
  }

  /**
   * Submit document for approval
   */
  static async submitForApproval(
    companyId: string,
    document: DocumentMetadata,
    initiatorId: string
  ): Promise<{ workflow: ApprovalWorkflow; tasks: ApprovalTask[] }> {
    const now = Date.now();

    // Get active DOA matrix for this document type
    let matrix = await DOAService.getActiveMatrixForType(companyId, document.type);

    // If no matrix exists, create default matrix with company owner
    if (!matrix) {
      const ownerId = await this.getCompanyOwner(companyId);
      if (!ownerId) {
        throw new Error("Company owner not found");
      }

      matrix = await DOAService.createMatrix(
        companyId,
        {
          name: `Default ${document.type} Approval`,
          documentType: document.type,
          status: "active",
          approvalBlocks: [
            {
              level: 1,
              approvers: [ownerId],
              requiresAll: true,
            },
          ],
        },
        initiatorId
      );
    }

    // Validate matrix has approval blocks
    if (!matrix.approvalBlocks || matrix.approvalBlocks.length === 0) {
      throw new Error("Approval matrix has no approval blocks");
    }

    // Get company details
    const company = await this.getCompanyDetails(companyId);
    const companyTitle = company?.title || "Company";

    // Create workflow
    const workflowId = `workflow_${document.type}_${document.id}_${now}`;
    const workflow: ApprovalWorkflow = {
      _id: `company:${companyId}:${workflowId}`,
      type: "approval_workflow",
      companyId,
      entityType: document.type,
      entityId: document.id,
      status: "pending",
      currentLevel: 1,
      matrixId: matrix._id,
      initiatorId,
      decisions: [],
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    // Get approvers for first level
    const firstBlock = matrix.approvalBlocks[0];
    const approvers = firstBlock.approvers;

    // Create tasks
    const tasks: ApprovalTask[] = [];

    // Task for initiator (pending approval)
    tasks.push({
      _id: `company:${companyId}:task_${initiatorId}_${workflowId}_initiator`,
      type: "task",
      companyId,
      taskType: "approval_response",
      userId: initiatorId,
      workflowId,
      entityType: document.type,
      entityId: document.id,
      completed: false,
      title: `Approval Pending - ${document.title}`,
      description: `Your document "${document.title}" has been submitted for approval and is pending review.`,
      priority: "medium",
      createdAt: now,
      updatedAt: now,
    });

    // Tasks for approvers
    for (const approverId of approvers) {
      tasks.push({
        _id: `company:${companyId}:task_${approverId}_${workflowId}_level1`,
        type: "task",
        companyId,
        taskType: "approval_request",
        userId: approverId,
        workflowId,
        entityType: document.type,
        entityId: document.id,
        completed: false,
        title: `Approve ${this.getDocumentTypeName(document.type)} - ${document.title}`,
        description: `Please review and approve the ${this.getDocumentTypeName(document.type).toLowerCase()} "${document.title}" for ${companyTitle}.`,
        priority: "high",
        createdAt: now,
        updatedAt: now,
      });
    }

    // Save to database
    await orgchartsDB.put(workflow as any);
    for (const task of tasks) {
      await orgchartsDB.put(task as any);
    }

    return { workflow, tasks };
  }

  /**
   * Approve document at current level
   */
  static async approve(
    companyId: string,
    workflowId: string,
    userId: string,
    comments?: string
  ): Promise<{ workflow: ApprovalWorkflow; nextLevelTasks?: ApprovalTask[] }> {
    const now = Date.now();
    const partitionKey = workflowId.startsWith("company:")
      ? workflowId
      : `company:${companyId}:${workflowId}`;

    // Get workflow
    const workflow = (await orgchartsDB.get(partitionKey)) as ApprovalWorkflow;
    if (!workflow || workflow.type !== "approval_workflow") {
      throw new Error("Workflow not found");
    }

    if (workflow.status !== "pending") {
      throw new Error("Workflow is not pending approval");
    }

    // Get matrix
    const matrix = await orgchartsDB.get(workflow.matrixId) as ApprovalMatrix;
    if (!matrix || matrix.type !== "approval_matrix") {
      throw new Error("Approval matrix not found");
    }

    const currentBlock = matrix.approvalBlocks.find((b) => b.level === workflow.currentLevel);
    if (!currentBlock) {
      throw new Error("Invalid approval level");
    }

    // Verify user is an approver at this level
    if (!currentBlock.approvers.includes(userId)) {
      throw new Error("You are not authorized to approve at this level");
    }

    // Check if user already approved
    const existingDecision = workflow.decisions.find(
      (d) => d.userId === userId && d.level === workflow.currentLevel
    );
    if (existingDecision) {
      throw new Error("You have already approved this document");
    }

    // Add approval decision
    const decision: ApprovalDecision = {
      userId,
      level: workflow.currentLevel,
      decision: "approved",
      comments,
      timestamp: now,
    };
    workflow.decisions.push(decision);

    // Check if current level is complete
    const approvalsAtLevel = workflow.decisions.filter(
      (d) => d.level === workflow.currentLevel && d.decision === "approved"
    ).length;

    const isLevelComplete = currentBlock.requiresAll
      ? approvalsAtLevel === currentBlock.approvers.length
      : approvalsAtLevel >= (currentBlock.minApprovals || 1);

    let nextLevelTasks: ApprovalTask[] | undefined;

    if (isLevelComplete) {
      // Complete current level tasks
      for (const approverId of currentBlock.approvers) {
        const taskId = `company:${companyId}:task_${approverId}_${workflowId.replace(`company:${companyId}:`, "")}_level${workflow.currentLevel}`;
        try {
          const task = (await orgchartsDB.get(taskId)) as ApprovalTask;
          task.completed = true;
          task.completedAt = now;
          task.updatedAt = now;
          await orgchartsDB.put(task as any);
        } catch (error) {
          console.warn(`[DocumentApprovalService] Task not found: ${taskId}`);
        }
      }

      // Check if there are more levels
      const nextLevel = workflow.currentLevel + 1;
      const nextBlock = matrix.approvalBlocks.find((b) => b.level === nextLevel);

      if (nextBlock) {
        // Move to next level
        workflow.currentLevel = nextLevel;
        workflow.updatedAt = now;

        // Create tasks for next level approvers
        nextLevelTasks = [];
        for (const approverId of nextBlock.approvers) {
          const task: ApprovalTask = {
            _id: `company:${companyId}:task_${approverId}_${workflowId.replace(`company:${companyId}:`, "")}_level${nextLevel}`,
            type: "task",
            companyId,
            taskType: "approval_request",
            userId: approverId,
            workflowId: workflowId.replace(`company:${companyId}:`, ""),
            entityType: workflow.entityType,
            entityId: workflow.entityId,
            completed: false,
            title: `Approve ${this.getDocumentTypeName(workflow.entityType)} (Level ${nextLevel})`,
            description: `Please review and approve this ${this.getDocumentTypeName(workflow.entityType).toLowerCase()}.`,
            priority: "high",
            createdAt: now,
            updatedAt: now,
          };
          nextLevelTasks.push(task);
          await orgchartsDB.put(task as any);
        }
      } else {
        // All levels complete - workflow approved
        workflow.status = "approved";
        workflow.completedAt = now;
        workflow.updatedAt = now;

        // Update initiator task
        const initiatorTaskId = `company:${companyId}:task_${workflow.initiatorId}_${workflowId.replace(`company:${companyId}:`, "")}_initiator`;
        try {
          const initiatorTask = (await orgchartsDB.get(initiatorTaskId)) as ApprovalTask;
          initiatorTask.title = `Document Approved`;
          initiatorTask.description = `Your document has been fully approved.${comments ? `\n\nFinal comments: ${comments}` : ""}`;
          initiatorTask.completed = false; // Needs acknowledgment
          initiatorTask.updatedAt = now;
          await orgchartsDB.put(initiatorTask as any);
        } catch (error) {
          console.warn("[DocumentApprovalService] Initiator task not found");
        }
      }
    } else {
      // Level not complete yet, just update workflow
      workflow.updatedAt = now;
    }

    // Save workflow
    await orgchartsDB.put(workflow as any);

    return { workflow, nextLevelTasks };
  }

  /**
   * Decline document
   */
  static async decline(
    companyId: string,
    workflowId: string,
    userId: string,
    comments: string
  ): Promise<ApprovalWorkflow> {
    const now = Date.now();
    const partitionKey = workflowId.startsWith("company:")
      ? workflowId
      : `company:${companyId}:${workflowId}`;

    if (!comments || comments.trim().length === 0) {
      throw new Error("Comments are required when declining");
    }

    // Get workflow
    const workflow = (await orgchartsDB.get(partitionKey)) as ApprovalWorkflow;
    if (!workflow || workflow.type !== "approval_workflow") {
      throw new Error("Workflow not found");
    }

    if (workflow.status !== "pending") {
      throw new Error("Workflow is not pending approval");
    }

    // Get matrix
    const matrix = await orgchartsDB.get(workflow.matrixId) as ApprovalMatrix;
    if (!matrix || matrix.type !== "approval_matrix") {
      throw new Error("Approval matrix not found");
    }

    const currentBlock = matrix.approvalBlocks.find((b) => b.level === workflow.currentLevel);
    if (!currentBlock) {
      throw new Error("Invalid approval level");
    }

    // Verify user is an approver at this level
    if (!currentBlock.approvers.includes(userId)) {
      throw new Error("You are not authorized to decline at this level");
    }

    // Add decline decision
    const decision: ApprovalDecision = {
      userId,
      level: workflow.currentLevel,
      decision: "declined",
      comments,
      timestamp: now,
    };
    workflow.decisions.push(decision);

    // Update workflow status
    workflow.status = "declined";
    workflow.completedAt = now;
    workflow.updatedAt = now;

    // Complete all pending approval tasks
    for (const approverId of currentBlock.approvers) {
      const taskId = `company:${companyId}:task_${approverId}_${workflowId.replace(`company:${companyId}:`, "")}_level${workflow.currentLevel}`;
      try {
        const task = (await orgchartsDB.get(taskId)) as ApprovalTask;
        task.completed = true;
        task.completedAt = now;
        task.updatedAt = now;
        await orgchartsDB.put(task as any);
      } catch (error) {
        console.warn(`[DocumentApprovalService] Task not found: ${taskId}`);
      }
    }

    // Update initiator task
    const initiatorTaskId = `company:${companyId}:task_${workflow.initiatorId}_${workflowId.replace(`company:${companyId}:`, "")}_initiator`;
    try {
      const initiatorTask = (await orgchartsDB.get(initiatorTaskId)) as ApprovalTask;
      initiatorTask.title = `Document Declined`;
      initiatorTask.description = `Your document has been declined.\n\nComments: ${comments}`;
      initiatorTask.priority = "high";
      initiatorTask.completed = false; // Needs acknowledgment
      initiatorTask.updatedAt = now;
      await orgchartsDB.put(initiatorTask as any);
    } catch (error) {
      console.warn("[DocumentApprovalService] Initiator task not found");
    }

    // Save workflow
    await orgchartsDB.put(workflow as any);

    return workflow;
  }

  /**
   * Get workflow for document
   */
  static async getWorkflowForDocument(
    companyId: string,
    documentType: DocumentType,
    documentId: string
  ): Promise<ApprovalWorkflow | null> {
    try {
      const result = await orgchartsDB.find({
        selector: {
          _id: {
            $gte: `company:${companyId}:workflow_${documentType}_${documentId}`,
            $lte: `company:${companyId}:workflow_${documentType}_${documentId}\ufff0`,
          },
          type: "approval_workflow",
          entityType: documentType,
          entityId: documentId,
        },
      });

      // Sort manually and return first
      const sorted = (result.docs as ApprovalWorkflow[]).sort((a, b) => b.createdAt - a.createdAt);
      return sorted[0] || null;
    } catch (error) {
      console.error("[DocumentApprovalService] Failed to get workflow:", error);
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
      console.error("[DocumentApprovalService] Failed to get user tasks:", error);
      return [];
    }
  }

  /**
   * Mark task as complete (acknowledge response)
   */
  static async completeTask(companyId: string, taskId: string): Promise<void> {
    const now = Date.now();
    const partitionKey = taskId.startsWith("company:") ? taskId : `company:${companyId}:${taskId}`;

    const task = (await orgchartsDB.get(partitionKey)) as ApprovalTask;
    if (!task || task.type !== "task") {
      throw new Error("Task not found");
    }

    task.completed = true;
    task.completedAt = now;
    task.updatedAt = now;

    await orgchartsDB.put(task as any);
  }

  /**
   * Get human-readable document type name
   */
  private static getDocumentTypeName(type: DocumentType): string {
    const names: Record<DocumentType, string> = {
      department_charter: "Department Charter",
      job_description: "Job Description",
      job_offer: "Job Offer",
      employment_contract: "Employment Contract",
      termination_notice: "Termination Notice",
      orgchart: "Organizational Chart",
    };
    return names[type] || type;
  }
}
