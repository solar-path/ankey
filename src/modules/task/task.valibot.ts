import * as v from "valibot";

// Assignee can be a user, position, or department
export const assigneeSchema = v.object({
  type: v.picklist(["user", "position", "department"]),
  id: v.string(),
  name: v.string(), // Display name
});

// Approver - user who must approve task completion
export const approverSchema = v.object({
  userId: v.string(),
  name: v.string(), // Display name
  order: v.number(), // Approval order (1, 2, 3...)
});

// Attachment
export const attachmentSchema = v.object({
  name: v.string(),
  size: v.number(),
  type: v.string(),
  data: v.string(), // base64 encoded
});

export const taskSchema = v.object({
  title: v.pipe(
    v.string("Title is required"),
    v.minLength(1, "Title is required"),
    v.maxLength(200, "Title must be less than 200 characters")
  ),
  description: v.pipe(
    v.string("Description is required"),
    v.minLength(1, "Description is required"),
    v.maxLength(2000, "Description must be less than 2000 characters")
  ),
  deadline: v.pipe(
    v.string("Deadline is required"),
    v.minLength(1, "Deadline is required")
  ),
  assignees: v.pipe(
    v.array(assigneeSchema),
    v.minLength(1, "At least one assignee is required")
  ),
  approvers: v.optional(v.array(approverSchema)),
  attachments: v.optional(v.array(attachmentSchema)),
});

export type TaskInput = v.InferOutput<typeof taskSchema>;
export type Assignee = v.InferOutput<typeof assigneeSchema>;
export type Approver = v.InferOutput<typeof approverSchema>;
export type Attachment = v.InferOutput<typeof attachmentSchema>;
