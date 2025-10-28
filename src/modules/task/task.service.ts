import { tasksDB } from "@/modules/shared/database/db";
import type { TaskInput, Assignee, Approver, Attachment } from "./task.valibot";
import * as v from "valibot";
import { taskSchema } from "./task.valibot";

export interface Task {
  _id: string;
  _rev?: string;
  type: "manual_task";
  creatorId: string; // User who created the task
  tenantId: string;
  title: string;
  description: string;
  deadline: string;
  assignees: Assignee[]; // Responsible persons/positions/departments
  approvers?: Approver[]; // Users who must approve task completion
  attachments?: Attachment[]; // File attachments (max 5MB total)
  completed: boolean;
  approvalStatus?: "pending" | "approved" | "rejected"; // If approvers exist
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export class TaskService {
  /**
   * Create a new manual task
   */
  static async createTask(
    creatorId: string,
    tenantId: string,
    input: TaskInput
  ): Promise<Task> {
    // Validate input
    const validated = v.parse(taskSchema, input);

    // Validate total attachment size (max 5MB)
    if (validated.attachments) {
      const totalSize = validated.attachments.reduce((sum, att) => sum + att.size, 0);
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (totalSize > maxSize) {
        throw new Error("Total attachment size exceeds 5MB limit");
      }
    }

    const now = new Date().toISOString();
    const task: Task = {
      _id: `task:${tenantId}:manual_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: "manual_task",
      creatorId,
      tenantId,
      title: validated.title,
      description: validated.description,
      deadline: validated.deadline,
      assignees: validated.assignees,
      approvers: validated.approvers,
      attachments: validated.attachments,
      completed: false,
      approvalStatus: validated.approvers && validated.approvers.length > 0 ? "pending" : undefined,
      createdAt: now,
      updatedAt: now,
    };

    await tasksDB.put(task);
    return task;
  }

  /**
   * Get a task by ID
   */
  static async getTask(taskId: string): Promise<Task> {
    try {
      const task = await tasksDB.get(taskId);
      return task as Task;
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error("Task not found");
      }
      throw error;
    }
  }

  /**
   * Update an existing task
   */
  static async updateTask(
    taskId: string,
    input: Partial<TaskInput>
  ): Promise<Task> {
    const task = await this.getTask(taskId);

    // Only allow updating manual tasks
    if (task.type !== "manual_task") {
      throw new Error("Cannot edit system-generated tasks");
    }

    // Validate attachments size if provided
    if (input.attachments) {
      const totalSize = input.attachments.reduce((sum, att) => sum + att.size, 0);
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (totalSize > maxSize) {
        throw new Error("Total attachment size exceeds 5MB limit");
      }
    }

    // Update fields
    if (input.title !== undefined) {
      task.title = input.title;
    }
    if (input.description !== undefined) {
      task.description = input.description;
    }
    if (input.deadline !== undefined) {
      task.deadline = input.deadline;
    }
    if (input.assignees !== undefined) {
      task.assignees = input.assignees;
    }
    if (input.approvers !== undefined) {
      task.approvers = input.approvers;
      task.approvalStatus = input.approvers.length > 0 ? "pending" : undefined;
    }
    if (input.attachments !== undefined) {
      task.attachments = input.attachments;
    }

    task.updatedAt = new Date().toISOString();

    await tasksDB.put(task);
    return task;
  }

  /**
   * Delete a task
   */
  static async deleteTask(taskId: string): Promise<void> {
    const task = await this.getTask(taskId);

    // Only allow deleting manual tasks
    if (task.type !== "manual_task") {
      throw new Error("Cannot delete system-generated tasks");
    }

    await tasksDB.remove(task);
  }

  /**
   * Mark task as completed
   */
  static async completeTask(taskId: string): Promise<Task> {
    const task = await this.getTask(taskId);
    task.completed = true;
    task.updatedAt = new Date().toISOString();
    await tasksDB.put(task);
    return task;
  }

  /**
   * Mark task as incomplete
   */
  static async uncompleteTask(taskId: string): Promise<Task> {
    const task = await this.getTask(taskId);
    task.completed = false;
    task.updatedAt = new Date().toISOString();
    await tasksDB.put(task);
    return task;
  }

  /**
   * Approve task (by approver)
   */
  static async approveTask(taskId: string, approverId: string): Promise<Task> {
    const task = await this.getTask(taskId);

    if (!task.approvers || task.approvers.length === 0) {
      throw new Error("This task does not require approval");
    }

    // Check if user is an approver
    const isApprover = task.approvers.some(a => a.userId === approverId);
    if (!isApprover) {
      throw new Error("You are not authorized to approve this task");
    }

    task.approvalStatus = "approved";
    task.updatedAt = new Date().toISOString();
    await tasksDB.put(task);
    return task;
  }

  /**
   * Reject task (by approver)
   */
  static async rejectTask(taskId: string, approverId: string): Promise<Task> {
    const task = await this.getTask(taskId);

    if (!task.approvers || task.approvers.length === 0) {
      throw new Error("This task does not require approval");
    }

    // Check if user is an approver
    const isApprover = task.approvers.some(a => a.userId === approverId);
    if (!isApprover) {
      throw new Error("You are not authorized to reject this task");
    }

    task.approvalStatus = "rejected";
    task.updatedAt = new Date().toISOString();
    await tasksDB.put(task);
    return task;
  }

  /**
   * Get all tasks for a user in a specific company
   */
  static async getUserTasks(
    userId: string,
    tenantId: string
  ): Promise<Task[]> {
    try {
      const result = await tasksDB.find({
        selector: {
          type: "manual_task",
          tenantId,
        },
        sort: [{ createdAt: "desc" }],
      });

      // Filter tasks where user is creator, assignee, or approver
      const userTasks = result.docs.filter((task: Task) => {
        if (task.creatorId === userId) return true;
        if (task.assignees.some(a => a.type === "user" && a.id === userId)) return true;
        if (task.approvers && task.approvers.some(a => a.userId === userId)) return true;
        return false;
      });

      return userTasks as Task[];
    } catch (error) {
      console.error("Failed to get user tasks:", error);
      return [];
    }
  }

  /**
   * Get pending tasks for a user in a specific company
   */
  static async getPendingTasks(
    userId: string,
    tenantId: string
  ): Promise<Task[]> {
    const allTasks = await this.getUserTasks(userId, tenantId);
    return allTasks.filter(task => !task.completed);
  }
}
