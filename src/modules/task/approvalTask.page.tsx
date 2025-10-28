import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useCompany } from "@/lib/company-context";
import { DocumentApprovalService } from "@/modules/shared/services/document-approval.service";
import type {
  ApprovalTask,
  ApprovalWorkflow,
  DocumentType,
} from "@/modules/shared/types/database.types";

// TODO: Remove PouchDB usage - migrate to PostgreSQL
// This page needs complete rewrite to use DocumentApprovalService PostgreSQL functions
const orgchartsDB: any = {
  get: async () => { throw new Error("PouchDB removed - awaiting PostgreSQL migration"); }
};
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

export default function ApprovalTaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { activeCompany } = useCompany();

  const [task, setTask] = useState<ApprovalTask | null>(null);
  const [workflow, setWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [document, setDocument] = useState<any | null>(null);
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
        setLocation("/tasks");
        return;
      }

      setTask(taskDoc);

      // Get workflow
      const workflowKey = taskDoc.workflowId.startsWith("company:")
        ? taskDoc.workflowId
        : `company:${activeCompany._id}:${taskDoc.workflowId}`;
      const workflowDoc = (await orgchartsDB.get(workflowKey)) as ApprovalWorkflow;
      if (workflowDoc && workflowDoc.type === "approval_workflow") {
        setWorkflow(workflowDoc);
      }

      // Get document
      const documentKey = `company:${activeCompany._id}:${taskDoc.entityId}`;
      try {
        const documentDoc = await orgchartsDB.get(documentKey);
        setDocument(documentDoc);
      } catch (error) {
        console.warn("Document not found:", error);
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
      await DocumentApprovalService.approve(
        workflowId,
        user._id,
        comments
      );

      toast.success("Document approved successfully");
      setLocation("/tasks");
    } catch (error) {
      console.error("Failed to approve:", error);
      toast.error(error instanceof Error ? error.message : "Failed to approve document");
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
      await DocumentApprovalService.decline(
        workflowId,
        user._id,
        comments
      );

      toast.success("Document declined");
      setLocation("/tasks");
    } catch (error) {
      console.error("Failed to decline:", error);
      toast.error(error instanceof Error ? error.message : "Failed to decline document");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!activeCompany || !task) return;

    try {
      setActionLoading(true);

      await DocumentApprovalService.completeTask(task._id, "approved");

      toast.success("Task acknowledged");
      setLocation("/tasks");
    } catch (error) {
      console.error("Failed to acknowledge task:", error);
      toast.error("Failed to acknowledge task");
    } finally {
      setActionLoading(false);
    }
  };

  const getDocumentTypeName = (type: DocumentType): string => {
    const names: Record<DocumentType, string> = {
      purchase_order: "Purchase Order",
      sales_order: "Sales Order",
      invoice: "Invoice",
      payment: "Payment",
      contract: "Contract",
      department_charter: "Department Charter",
      job_description: "Job Description",
      job_offer: "Job Offer",
      employment_contract: "Employment Contract",
      termination_notice: "Termination Notice",
      orgchart: "Organizational Chart",
      other: "Other Document",
    };
    return names[type] || type;
  };

  const getWorkflowStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      declined: "destructive",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">Loading task details...</CardContent>
        </Card>
      </div>
    );
  }

  if (!task || !workflow) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">Task not found</CardContent>
        </Card>
      </div>
    );
  }

  const isApprovalRequest = task.taskType === "approval_request";
  const isApprovalResponse = task.taskType === "approval_response";

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/tasks")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </Button>
      </div>

      {/* Task Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{task.title}</CardTitle>
              <CardDescription>{task.description}</CardDescription>
            </div>
            <div className="flex gap-2">
              {getWorkflowStatusBadge(workflow.status)}
              <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>
                {task.priority}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Workflow Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Approval Workflow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Document Type</p>
              <p className="font-medium">{getDocumentTypeName(workflow.entityType as DocumentType)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Level</p>
              <p className="font-medium">Level {workflow.currentLevel}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{workflow.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="font-medium">
                {workflow.submittedAt ? new Date(workflow.submittedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Approval History */}
          {workflow.decisions && workflow.decisions.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-3">Approval History</h4>
                <div className="space-y-3">
                  {workflow.decisions.map((decision, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm">
                      {decision.decision === "approved" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          Level {decision.level} - {decision.decision}
                        </p>
                        <p className="text-muted-foreground">
                          {decision.timestamp ? new Date(decision.timestamp).toLocaleString() : 'N/A'}
                        </p>
                        {decision.comments && (
                          <p className="mt-1 text-muted-foreground italic">
                            "{decision.comments}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Document Preview */}
      {document && (
        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {document.title && (
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{document.title}</p>
                </div>
              )}
              {document.version && (
                <div>
                  <p className="text-sm text-muted-foreground">Version</p>
                  <p className="font-medium">v{document.version}</p>
                </div>
              )}
              {/* Add more document-specific fields as needed */}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {isApprovalRequest && workflow.status === "pending" && (
        <Card>
          <CardHeader>
            <CardTitle>Your Decision</CardTitle>
            <CardDescription>
              Review the document and provide your approval decision
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Comments (optional for approval, required for decline)
              </label>
              <Textarea
                placeholder="Add your comments here..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={handleDecline}
                disabled={actionLoading}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isApprovalResponse && !task.completed && (
        <Card>
          <CardHeader>
            <CardTitle>Acknowledge</CardTitle>
            <CardDescription>
              Mark this notification as read
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAcknowledge} disabled={actionLoading}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Acknowledge
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
