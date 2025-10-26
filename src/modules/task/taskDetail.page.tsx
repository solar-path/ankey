import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { client } from "@/lib/api-client";
import { useBreadcrumb } from "@/lib/breadcrumb-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/ui/card";
import { Badge } from "@/lib/ui/badge";
import { Button } from "@/lib/ui/button";
import { Textarea } from "@/lib/ui/textarea";
import { Separator } from "@/lib/ui/separator";
import {
  ArrowLeft,
  Check,
  X,
  AlertCircle,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  userId: string;
  tenantId: string;
  type: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  entityType?: string;
  entityId?: string;
  workflowId?: string;
  deadline: string | null;
  completed: boolean;
  completedAt: string | null;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface ApprovalWorkflow {
  id: string;
  entityType: string;
  entityId: string;
  matrixId: string;
  status: string;
  currentLevel: string;
  steps: any[];
  metadata: any;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const [, setLocation] = useLocation();
  const { setExtraCrumbs } = useBreadcrumb();

  // Automatically redirect to tasks list when company changes
  const [task, setTask] = useState<Task | null>(null);
  const [workflow, setWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [entity, setEntity] = useState<any>(null);
  const [document, setDocument] = useState<any>(null);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [users, setUsers] = useState<
    Map<string, { fullname: string; email: string }>
  >(new Map());

  useEffect(() => {
    if (taskId) {
      loadTaskDetails();
    }
  }, [taskId]);

  const loadTaskDetails = async () => {
    try {
      setLoading(true);

      // Load all tasks and find the current one
      const { data: tasksData, error: tasksError } = await (client as any)(
        "/api/tasks",
        { method: "GET" }
      );
      if (tasksError) {
        throw new Error("Failed to load task");
      }

      const currentTask = (tasksData as any).tasks.find(
        (t: Task) => t.id === taskId
      );

      if (!currentTask) {
        toast.error("Task not found");
        setLocation("/task");
        return;
      }

      setTask(currentTask);

      // Set breadcrumbs - trim title to max 30 characters
      const titleShort =
        currentTask.title.length > 30
          ? currentTask.title.substring(0, 30) + "..."
          : currentTask.title;
      setExtraCrumbs([
        { href: "/task", label: "Tasks" },
        { label: titleShort },
      ]);

      // Load workflow if it's an approval task
      if (currentTask.workflowId) {
        const { data: workflowData, error: workflowError } = await (
          client as any
        )(`/api/doa/workflows/${currentTask.workflowId}`, { method: "GET" });

        if (!workflowError) {
          setWorkflow((workflowData as any).workflow);

          // Load user details for approvers
          const userIds = new Set<string>();
          (workflowData as any).workflow.steps?.forEach((step: any) => {
            if (step.approverId) {
              userIds.add(step.approverId);
            }
          });

          if (userIds.size > 0) {
            const { data: usersData, error: usersError } = await (
              client as any
            )("/api/auth/users", { method: "GET" });
            if (!usersError) {
              const userMap = new Map();
              (usersData as any).users.forEach((user: any) => {
                if (userIds.has(user.id)) {
                  userMap.set(user.id, {
                    fullname: user.profile?.fullname || user.email,
                    email: user.email,
                  });
                }
              });
              setUsers(userMap);
            }
          }
        }
      }

      // Load entity details if available
      if (currentTask.entityType === "orgchart" && currentTask.entityId) {
        const { data: orgchartData, error: orgchartError } = await (
          client as any
        )(`/api/htr/orgcharts/${currentTask.entityId}`, { method: "GET" });

        if (!orgchartError) {
          setEntity((orgchartData as any).orgchart);
        }
      } else if (
        currentTask.entityType === "job_offer" &&
        currentTask.entityId
      ) {
        const { data: jobOfferData, error: jobOfferError } = await (
          client as any
        )(`/api/htr/job-offers/${currentTask.entityId}`, { method: "GET" });

        if (!jobOfferError) {
          setEntity((jobOfferData as any).jobOffer);
        }
      }

      // Load document if workflow exists
      if (currentTask.workflowId) {
        const { data: documentsData, error: documentsError } = await (
          client as any
        )("/api/documents", { method: "GET" });
        if (!documentsError) {
          const workflowDocument = (documentsData as any).documents.find(
            (doc: any) => doc.workflowId === currentTask.workflowId
          );
          if (workflowDocument) {
            setDocument(workflowDocument);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load task details:", error);
      toast.error("Failed to load task details");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!task?.workflowId) return;

    try {
      setActionLoading(true);
      const { error } = await (client as any)(
        `/api/doa/workflows/${task.workflowId}/approve`,
        {
          method: "POST",
          body: {
            workflowId: task.workflowId,
            comments: comments || "",
          },
        }
      );

      if (error) {
        toast.error((error.value as any)?.message || "Failed to approve");
        return;
      }

      toast.success("Approved successfully");
      // Trigger task count update
      window.dispatchEvent(new CustomEvent("taskUpdated"));
      setLocation("/task");
    } catch (error) {
      console.error("Failed to approve:", error);
      toast.error("Failed to approve");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!task?.workflowId) return;

    if (!comments.trim()) {
      toast.error("Please provide rejection comments");
      return;
    }

    try {
      setActionLoading(true);
      const { error } = await (client as any)(
        `/api/doa/workflows/${task.workflowId}/reject`,
        {
          method: "POST",
          body: {
            workflowId: task.workflowId,
            comments: comments,
          },
        }
      );

      if (error) {
        toast.error((error.value as any)?.message || "Failed to reject");
        return;
      }

      toast.success("Rejected successfully");
      // Trigger task count update
      window.dispatchEvent(new CustomEvent("taskUpdated"));
      setLocation("/task");
    } catch (error) {
      console.error("Failed to reject:", error);
      toast.error("Failed to reject");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadDocument = async () => {
    if (!document) return;

    try {
      const response = await fetch(`/api/documents/${document.id}/download`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to download document");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `${document.title}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);

      toast.success("Document downloaded successfully");
    } catch (error) {
      console.error("Failed to download document:", error);
      toast.error("Failed to download document");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading task details...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Task not found</div>
      </div>
    );
  }

  const isApprovalTask = task.type === "approval" && task.workflowId;
  const isRejectionFeedback = task.type === "rejection_feedback";
  const canTakeAction = isApprovalTask && !task.completed;
  const isRejected = workflow?.status === "rejected";

  const handleMarkAsResolved = async () => {
    try {
      setActionLoading(true);
      // Simply mark the task as completed
      const response = await fetch(`/api/tasks/${task.id}/complete`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to mark as resolved");
      }

      toast.success("Task marked as resolved");
      window.dispatchEvent(new CustomEvent("taskUpdated"));
      setLocation("/task");
    } catch (error) {
      console.error("Failed to mark as resolved:", error);
      toast.error("Failed to mark as resolved");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/task")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{task.title}</h1>
          <p className="text-muted-foreground">{task.description}</p>
        </div>
        <Badge variant={task.completed ? "secondary" : "default"}>
          {task.completed ? "Completed" : "Pending"}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Task Information */}
          <Card>
            <CardHeader>
              <CardTitle>Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge variant="outline">
                    {task.type.replace(/_/g, " ").toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <Badge
                    variant={
                      task.priority === "high" ? "destructive" : "secondary"
                    }
                  >
                    {task.priority.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {task.deadline && (
                  <div>
                    <p className="text-sm text-muted-foreground">Deadline</p>
                    <p className="font-medium">
                      {new Date(task.deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {task.metadata && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Additional Information
                    </p>
                    <div className="space-y-1">
                      {task.metadata.companyName && (
                        <p>
                          <span className="font-medium">Company:</span>{" "}
                          {task.metadata.companyName}
                        </p>
                      )}
                      {task.metadata.orgchartVersion && (
                        <p>
                          <span className="font-medium">Version:</span>{" "}
                          {task.metadata.orgchartVersion}
                        </p>
                      )}
                      {task.metadata.positionTitle && (
                        <p>
                          <span className="font-medium">Position:</span>{" "}
                          {task.metadata.positionTitle}
                        </p>
                      )}
                      {task.metadata.candidateName && (
                        <p>
                          <span className="font-medium">Candidate:</span>{" "}
                          {task.metadata.candidateName}
                        </p>
                      )}
                      {task.metadata.blockMode && (
                        <p>
                          <span className="font-medium">Approval Mode:</span>{" "}
                          {task.metadata.blockMode}
                        </p>
                      )}
                      {task.metadata.functionalAreas &&
                        task.metadata.functionalAreas.length > 0 && (
                          <p>
                            <span className="font-medium">
                              Functional Areas:
                            </span>{" "}
                            {task.metadata.functionalAreas.join(", ")}
                          </p>
                        )}
                      {task.metadata.rejectedBy && (
                        <p>
                          <span className="font-medium">Rejected By:</span>{" "}
                          {task.metadata.rejectedBy}
                        </p>
                      )}
                      {task.metadata.rejectedAt && (
                        <p>
                          <span className="font-medium">Rejected At:</span>{" "}
                          {new Date(task.metadata.rejectedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Rejection Feedback - Show prominently for rejection feedback tasks */}
              {task.type === "rejection_feedback" &&
                task.metadata?.rejectionComments && (
                  <>
                    <Separator />
                    <div className="p-4 border-l-4 border-red-500 bg-red-50 rounded">
                      <p className="font-medium text-red-900 mb-2">
                        Rejection Feedback:
                      </p>
                      <p className="text-sm text-red-800 whitespace-pre-wrap">
                        {task.metadata.rejectionComments}
                      </p>
                    </div>
                  </>
                )}
            </CardContent>
          </Card>

          {/* Entity Details */}
          {entity && task.entityType === "orgchart" && (
            <Card>
              <CardHeader>
                <CardTitle>Organizational Chart Details</CardTitle>
                <CardDescription>
                  Review the organizational structure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Version</p>
                    <p className="font-medium">{entity.version}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="outline">
                      {entity.status.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Effective Date
                    </p>
                    <p className="font-medium">
                      {entity.effectiveDate
                        ? new Date(entity.effectiveDate).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {entity.departments?.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Departments</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {entity.positions?.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Positions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {entity.assignments?.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Assignments</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {task.entityId && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        setLocation(`/orgchart/detail/${task.entityId}`)
                      }
                    >
                      <FileText className="size-4 mr-2" />
                      View Full Organizational Chart
                    </Button>
                  )}
                  {document && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleDownloadDocument}
                    >
                      <FileText className="size-4 mr-2" />
                      Download PDF Document
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Offer Details */}
          {entity && task.entityType === "job_offer" && (
            <Card>
              <CardHeader>
                <CardTitle>Job Offer Details</CardTitle>
                <CardDescription>
                  Review the job offer information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Position</p>
                    <p className="font-medium">{entity.positionTitle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{entity.departmentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Salary</p>
                    <p className="font-medium text-green-600">
                      {entity.currency} {entity.salary?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Employment Type
                    </p>
                    <Badge variant="outline">
                      {entity.employmentType?.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {entity.startDate
                        ? new Date(entity.startDate).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="outline">
                      {entity.status?.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  {task.entityId && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setLocation(`/job-offer/${task.entityId}`)}
                    >
                      <FileText className="size-4 mr-2" />
                      View Full Job Offer
                    </Button>
                  )}
                  {document && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleDownloadDocument}
                    >
                      <FileText className="size-4 mr-2" />
                      Download PDF Document
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Approval Workflow */}
          {workflow && (
            <Card>
              <CardHeader>
                <CardTitle>Approval Workflow</CardTitle>
                <CardDescription>Track the approval process</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge
                    variant={
                      workflow.status === "approved"
                        ? "default"
                        : workflow.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {workflow.status.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Current Level: {workflow.currentLevel}
                  </span>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="font-medium">Approval Steps:</p>
                  {workflow.steps?.map((step: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg border"
                    >
                      <div className="mt-1">
                        {step.status === "approved" ? (
                          <CheckCircle2 className="size-5 text-green-500" />
                        ) : step.status === "rejected" ? (
                          <XCircle className="size-5 text-red-500" />
                        ) : (
                          <AlertCircle className="size-5 text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {step.approverType === "user" && step.approverId
                              ? users.get(step.approverId)?.fullname ||
                                step.approverRef
                              : step.approverRef}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            Level {step.level}
                          </Badge>
                          {step.blockMode && (
                            <Badge variant="secondary" className="text-xs">
                              {step.blockMode}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Type: {step.approverType}
                          {step.required && " • Required"}
                        </p>
                        {step.comments && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <p className="font-medium">Comments:</p>
                            <p>{step.comments}</p>
                          </div>
                        )}
                        {step.approvedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Approved:{" "}
                            {new Date(step.approvedAt).toLocaleString()}
                          </p>
                        )}
                        {step.rejectedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Rejected:{" "}
                            {new Date(step.rejectedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Rejection Feedback Actions */}
          {isRejectionFeedback && !task.completed && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle>Rejection Feedback</CardTitle>
                <CardDescription>
                  Review the rejection feedback and make necessary changes to
                  the document
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                  <p className="text-sm text-amber-900">
                    <strong>Next Steps:</strong>
                  </p>
                  <ol className="text-sm text-amber-800 mt-2 space-y-1 list-decimal list-inside">
                    <li>Review the rejection feedback above</li>
                    <li>Make necessary changes to the document</li>
                    <li>Re-submit for approval if needed</li>
                    <li>Mark this task as resolved when done</li>
                  </ol>
                </div>

                {task.entityId && task.entityType === "orgchart" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      setLocation(`/orgchart/detail/${task.entityId}`)
                    }
                  >
                    <FileText className="size-4 mr-2" />
                    View & Edit Document
                  </Button>
                )}

                <Button
                  className="w-full"
                  onClick={handleMarkAsResolved}
                  disabled={actionLoading}
                >
                  <Check className="size-4 mr-2" />
                  Mark as Resolved
                </Button>
              </CardContent>
            </Card>
          )}

          {canTakeAction && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  {isRejected
                    ? "Review rejection and provide feedback"
                    : "Review and make your decision"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Comments {isRejected ? "" : "(Optional)"}
                  </label>
                  <Textarea
                    placeholder={
                      isRejected
                        ? "Provide feedback on the rejection..."
                        : "Add your comments..."
                    }
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={5}
                    disabled={task.completed}
                  />
                </div>

                {!task.completed && (
                  <>
                    <Button
                      className="w-full"
                      onClick={handleApprove}
                      disabled={actionLoading}
                    >
                      <Check className="size-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleReject}
                      disabled={actionLoading}
                    >
                      <X className="size-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {task.completed && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-700">Task Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-600">
                  This task has been completed on{" "}
                  {new Date(
                    task.completedAt || task.updatedAt
                  ).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          )}

          {isRejected && !task.completed && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700">
                  Workflow Rejected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-600">
                  This approval workflow was rejected. Review the comments and
                  take appropriate action.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
