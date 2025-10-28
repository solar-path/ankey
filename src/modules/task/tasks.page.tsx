import { useEffect, useState, useMemo } from "react";
import { useBreadcrumb } from "@/lib/breadcrumb-context";
import { useAuth } from "@/lib/auth-context";
import { useCompanyOptional } from "@/lib/company-context";
import { QTable, SortableHeader, RowActionsDropdown } from "@/lib/ui/QTable.ui";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/lib/ui/badge";
import { Button } from "@/lib/ui/button";
import { AlertCircle, CheckCircle2, Plus, Edit, Trash2, Check, X } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/lib/ui/alert-dialog";
import { TaskService } from "./task.service";

interface Task {
  id: string;
  userId: string;
  tenantId: string;
  type: "approval" | "approval_response" | "review" | "reminder" | "other";
  title: string;
  description: string;
  deadline: string | null;
  completed: boolean;
  createdAt: string;
  workflowId?: string;
  entityType?: string;
  entityId?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  isManual?: boolean; // Flag to identify manual tasks
  assignees?: Array<{ type: string; id: string; name: string }>;
  approvers?: Array<{ userId: string; name: string; order: number }>;
  attachments?: Array<{ name: string; size: number; type: string; data: string }>;
  approvalStatus?: "pending" | "approved" | "rejected";
  metadata?: {
    entityType?: string;
    entityId?: string;
  };
}

