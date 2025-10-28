import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { toast } from "sonner";
import { ArrowLeft, Loader2, X, Trash2 } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { useCompanyOptional } from "@/lib/company-context";
import { useBreadcrumb } from "@/lib/breadcrumb-context";
import { Button } from "@/lib/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/lib/ui/form";
import { Input } from "@/lib/ui/input";
import { Textarea } from "@/lib/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/ui/select";
import { Badge } from "@/lib/ui/badge";

import { TaskService } from "./task.service";
import { taskSchema, type TaskInput, type Assignee, type Approver, type Attachment } from "./task.valibot";
import { usersDB, userCompaniesDB } from "@/modules/shared/database/db";
import type { User } from "@/modules/shared/database/db";
import { CompanyDatabaseFactory } from "@/modules/shared/database/company-db-factory";

export default function TaskFormPage() {
  const { user } = useAuth();
  const companyContext = useCompanyOptional();
  const activeCompany = companyContext?.activeCompany || null;
  const { setExtraCrumbs } = useBreadcrumb();
  const [, setLocation] = useLocation();
  const params = useParams();
  const taskId = params.id;

  const [loading, setLoading] = useState(!!taskId);
  const [submitting, setSubmitting] = useState(false);
  const [companyUsers, setCompanyUsers] = useState<User[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // Form state for dynamic fields
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [totalAttachmentSize, setTotalAttachmentSize] = useState(0);

  const form = useForm<TaskInput>({
    resolver: valibotResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      deadline: "",
      assignees: [],
      approvers: [],
      attachments: [],
    },
  });

  // Set breadcrumbs
  useEffect(() => {
    setExtraCrumbs([
      { label: "Tasks", href: "/task" },
      { label: taskId ? "Edit Task" : "New Task", href: "" },
    ]);

    return () => setExtraCrumbs([]);
  }, [setExtraCrumbs, taskId]);

  // Load company data
  useEffect(() => {
    if (activeCompany) {
      loadCompanyData();
    }
  }, [activeCompany]);

  // Load task data if editing
  useEffect(() => {
    if (taskId && user && activeCompany) {
      loadTask();
    }
  }, [taskId, user, activeCompany]);

  const loadCompanyData = async () => {
    if (!activeCompany) return;

    try {
      // Load company users
      const userCompaniesResult = await userCompaniesDB.find({
        selector: {
          companyId: activeCompany._id,
          type: "user_company",
        },
      });

      const userIds = userCompaniesResult.docs.map((uc: any) => uc.userId);
      const usersResult = await usersDB.find({
        selector: {
          _id: { $in: userIds },
          type: "user",
        },
      });

      setCompanyUsers(usersResult.docs as User[]);

      // Load positions and departments from orgchart
      const orgchartData = await CompanyDatabaseFactory.getOrgCharts();
      const latestOrgchart = orgchartData.sort((a, b) => b.version - a.version)[0];

      if (latestOrgchart) {
        const allPositions: any[] = [];
        const allDepartments: any[] = [];

        // Extract positions and departments from orgchart hierarchy
        const extractFromHierarchy = (items: any[]) => {
          items.forEach(item => {
            if (item.type === "department") {
              allDepartments.push(item);
            } else if (item.type === "position") {
              allPositions.push(item);
            }
            if (item.children) {
              extractFromHierarchy(item.children);
            }
          });
        };

        if (latestOrgchart.data?.hierarchy) {
          extractFromHierarchy(latestOrgchart.data.hierarchy);
        }

        setPositions(allPositions);
        setDepartments(allDepartments);
      }
    } catch (error) {
      console.error("Failed to load company data:", error);
    }
  };

  const loadTask = async () => {
    if (!taskId) return;

    try {
      setLoading(true);
      const task = await TaskService.getTask(taskId);

      // Check if user owns this task
      if (task.creatorId !== user?._id) {
        toast.error("You don't have permission to edit this task");
        setLocation("/task");
        return;
      }

      // Check if this is a manual task
      if (task.type !== "manual_task") {
        toast.error("System-generated tasks cannot be edited");
        setLocation("/task");
        return;
      }

      form.reset({
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        assignees: task.assignees,
        approvers: task.approvers || [],
        attachments: task.attachments || [],
      });

      setAssignees(task.assignees);
      setApprovers(task.approvers || []);
      setAttachments(task.attachments || []);

      if (task.attachments) {
        const size = task.attachments.reduce((sum, att) => sum + att.size, 0);
        setTotalAttachmentSize(size);
      }
    } catch (error) {
      console.error("Failed to load task:", error);
      toast.error("Failed to load task");
      setLocation("/task");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssignee = (type: "user" | "position" | "department", id: string, name: string) => {
    const newAssignee: Assignee = { type, id, name };
    const updated = [...assignees, newAssignee];
    setAssignees(updated);
    form.setValue("assignees", updated);
  };

  const handleRemoveAssignee = (index: number) => {
    const updated = assignees.filter((_, i) => i !== index);
    setAssignees(updated);
    form.setValue("assignees", updated);
  };

  const handleAddApprover = (userId: string, name: string) => {
    const order = approvers.length + 1;
    const newApprover: Approver = { userId, name, order };
    const updated = [...approvers, newApprover];
    setApprovers(updated);
    form.setValue("approvers", updated);
  };

  const handleRemoveApprover = (index: number) => {
    const updated = approvers.filter((_, i) => i !== index);
    // Reorder
    const reordered = updated.map((a, i) => ({ ...a, order: i + 1 }));
    setApprovers(reordered);
    form.setValue("approvers", reordered);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file size
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 5MB limit`);
        continue;
      }

      // Check total size
      if (totalAttachmentSize + file.size > 5 * 1024 * 1024) {
        toast.error("Total attachment size exceeds 5MB limit");
        break;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const attachment: Attachment = {
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64.split(",")[1], // Remove data:... prefix
        };

        const updated = [...attachments, attachment];
        setAttachments(updated);
        form.setValue("attachments", updated);
        setTotalAttachmentSize(totalAttachmentSize + file.size);
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    e.target.value = "";
  };

  const handleRemoveAttachment = (index: number) => {
    const attachment = attachments[index];
    const updated = attachments.filter((_, i) => i !== index);
    setAttachments(updated);
    form.setValue("attachments", updated);
    setTotalAttachmentSize(totalAttachmentSize - attachment.size);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const onSubmit = async (data: TaskInput) => {
    if (!user || !activeCompany) {
      toast.error("Please select a company first");
      return;
    }

    try {
      setSubmitting(true);

      if (taskId) {
        // Update existing task
        await TaskService.updateTask(taskId, data);
        toast.success("Task updated successfully");
      } else {
        // Create new task
        await TaskService.createTask(user._id, activeCompany._id, data);
        toast.success("Task created successfully");
      }

      // Dispatch event to reload tasks
      window.dispatchEvent(new Event("taskUpdated"));

      // Navigate back to tasks list
      setLocation("/task");
    } catch (error) {
      console.error("Failed to save task:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save task"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-700">No Company Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-600">
              Please select a company to create tasks.
            </p>
            <Button
              onClick={() => setLocation("/dashboard")}
              className="mt-4"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/task")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-3xl font-bold">
          {taskId ? "Edit Task" : "Create Task"}
        </h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter task title"
                        {...field}
                        disabled={submitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter task description"
                        rows={4}
                        {...field}
                        disabled={submitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        disabled={submitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Assignees */}
              <div className="space-y-3">
                <FormLabel>Assignees (Responsible)</FormLabel>
                <FormDescription>
                  Select users, positions, or departments responsible for this task
                </FormDescription>

                {assignees.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {assignees.map((assignee, index) => (
                      <Badge key={index} variant="outline" className="gap-2">
                        {assignee.type === "user" && "👤"}
                        {assignee.type === "position" && "💼"}
                        {assignee.type === "department" && "🏢"}
                        {assignee.name}
                        <X
                          className="size-3 cursor-pointer"
                          onClick={() => handleRemoveAssignee(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <Select
                    onValueChange={(value) => {
                      const user = companyUsers.find(u => u._id === value);
                      if (user) {
                        handleAddAssignee("user", user._id, user.fullname);
                      }
                    }}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add User" />
                    </SelectTrigger>
                    <SelectContent>
                      {companyUsers.map(u => (
                        <SelectItem key={u._id} value={u._id}>
                          {u.fullname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    onValueChange={(value) => {
                      const position = positions.find(p => p._id === value);
                      if (position) {
                        handleAddAssignee("position", position._id, position.title);
                      }
                    }}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add Position" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map(p => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    onValueChange={(value) => {
                      const dept = departments.find(d => d._id === value);
                      if (dept) {
                        handleAddAssignee("department", dept._id, dept.title);
                      }
                    }}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(d => (
                        <SelectItem key={d._id} value={d._id}>
                          {d.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <FormMessage>{form.formState.errors.assignees?.message}</FormMessage>
              </div>

              {/* Approvers */}
              <div className="space-y-3">
                <FormLabel>Approvers (Optional)</FormLabel>
                <FormDescription>
                  Select users who must approve task completion (in order)
                </FormDescription>

                {approvers.length > 0 && (
                  <div className="space-y-2">
                    {approvers.map((approver, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="secondary">#{approver.order}</Badge>
                        <Badge variant="outline" className="flex-1">
                          {approver.name}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveApprover(index)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Select
                  onValueChange={(value) => {
                    const user = companyUsers.find(u => u._id === value);
                    if (user) {
                      handleAddApprover(user._id, user.fullname);
                    }
                  }}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add Approver" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyUsers.map(u => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.fullname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Attachments */}
              <div className="space-y-3">
                <FormLabel>Attachments (Optional)</FormLabel>
                <FormDescription>
                  Upload files (max 5MB total)
                </FormDescription>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <span className="flex-1 text-sm truncate">{file.name}</span>
                        <Badge variant="secondary">{formatFileSize(file.size)}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAttachment(index)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="text-sm text-muted-foreground">
                      Total: {formatFileSize(totalAttachmentSize)} / 5 MB
                    </div>
                  </div>
                )}

                <div>
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    disabled={submitting || totalAttachmentSize >= 5 * 1024 * 1024}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Saving...
                    </>
                  ) : taskId ? (
                    "Update Task"
                  ) : (
                    "Create Task"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/task")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
