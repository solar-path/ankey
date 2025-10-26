import { useEffect, useState, useMemo } from "react";
import { client } from "@/lib/api-client";
import { useTask } from "@/lib/task-context";
import { useBreadcrumb } from "@/lib/breadcrumb-context";
import { useCompanyOptional } from "@/lib/company-context";
import { QTable, SortableHeader, RowActionsDropdown } from "@/lib/ui/QTable.ui";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/lib/ui/badge";
import { Button } from "@/lib/ui/button";
import { AlertCircle, CheckCircle2, Key, Shield, Check, X } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface Task {
  id: string;
  userId: string;
  tenantId: string;
  type: "2fa_setup" | "password_change" | "approval" | "rejection_feedback";
  title: string;
  description: string;
  deadline: string | null;
  completed: boolean;
  createdAt: string;
  workflowId?: string;
  entityType?: string;
  entityId?: string;
  metadata?: {
    entityType?: string;
    entityId?: string;
    currentLevel?: string;
    rejectionComments?: string;
    rejectedBy?: string;
  };
}

export default function TasksPage() {
  const { refreshTaskCount } = useTask();
  const { setExtraCrumbs } = useBreadcrumb();
  const companyContext = useCompanyOptional();
  const activeCompany = companyContext?.activeCompany || null;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [, setLocation] = useLocation();

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

  const loadTasks = async () => {
    try {
      // Auto-create tasks based on policies
      await (client as any)("/api/tasks/auto-create", { method: "POST" });

      // Load all tasks - MUST provide method: 'GET' for Eden Fetch
      const { data, error } = await (client as any)("/api/tasks", {
        method: "GET",
      });
      if (error) {
        const errorMessage =
          (error.value as any)?.error || "Failed to load tasks";
        toast.error(errorMessage);
        return;
      }
      const responseData = data as any;
      console.log(
        `[Tasks Page] Received ${
          responseData.tasks?.length || 0
        } tasks from API`
      );
      setTasks(responseData.tasks);
    } catch (error) {
      console.error("Failed to load tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (task: Task) => {
    if (!task.workflowId) return;

    try {
      const { error } = await client(
        `/api/doa/workflows/${task.workflowId}/approve` as any,
        {
          method: "POST",
          body: {
            workflowId: task.workflowId,
            comments: "",
          },
          params: { workflowId: task.workflowId },
        } as any
      );

      if (error) {
        const errorMessage = (error.value as any)?.error || "Failed to approve";
        toast.error(errorMessage);
        return;
      }

      toast.success("Approved successfully");
      loadTasks();
      await refreshTaskCount();
    } catch (error) {
      console.error("Failed to approve:", error);
      toast.error("Failed to approve");
    }
  };

  const handleReject = async (task: Task) => {
    if (!task.workflowId) return;

    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      const { error } = await client(
        `/api/doa/workflows/${task.workflowId}/reject` as any,
        {
          method: "POST",
          body: {
            workflowId: task.workflowId,
            comments: reason,
          },
          params: { workflowId: task.workflowId },
        } as any
      );

      if (error) {
        const errorMessage = (error.value as any)?.error || "Failed to reject";
        toast.error(errorMessage);
        return;
      }

      toast.success("Rejected successfully");
      loadTasks();
      await refreshTaskCount();
    } catch (error) {
      console.error("Failed to reject:", error);
      toast.error("Failed to reject");
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "approval":
        return <AlertCircle className="size-4 text-amber-500" />;
      case "rejection_feedback":
        return <X className="size-4 text-red-500" />;
      case "2fa_setup":
        return <Shield className="size-4 text-amber-500" />;
      case "password_change":
        return <Key className="size-4 text-amber-500" />;
      default:
        return <AlertCircle className="size-4 text-amber-500" />;
    }
  };

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
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
      accessorKey: "type",
      header: ({ column }) => (
        <SortableHeader column={column}>Type</SortableHeader>
      ),
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.type.replace("_", " ").toUpperCase()}
        </Badge>
      ),
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
        if (task.deadline && isOverdue(task.deadline)) {
          return <Badge variant="destructive">Overdue</Badge>;
        }
        return <Badge variant="default">Pending</Badge>;
      },
    },
    {
      accessorKey: "deadline",
      header: ({ column }) => (
        <SortableHeader column={column}>Due Date</SortableHeader>
      ),
      cell: ({ row }) => {
        const deadline = row.original.deadline;
        if (!deadline || row.original.completed) return "—";
        const isTaskOverdue = isOverdue(deadline);
        return (
          <div className={isTaskOverdue ? "text-destructive font-medium" : ""}>
            {new Date(deadline).toLocaleDateString()}
          </div>
        );
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
        <Button
          variant={showCompleted ? "default" : "outline"}
          onClick={() => setShowCompleted(!showCompleted)}
        >
          {showCompleted ? "Hide Completed" : "Show Completed"}
        </Button>
      </div>

      <QTable
        columns={columns}
        data={filteredTasks}
        searchKey="title"
        searchPlaceholder="Search tasks..."
        enableRowSelection={false}
        onRowClick={(task) => {
          if (task.type === "approval" || task.type === "rejection_feedback") {
            setLocation(`/task/${task.id}`);
          }
        }}
        rowActions={(task) => {
          const actions = [];

          if (!task.completed) {
            if (task.type === "approval" && task.workflowId) {
              actions.push(
                {
                  label: "View Details",
                  icon: <AlertCircle className="size-4" />,
                  onClick: () => setLocation(`/task/${task.id}`),
                },
                {
                  label: "Approve",
                  icon: <Check className="size-4" />,
                  onClick: () => handleApprove(task),
                },
                {
                  label: "Reject",
                  icon: <X className="size-4" />,
                  onClick: () => handleReject(task),
                  variant: "destructive" as const,
                }
              );
            } else if (task.type === "rejection_feedback") {
              actions.push({
                label: "View Feedback",
                icon: <AlertCircle className="size-4" />,
                onClick: () => setLocation(`/task/${task.id}`),
              });

              if (task.entityId && task.entityType === "orgchart") {
                actions.push({
                  label: "Edit Document",
                  icon: <AlertCircle className="size-4" />,
                  onClick: () =>
                    setLocation(`/orgchart/detail/${task.entityId}`),
                });
              }
            } else if (
              task.type === "2fa_setup" ||
              task.type === "password_change"
            ) {
              actions.push({
                label:
                  task.type === "2fa_setup" ? "Setup 2FA" : "Change Password",
                icon:
                  task.type === "2fa_setup" ? (
                    <Shield className="size-4" />
                  ) : (
                    <Key className="size-4" />
                  ),
                onClick: () => setLocation("/account/security"),
              });
            }
          }

          return actions.length > 0 ? (
            <RowActionsDropdown actions={actions} />
          ) : null;
        }}
        emptyMessage="All caught up! You have no pending tasks."
      />
    </div>
  );
}
