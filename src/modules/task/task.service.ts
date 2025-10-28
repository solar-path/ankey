/**
 * Task Service
 *
 * ⚠️ MIGRATION NEEDED: This module needs PostgreSQL migration
 * TODO: Migrate to PostgreSQL-centered architecture following ARCHITECTURE.md
 * - Create src/modules/task/task.sql with PostgreSQL functions
 * - Update this service to thin client pattern (API calls only)
 * - Remove direct database access
 *
 * TEMPORARY: All methods return empty/placeholder data until migration is complete
 */

import type { TaskInput, Assignee, Approver, Attachment } from "./task.valibot";

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
   * TODO: Implement via PostgreSQL function call
   */
  static async createTask(
    _creatorId: string,
    _tenantId: string,
    _input: TaskInput
  ): Promise<Task> {
    console.warn("[TaskService] createTask: Not implemented - awaiting PostgreSQL migration");
    throw new Error("Task module not yet migrated to PostgreSQL");
  }

  /**
   * Get a task by ID
   * TODO: Implement via PostgreSQL function call
   */
  static async getTask(_taskId: string): Promise<Task> {
    console.warn("[TaskService] getTask: Not implemented - awaiting PostgreSQL migration");
    throw new Error("Task module not yet migrated to PostgreSQL");
  }

  /**
   * Update an existing task
   * TODO: Implement via PostgreSQL function call
   */
  static async updateTask(
    _taskId: string,
    _input: Partial<TaskInput>
  ): Promise<Task> {
    console.warn("[TaskService] updateTask: Not implemented - awaiting PostgreSQL migration");
    throw new Error("Task module not yet migrated to PostgreSQL");
  }

  /**
   * Delete a task
   * TODO: Implement via PostgreSQL function call
   */
  static async deleteTask(_taskId: string): Promise<void> {
    console.warn("[TaskService] deleteTask: Not implemented - awaiting PostgreSQL migration");
    throw new Error("Task module not yet migrated to PostgreSQL");
  }

  /**
   * Mark task as completed
   * TODO: Implement via PostgreSQL function call
   */
  static async completeTask(_taskId: string): Promise<Task> {
    console.warn("[TaskService] completeTask: Not implemented - awaiting PostgreSQL migration");
    throw new Error("Task module not yet migrated to PostgreSQL");
  }

  /**
   * Mark task as incomplete
   * TODO: Implement via PostgreSQL function call
   */
  static async uncompleteTask(_taskId: string): Promise<Task> {
    console.warn("[TaskService] uncompleteTask: Not implemented - awaiting PostgreSQL migration");
    throw new Error("Task module not yet migrated to PostgreSQL");
  }

  /**
   * Approve task (by approver)
   * TODO: Implement via PostgreSQL function call
   */
  static async approveTask(_taskId: string, _approverId: string): Promise<Task> {
    console.warn("[TaskService] approveTask: Not implemented - awaiting PostgreSQL migration");
    throw new Error("Task module not yet migrated to PostgreSQL");
  }

  /**
   * Reject task (by approver)
   * TODO: Implement via PostgreSQL function call
   */
  static async rejectTask(_taskId: string, _approverId: string): Promise<Task> {
    console.warn("[TaskService] rejectTask: Not implemented - awaiting PostgreSQL migration");
    throw new Error("Task module not yet migrated to PostgreSQL");
  }

  /**
   * Get all tasks for a user in a specific company
   * TODO: Implement via PostgreSQL function call
   */
  static async getUserTasks(
    _userId: string,
    _tenantId: string
  ): Promise<Task[]> {
    console.warn("[TaskService] getUserTasks: Not implemented - awaiting PostgreSQL migration");
    return [];
  }

  /**
   * Get pending tasks for a user in a specific company
   * TODO: Implement via PostgreSQL function call
   */
  static async getPendingTasks(
    _userId: string,
    _tenantId: string
  ): Promise<Task[]> {
    console.warn("[TaskService] getPendingTasks: Not implemented - awaiting PostgreSQL migration");
    return [];
  }
}