export default function TasksPage() {
  const { user } = useAuth();
  const { setExtraCrumbs } = useBreadcrumb();
  const companyContext = useCompanyOptional();
  const activeCompany = companyContext?.activeCompany || null;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [, setLocation] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Clear breadcrumbs on mount
  useEffect(() => {
    setExtraCrumbs([]);
  }, [setExtraCrumbs]);

  // Filter tasks based on completed status
  const filteredTasks = useMemo(() => {
    if (showCompleted) {
      return tasks;
    }
    return tasks.filter((task) => !task.completed);
  }, [tasks, showCompleted]);

  // Reload tasks when active company changes
  useEffect(() => {
    console.log(
      `[Tasks Page] Active company changed: ${activeCompany?.title || "None"}`
    );
    loadTasks();
  }, [activeCompany]);

  // Listen for task updates
  useEffect(() => {
    const handleTaskUpdate = () => {
      loadTasks();
    };

    window.addEventListener("taskUpdated", handleTaskUpdate);
    return () => window.removeEventListener("taskUpdated", handleTaskUpdate);
  }, []);

  const loadTasks = async () => {
    if (!user || !activeCompany) {
      setLoading(false);
      return;
    }

    try {
      // Load orgchart approval tasks from PouchDB
      const { OrgChartApprovalService } = await import("@/modules/htr/orgchart/orgchart-approval.service");
      const orgchartTasks = await OrgChartApprovalService.getUserTasks(
        user._id
      );

      // Convert orgchart tasks to Task format
      const convertedOrgchartTasks: Task[] = orgchartTasks.map((task) => ({
        id: task._id,
        userId: task.userId,
        tenantId: task.companyId,
        type: task.taskType === "approval_request" ? "approval" : "approval_response",
        title: task.title || 'Untitled Task',
        description: task.description || '',
        deadline: null,
        completed: task.completed || false,
        createdAt: new Date(task.createdAt).toISOString(),
        workflowId: task.workflowId,
        entityType: task.entityType,
        entityId: task.entityId,
        isManual: false,
        metadata: {
          entityType: task.entityType,
          entityId: task.entityId,
        },
      }));

      // Load manual tasks from PouchDB
      const manualTasks = await TaskService.getUserTasks(
        user._id,
        activeCompany._id
      );

      // Convert manual tasks to Task format
      const convertedManualTasks: Task[] = manualTasks.map((task) => ({
        id: task._id,
        userId: task.creatorId,
        tenantId: task.tenantId,
        type: "other" as const,
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        completed: task.completed,
        createdAt: task.createdAt,
        isManual: true,
        assignees: task.assignees,
        approvers: task.approvers,
        attachments: task.attachments,
        approvalStatus: task.approvalStatus,
      }));

      // Combine and sort all tasks by creation date (newest first)
      const allTasks = [...convertedOrgchartTasks, ...convertedManualTasks].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      console.log(
        `[Tasks Page] Loaded ${convertedOrgchartTasks.length} orgchart approval tasks and ${convertedManualTasks.length} manual tasks`
      );
      setTasks(allTasks);
    } catch (error) {
      console.error("Failed to load tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await TaskService.deleteTask(taskToDelete.id);
      toast.success("Task deleted successfully");
      loadTasks();
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete task"
      );
    } finally {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      if (task.completed) {
        await TaskService.uncompleteTask(task.id);
        toast.success("Task marked as incomplete");
      } else {
        await TaskService.completeTask(task.id);
        toast.success("Task completed");
      }
      loadTasks();
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error("Failed to update task");
    }
  };

  const getTaskIcon = (type: string) => {
    if (type === "approval") {
      return <AlertCircle className="size-4 text-amber-500" />;
    }
    return <AlertCircle className="size-4 text-amber-500" />;
  };

  const columns: ColumnDef<Task>[] = [
    {
      id: "icon",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          {row.original.completed ? (
            <CheckCircle2 className="size-4 text-green-500" />
          ) : (
            getTaskIcon(row.original.type)
          )}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <SortableHeader column={column}>Task</SortableHeader>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.title}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.description}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "assignees",
      header: "Assignees",
      cell: ({ row }) => {
        const assignees = row.original.assignees;
        if (!assignees || assignees.length === 0) return null;

        return (
          <div className="flex flex-wrap gap-1">
            {assignees.slice(0, 2).map((assignee, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {assignee.type === "user" && "👤"}
                {assignee.type === "position" && "💼"}
                {assignee.type === "department" && "🏢"}
                {assignee.name}
              </Badge>
            ))}
            {assignees.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{assignees.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "approvers",
      header: "Approvers",
      cell: ({ row }) => {
        const approvers = row.original.approvers;
        const approvalStatus = row.original.approvalStatus;

        if (!approvers || approvers.length === 0) return null;

        return (
          <div className="flex items-center gap-2">
            <Badge
              variant={
                approvalStatus === "approved"
                  ? "default"
                  : approvalStatus === "rejected"
                  ? "destructive"
                  : "outline"
              }
              className="text-xs"
            >
              {approvalStatus === "approved" && "✓ Approved"}
              {approvalStatus === "rejected" && "✗ Rejected"}
              {approvalStatus === "pending" && `${approvers.length} approver(s)`}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "deadline",
      header: ({ column }) => (
        <SortableHeader column={column}>Deadline</SortableHeader>
      ),
      cell: ({ row }) => {
        const deadline = row.original.deadline;
        if (!deadline) return null;

        const date = new Date(deadline);
        const isOverdue = !row.original.completed && date < new Date();

        return (
          <Badge variant={isOverdue ? "destructive" : "outline"} className="text-xs">
            {date.toLocaleDateString()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortableHeader column={column}>Status</SortableHeader>
      ),
      cell: ({ row }) => {
        const task = row.original;
        if (task.completed) {
          return <Badge variant="secondary">Completed</Badge>;
        }
        return <Badge variant="default">Pending</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Created</SortableHeader>
      ),
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
  ];

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading tasks...</div>
      </div>
    );
  }

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground">
            {pendingCount} pending, {completedCount} completed
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => setLocation("/task/new")}
          >
            <Plus className="mr-2 size-4" />
            Create Task
          </Button>
          <Button
            variant={showCompleted ? "default" : "outline"}
            onClick={() => setShowCompleted(!showCompleted)}
          >
            {showCompleted ? "Hide Completed" : "Show Completed"}
          </Button>
        </div>
      </div>

      <QTable
        columns={columns}
        data={filteredTasks}
        searchKey="title"
        searchPlaceholder="Search tasks..."
        enableRowSelection={false}
        onRowClick={(task) => {
          if (task.isManual) {
            // Navigate to edit manual task
            setLocation(`/task/edit/${task.id}`);
          } else {
            // Navigate to orgchart approval task page
            const taskId = task.id.split(":").pop() || task.id;
            setLocation(`/task/orgchart/${taskId}`);
          }
        }}
        rowActions={(task) => {
          const actions = [];

          if (task.isManual) {
            // Manual task actions
            actions.push({
              label: "Edit",
              icon: <Edit className="size-4" />,
              onClick: () => setLocation(`/task/edit/${task.id}`),
            });

            if (task.completed) {
              actions.push({
                label: "Mark Incomplete",
                icon: <X className="size-4" />,
                onClick: () => handleToggleComplete(task),
              });
            } else {
              actions.push({
                label: "Mark Complete",
                icon: <Check className="size-4" />,
                onClick: () => handleToggleComplete(task),
              });
            }

            actions.push({
              label: "Delete",
              icon: <Trash2 className="size-4" />,
              onClick: () => {
                setTaskToDelete(task);
                setDeleteDialogOpen(true);
              },
              variant: "destructive" as const,
            });
          } else {
            // Orgchart approval task actions
            if (!task.completed) {
              const taskId = task.id.split(":").pop() || task.id;
              actions.push({
                label: "View Details",
                icon: <AlertCircle className="size-4" />,
                onClick: () => setLocation(`/task/orgchart/${taskId}`),
              });
            }
          }

          return actions.length > 0 ? (
            <RowActionsDropdown actions={actions} />
          ) : null;
        }}
        emptyMessage="All caught up! You have no pending tasks."
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{taskToDelete?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
