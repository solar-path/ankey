import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useCompany } from "@/lib/company-context";
import {
  OrgChartApprovalService,
  type ApprovalTask,
  type ApprovalWorkflow,
} from "@/modules/htr/orgchart/orgchart-approval.service";
import type { OrgChart } from "@/modules/htr/orgchart/orgchart.types";
import { orgchartsDB } from "@/modules/shared/database/db";
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
import { ArrowLeft, Check, X, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function OrgChartApprovalTaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { activeCompany } = useCompany();

  const [task, setTask] = useState<ApprovalTask | null>(null);
  const [workflow, setWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [orgChart, setOrgChart] = useState<OrgChart | null>(null);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (taskId && activeCompany && user) {
      loadTaskDetails();
    }
  }, [taskId, activeCompany, user]);

  const loadTaskDetails = async () => {
    if (!activeCompany || !user || !taskId) return;

    try {
      setLoading(true);

      // Get task
      const partitionKey = taskId.startsWith("company:")
        ? taskId
        : `company:${activeCompany._id}:${taskId}`;
      const taskDoc = (await orgchartsDB.get(partitionKey)) as ApprovalTask;

      if (!taskDoc || taskDoc.type !== "task") {
        toast.error("Task not found");
        setLocation("/task");
        return;
      }

      setTask(taskDoc);

      // Get workflow
      const workflowDoc = (await orgchartsDB.get(
        taskDoc.workflowId
      )) as ApprovalWorkflow;
      if (workflowDoc && workflowDoc.type === "approval_workflow") {
        setWorkflow(workflowDoc);
      }

      // Get orgchart
      const orgChartKey = `company:${activeCompany._id}:${taskDoc.entityId}`;
      const orgChartDoc = (await orgchartsDB.get(orgChartKey)) as OrgChart;
      if (orgChartDoc && orgChartDoc.type === "orgchart") {
        setOrgChart(orgChartDoc);
      }
    } catch (error) {
      console.error("Failed to load task details:", error);
      toast.error("Failed to load task details");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!activeCompany || !user || !workflow) return;

    try {
      setActionLoading(true);

      const workflowId = workflow._id.split(":").pop()!;
      await OrgChartApprovalService.approveOrgChart(
        activeCompany._id,
        workflowId,
        user._id,
        comments
      );

      toast.success("Approved successfully");
      setLocation("/task");
    } catch (error: any) {
      toast.error(error.message || "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!activeCompany || !user || !workflow) return;

    if (!comments.trim()) {
      toast.error("Please provide comments when declining");
      return;
    }

    try {
      setActionLoading(true);

      const workflowId = workflow._id.split(":").pop()!;
      await OrgChartApprovalService.declineOrgChart(
        activeCompany._id,
        workflowId,
        user._id,
        comments
      );

      toast.success("Declined successfully");
      setLocation("/task");
    } catch (error: any) {
      toast.error(error.message || "Failed to decline");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!activeCompany || !task) return;

    try {
      setActionLoading(true);

      const taskId = task._id.split(":").pop()!;
      await OrgChartApprovalService.completeTask(activeCompany._id, taskId);

      toast.success("Task acknowledged");
      setLocation("/task");
    } catch (error: any) {
      toast.error(error.message || "Failed to acknowledge");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading task details...</div>
      </div>
    );
  }

  if (!task || !orgChart) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Task or OrgChart not found</div>
      </div>
    );
  }

  const isApprovalRequest =
    task.taskType === "approval_pending" && workflow?.approverId === user?._id;
  const isApprovalResponse = task.taskType === "approval_response";
  const canTakeAction =
    isApprovalRequest && !task.completed && workflow?.status === "pending";

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
                    {task.taskType.replace(/_/g, " ").toUpperCase()}
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
                {task.completedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="font-medium">
                      {new Date(task.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* OrgChart Details */}
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
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{orgChart.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Version</p>
                  <p className="font-medium">{orgChart.version}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="outline">
                    {orgChart.status.replace(/_/g, " ").toUpperCase()}
                  </Badge>
                </div>
              </div>

              {orgChart.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="mt-1">{orgChart.description}</p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation(`/orgchart/${task.entityId}`)}
                >
                  <FileText className="size-4 mr-2" />
                  View Full Organizational Chart
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Timeline */}
          {workflow && (
            <Card>
              <CardHeader>
                <CardTitle>Approval Timeline</CardTitle>
                <CardDescription>Track the approval process</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge
                    variant={
                      workflow.status === "approved"
                        ? "default"
                        : workflow.status === "declined"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {workflow.status.toUpperCase()}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-green-500 mt-1" />
                    <div>
                      <p className="font-medium">Submitted for Approval</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(workflow.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {workflow.respondedAt && (
                    <div className="flex items-start gap-3">
                      <CheckCircle2
                        className={`size-5 mt-1 ${
                          workflow.status === "approved"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      />
                      <div>
                        <p className="font-medium">
                          {workflow.status === "approved"
                            ? "Approved"
                            : "Declined"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(workflow.respondedAt).toLocaleString()}
                        </p>
                        {workflow.comments && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <p className="font-medium">Comments:</p>
                            <p>{workflow.comments}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Approval Actions */}
          {canTakeAction && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>Review and make your decision</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Comments (Optional for approval, required for decline)
                  </label>
                  <Textarea
                    placeholder="Add your comments..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={5}
                  />
                </div>

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
                  onClick={handleDecline}
                  disabled={actionLoading}
                >
                  <X className="size-4 mr-2" />
                  Decline
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Response Acknowledgement */}
          {isApprovalResponse && !task.completed && (
            <Card
              className={
                workflow?.status === "approved"
                  ? "border-green-200"
                  : "border-red-200"
              }
            >
              <CardHeader>
                <CardTitle
                  className={
                    workflow?.status === "approved"
                      ? "text-green-700"
                      : "text-red-700"
                  }
                >
                  {workflow?.status === "approved" ? "Approved" : "Declined"}
                </CardTitle>
                <CardDescription>
                  Your organizational chart has been{" "}
                  {workflow?.status === "approved" ? "approved" : "declined"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {workflow?.comments && (
                  <div className="p-3 bg-muted rounded">
                    <p className="text-sm font-medium mb-1">Comments:</p>
                    <p className="text-sm">{workflow.comments}</p>
                  </div>
                )}
                <Button
                  className="w-full"
                  onClick={handleAcknowledge}
                  disabled={actionLoading}
                >
                  <Check className="size-4 mr-2" />
                  Acknowledge
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Completed Status */}
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
        </div>
      </div>
    </div>
  );
}
