/**
 * Organizational Chart View Page
 * Split layout: Tree view (left) + Detail card (right)
 */

import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useCompany } from "@/lib/company-context";
import { OrgChartService } from "./orgchart-service";
import { PDFGeneratorFactory } from "./pdf-generator.service";
import { XLSXExportService } from "./xlsx-export.service";
import type { OrgChartRow, OrgChartStatus, Department, Position, Appointment } from "./orgchart.types";
import {
  getDepartmentPermissions,
} from "./orgchart.types";
import { Button } from "@/lib/ui/button";
import { Badge } from "@/lib/ui/badge";
import { Input } from "@/lib/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/lib/ui/dialog";
import { Building2, Search, Send, FileText, ChevronRight, ChevronDown, Plus, Users, UserCheck, Save, Trash2, ArrowUp, Copy, BarChart3, FileDown } from "lucide-react";
import { toast } from "sonner";
import { DepartmentCard } from "./components/DepartmentCard";
import { PositionCard } from "./components/PositionCard";
import { AppointmentCard } from "./components/AppointmentCard";
import { PayrollForecastChart } from "./components/PayrollForecastChart";
import { cn } from "@/lib/utils";

export default function OrgChartViewPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { activeCompany } = useCompany();

  const [orgChartRows, setOrgChartRows] = useState<OrgChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgChartStatus, setOrgChartStatus] = useState<OrgChartStatus>("draft");
  const [selectedRow, setSelectedRow] = useState<OrgChartRow | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set(["department", "position", "appointment"]));
  const [draggedRow, setDraggedRow] = useState<OrgChartRow | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; row: OrgChartRow } | null>(null);
  const [showPayrollForecast, setShowPayrollForecast] = useState(false);
  const [payrollForecastData, setPayrollForecastData] = useState<any>(null);

  useEffect(() => {
    loadOrgChart();
  }, [activeCompany, id]);

  const loadOrgChart = async (preserveExpandedState = false) => {
    if (!activeCompany || !id || !user) return;

    try {
      setLoading(true);
      const rows = await OrgChartService.getOrgChartHierarchy(activeCompany.id, id);

      setOrgChartRows(rows);

      // Get orgchart status
      const orgChart = rows.find((r) => r.type === "orgchart");
      if (orgChart?.status) {
        setOrgChartStatus(orgChart.status);
      }

      // Only reset expanded state on initial load
      if (!preserveExpandedState) {
        setExpandedIds(new Set());
      }
    } catch (error) {
      console.error("Failed to load orgchart:", error);
      toast.error("Failed to load organizational chart");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // Tree Filtering
  // ============================================================================

  const filteredRows = orgChartRows.filter((row) => {
    // Type filter
    if (!typeFilter.has(row.type)) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        row.title.toLowerCase().includes(query) ||
        row.description?.toLowerCase().includes(query) ||
        row.code?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Build tree structure
  const buildTree = (rows: OrgChartRow[], parentId?: string): OrgChartRow[] => {
    return rows
      .filter((row) => row.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        // Collapse: remove this id and all its descendants
        const idsToRemove = new Set<string>();

        const collectDescendants = (parentId: string) => {
          orgChartRows
            .filter(row => row.parentId === parentId)
            .forEach(row => {
              idsToRemove.add(row._id);
              collectDescendants(row._id);
            });
        };

        collectDescendants(id);
        next.delete(id);
        idsToRemove.forEach(id => next.delete(id));
      } else {
        // Expand: only add direct children (1 level)
        next.add(id);
      }
      return next;
    });
  };

  const toggleTypeFilter = (type: string) => {
    setTypeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleInlineEdit = async (row: OrgChartRow, updates: Partial<any>) => {
    if (!activeCompany || !user) return;

    const docId = row._id.split(":").pop()!;

    try {
      switch (row.type) {
        case "department":
          await OrgChartService.updateDepartment(activeCompany.id, docId, user._id, updates);
          break;
        case "position":
          await OrgChartService.updatePosition(activeCompany.id, docId, user._id, updates);
          break;
        case "appointment":
          await OrgChartService.updateAppointment(activeCompany.id, docId, user._id, updates);
          break;
      }

      toast.success("Updated successfully");
      await loadOrgChart(true); // Preserve expanded state
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
      throw error;
    }
  };

  const handleAddDepartment = async (parent?: OrgChartRow) => {
    if (!activeCompany || !user || !id || saving) return;

    try {
      setSaving(true);
      const parentId = parent?.type === "department" ? parent._id.split(":").pop() : undefined;

      // Create empty department with default values
      const result = await OrgChartService.createDepartment(activeCompany.id, user._id, {
        orgChartId: id,
        title: parentId ? "New Sub-Department" : "New Department",
        description: "",
        code: `DEPT-${Date.now()}`, // Temporary unique code
        headcount: 1,
        parentDepartmentId: parentId,
      });

      toast.success(parentId ? "Sub-department created" : "Department created");

      // Reload and auto-select the newly created department
      const rows = await OrgChartService.getOrgChartHierarchy(activeCompany.id, id);
      setOrgChartRows(rows);

      const newDeptRow = rows.find(
        (r) => r.type === "department" && r._id === result.department._id
      );

      if (newDeptRow) {
        setSelectedRow(newDeptRow);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create department");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPosition = async (parent: OrgChartRow) => {
    if (!activeCompany || !user || !id || parent.type !== "department") return;

    try {
      const deptId = parent._id.split(":").pop()!;

      const result = await OrgChartService.createPosition(activeCompany.id, user._id, {
        orgChartId: id,
        departmentId: deptId,
        title: "New Position",
        description: "",
        salaryMin: 1, // Default minimum salary
        salaryMax: 2, // Default maximum salary (must be > min)
        salaryCurrency: "USD",
        salaryFrequency: "monthly",
      });

      toast.success("Position created with auto-generated code");

      // Reload and auto-select the newly created position
      const rows = await OrgChartService.getOrgChartHierarchy(activeCompany.id, id);
      setOrgChartRows(rows);

      const newPosRow = rows.find(
        (r) => r.type === "position" && r._id === result._id
      );

      if (newPosRow) {
        setSelectedRow(newPosRow);
      }
    } catch (error: any) {
      // Display error message from service (includes headcount details)
      toast.error(error.message || "Failed to create position");
    }
  };

  const handleDelete = async (row: OrgChartRow) => {
    if (!activeCompany || !confirm(`Delete ${row.title}? This will cascade delete all children.`)) return;

    const docId = row._id.split(":").pop()!;

    try {
      switch (row.type) {
        case "department":
          await OrgChartService.deleteDepartment(activeCompany.id, docId);
          break;
        case "position":
          await OrgChartService.deletePosition(activeCompany.id, docId);
          break;
        case "appointment":
          await OrgChartService.deleteAppointment(activeCompany.id, docId);
          break;
      }

      toast.success("Deleted successfully");
      setSelectedRow(null);
      await loadOrgChart(true); // Preserve expanded state
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
  };

  const handleDuplicate = async (row: OrgChartRow) => {
    if (!activeCompany || !user || !id) return;

    try {
      switch (row.type) {
        case "department": {
          const dept = row.original as unknown as Department;
          await OrgChartService.createDepartment(activeCompany.id, user._id, {
            orgChartId: id,
            title: `${dept.title} (Copy)`,
            description: dept.description || "",
            code: `${dept.code || ""}-COPY`,
            headcount: dept.headcount,
            parentDepartmentId: dept.parentDepartmentId,
          });
          toast.success("Department duplicated");
          break;
        }

        case "position": {
          const pos = row.original as unknown as Position;
          await OrgChartService.createPosition(activeCompany.id, user._id, {
            orgChartId: id,
            departmentId: pos.departmentId,
            title: `${pos.title} (Copy)`,
            description: pos.description || "",
            salaryMin: pos.salaryMin,
            salaryMax: pos.salaryMax,
            salaryCurrency: pos.salaryCurrency,
            salaryFrequency: pos.salaryFrequency,
          });
          toast.success("Position duplicated");
          break;
        }

        case "appointment": {
          const appt = row.original as unknown as Appointment;
          await OrgChartService.createAppointment(activeCompany.id, user._id, {
            orgChartId: id,
            departmentId: appt.departmentId,
            positionId: appt.positionId,
            userId: appt.userId,
            isVacant: appt.isVacant,
            jobOffer: appt.jobOffer,
          });
          toast.success("Appointment duplicated");
          break;
        }
      }

      await loadOrgChart(true); // Preserve expanded state
    } catch (error: any) {
      toast.error(error.message || "Failed to duplicate");
    }
  };

  const handleSubmitForApproval = async () => {
    if (!activeCompany || !user || !id) return;

    try {
      // Use the new approval service
      const { OrgChartApprovalService } = await import("./orgchart-approval.service");
      await OrgChartApprovalService.submitForApproval(activeCompany.id, id, user._id);

      toast.success("Submitted for approval");
      await loadOrgChart(true); // Preserve expanded state
    } catch (error: any) {
      toast.error(error.message || "Failed to submit");
    }
  };

  const handleApprove = async () => {
    if (!activeCompany || !user || !id) return;

    try {
      toast.info("Approval workflow is now managed through the Tasks page. Please check your tasks.");
      // Note: Approval is now done through tasks, not directly here
    } catch (error: any) {
      toast.error(error.message || "Failed to approve");
    }
  };

  const handleSaveOrgChart = async () => {
    if (!activeCompany || !user || !id) return;

    try {
      // Just reload to ensure sync
      await loadOrgChart(true); // Preserve expanded state
      toast.success("Organizational chart saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save");
    }
  };

  // ============================================================================
  // Report Generation Handlers
  // ============================================================================

  const handleExportToPDF = async () => {
    if (!activeCompany || !id) return;

    try {
      PDFGeneratorFactory.setCompanyInfo({
        name: activeCompany.title,
        email: "hr@company.com",
        phone: "+1 (555) 123-4567",
        address: "123 Business St, City, State 12345",
      });

      const orgChart = orgChartRows.find((r) => r.type === "orgchart");
      const orgChartTitle = orgChart?.title || "Organizational Chart";

      PDFGeneratorFactory.generateOrgChartTable(orgChartRows, orgChartTitle);
      toast.success("PDF generated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate PDF");
    }
  };

  const handleExportToExcel = async () => {
    if (!activeCompany || !id) return;

    try {
      const orgChart = orgChartRows.find((r) => r.type === "orgchart");
      const orgChartTitle = orgChart?.title || "Organizational Chart";

      XLSXExportService.exportOrgChartToExcel(orgChartRows, orgChartTitle);
      toast.success("Excel file generated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate Excel file");
    }
  };

  const handleShowPayrollForecast = async () => {
    if (!activeCompany || !id) return;

    try {
      const data = await OrgChartService.getPayrollForecast(activeCompany.id, id);
      setPayrollForecastData(data);
      setShowPayrollForecast(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to load payroll forecast");
    }
  };

  // ============================================================================
  // Drag and Drop Handlers
  // ============================================================================

  const handleDragStart = (e: React.DragEvent, row: OrgChartRow) => {
    setDraggedRow(row);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetRow: OrgChartRow) => {
    e.preventDefault();
    if (!draggedRow || !activeCompany || !user) return;

    // Prevent dropping on self
    if (draggedRow._id === targetRow._id) {
      setDraggedRow(null);
      return;
    }

    // Validate drop target based on types
    const validDrops: Record<string, string[]> = {
      department: ["department"], // Can only drop department on department (for nesting)
      position: ["department"], // Can only drop position on department
      appointment: ["position"], // Can only drop appointment on position
    };

    if (!validDrops[draggedRow.type]?.includes(targetRow.type)) {
      toast.error(`Cannot drop ${draggedRow.type} on ${targetRow.type}`);
      setDraggedRow(null);
      return;
    }

    try {
      // Update parent relationship
      switch (draggedRow.type) {
        case "department":
          // TODO: Department hierarchy not yet implemented
          toast.info("Moving departments not yet supported");
          break;

        case "position":
          // Positions can be moved to different departments
          // Need to recreate with new departmentId
          toast.info("Moving positions between departments requires recreation");
          break;

        case "appointment":
          // Appointments can be moved to different positions
          toast.info("Moving appointments between positions requires recreation");
          break;
      }

      await loadOrgChart(true); // Preserve expanded state
    } catch (error: any) {
      toast.error(error.message || "Failed to move item");
    } finally {
      setDraggedRow(null);
    }
  };

  // ============================================================================
  // Context Menu Handlers
  // ============================================================================

  const handleContextMenu = (e: React.MouseEvent, row: OrgChartRow) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, row });
  };

  const handleContextMenuAction = async (action: string, row: OrgChartRow) => {
    setContextMenu(null);

    switch (action) {
      case "create-subdepartment":
        if (row.type === "department") {
          await handleAddDepartment(row);
        }
        break;

      case "create-position":
        if (row.type === "department") {
          await handleAddPosition(row);
        }
        break;

      case "create-appointment":
        if (row.type === "position") {
          toast.info("Appointments are auto-created with positions");
        }
        break;

      case "duplicate":
        await handleDuplicate(row);
        break;

      case "delete":
        await handleDelete(row);
        break;
    }
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  // ============================================================================
  // PDF Generation
  // ============================================================================

  const handleGeneratePDF = async (row: OrgChartRow, pdfType?: "jobOffer" | "employmentContract" | "terminationNotice") => {
    if (!activeCompany) return;

    try {
      PDFGeneratorFactory.setCompanyInfo({
        name: activeCompany.title,
        email: "hr@company.com",
        phone: "+1 (555) 123-4567",
        address: "123 Business St, City, State 12345",
      });

      const orgChart = orgChartRows.find((r) => r.type === "orgchart");
      const orgChartTitle = orgChart?.title || "Organizational Chart";

      switch (row.type) {
        case "department": {
          const dept = row.original as unknown as Department;
          PDFGeneratorFactory.generateDepartmentCharter(dept, orgChartTitle);
          toast.success("Department Charter PDF generated");
          break;
        }

        case "position": {
          const pos = row.original as unknown as Position;
          const dept = orgChartRows.find((r) => r.type === "department" && r._id === row.parentId);
          if (dept) {
            PDFGeneratorFactory.generateJobDescription(
              pos,
              dept.original as unknown as Department,
              orgChartTitle
            );
            toast.success("Job Description PDF generated");
          }
          break;
        }

        case "appointment": {
          const appt = row.original as unknown as Appointment;
          const pos = orgChartRows.find((r) => r.type === "position" && r._id === row.parentId);
          if (pos) {
            const dept = orgChartRows.find((r) => r.type === "department" && r._id === pos.parentId);
            if (dept && !appt.isVacant) {
              // Get user name from title (format: "User: {name}") or fallback to userId
              const userName = row.title.startsWith("User: ")
                ? row.title.replace("User: ", "")
                : appt.userId || "Unknown User";
              const userAddress = "123 Employee St, City, State 12345"; // TODO: Get from user profile

              switch (pdfType) {
                case "jobOffer":
                  PDFGeneratorFactory.generateJobOffer(
                    appt,
                    pos.original as unknown as Position,
                    dept.original as unknown as Department,
                    userName,
                    userAddress
                  );
                  toast.success("Job Offer PDF generated");
                  break;

                case "employmentContract":
                  PDFGeneratorFactory.generateEmploymentContract(
                    appt,
                    pos.original as unknown as Position,
                    dept.original as unknown as Department,
                    userName,
                    userAddress,
                    appt.userId || "N/A"
                  );
                  toast.success("Employment Contract PDF generated");
                  break;

                case "terminationNotice":
                  // Use the termination date from appointment, or current date as fallback
                  const terminationDate = appt.employmentEndedAt
                    ? new Date(appt.employmentEndedAt)
                    : new Date();

                  PDFGeneratorFactory.generateTerminationNotice(
                    appt,
                    pos.original as unknown as Position,
                    dept.original as unknown as Department,
                    userName,
                    appt.userId || "N/A",
                    terminationDate,
                    appt.terminationReason
                  );
                  toast.success("Termination Notice PDF generated");
                  break;

                default:
                  // Default to job offer for backward compatibility
                  PDFGeneratorFactory.generateJobOffer(
                    appt,
                    pos.original as unknown as Position,
                    dept.original as unknown as Department,
                    userName,
                    userAddress
                  );
                  toast.success("Job Offer PDF generated");
              }
            }
          }
          break;
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate PDF");
    }
  };

  // ============================================================================
  // Tree Row Component
  // ============================================================================

  const TreeRow = ({ row, level = 0 }: { row: OrgChartRow; level?: number }) => {
    const isExpanded = expandedIds.has(row._id);
    const isSelected = selectedRow?._id === row._id;
    const isDragging = draggedRow?._id === row._id;
    const children = buildTree(filteredRows, row._id);

    const typeIcons = {
      orgchart: <Building2 className="size-4 text-blue-500" />,
      department: <Building2 className="size-4 text-green-500" />,
      position: <Users className="size-4 text-orange-500" />,
      appointment: <UserCheck className="size-4 text-purple-500" />,
    };

    // Get display title with code
    const getDisplayTitle = () => {
      if (row.type === "department" || row.type === "position") {
        return row.code ? `${row.title} (${row.code})` : row.title;
      }
      return row.title;
    };

    // Get reporting relationship info
    const getReportsToPosition = () => {
      if (row.type === "position" && row.reportsToPositionId) {
        const manager = orgChartRows.find(
          (r) => r.type === "position" && r._id.split(":").pop() === row.reportsToPositionId
        );
        return manager;
      }
      return null;
    };

    const reportsTo = getReportsToPosition();

    return (
      <>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, row)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, row)}
          onContextMenu={(e) => handleContextMenu(e, row)}
          className={cn(
            "group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-accent/50 transition-colors",
            isSelected && "bg-accent",
            isDragging && "opacity-50"
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => setSelectedRow(row)}
        >
          {/* Expand/Collapse */}
          {row.hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(row._id);
              }}
              className="p-0.5 hover:bg-accent rounded"
            >
              {isExpanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}

          {/* Icon */}
          {typeIcons[row.type]}

          {/* Title */}
          <span className="flex-1 text-sm truncate">{getDisplayTitle()}</span>

          {/* Reporting indicator */}
          {reportsTo && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground" title={`Reports to: ${reportsTo.title}`}>
              <ArrowUp className="size-3" />
              <span className="max-w-[100px] truncate">{reportsTo.title}</span>
            </div>
          )}

          {/* Badges */}
          {row.isVacant && (
            <Badge variant="outline" className="text-xs">
              Vacant
            </Badge>
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {row.type === "department" && getDepartmentPermissions(orgChartStatus).canCreate && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddDepartment(row);
                  }}
                  title="Add Sub-Department"
                >
                  <Building2 className="size-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddPosition(row);
                  }}
                  title="Add Position"
                >
                  <Plus className="size-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Children */}
        {isExpanded && children.map((child) => (
          <TreeRow key={child._id} row={child} level={level + 1} />
        ))}
      </>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading organizational chart...</p>
      </div>
    );
  }

  const orgChart = orgChartRows.find((r) => r.type === "orgchart");
  const rootRows = buildTree(filteredRows);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Organizational Chart</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-lg font-semibold text-foreground">{orgChart?.title}</p>
              {orgChart?.version && (
                <Badge variant="outline" className="text-xs">
                  v{orgChart.version}
                </Badge>
              )}
            </div>
            {orgChart?.description && (
              <p className="text-sm text-muted-foreground mt-1">{orgChart.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {getDepartmentPermissions(orgChartStatus).canCreate && (
              <Button onClick={() => handleAddDepartment()} variant="outline" size="sm">
                <Building2 className="size-4 mr-2" />
                Add Department
              </Button>
            )}

            <Button onClick={handleSaveOrgChart} variant="outline" size="sm">
              <Save className="size-4 mr-2" />
              Save
            </Button>

            {/* Reports Menu */}
            <Button onClick={handleExportToPDF} variant="outline" size="sm" title="Export to PDF">
              <FileDown className="size-4 mr-2" />
              PDF
            </Button>

            <Button onClick={handleExportToExcel} variant="outline" size="sm" title="Export to Excel">
              <FileDown className="size-4 mr-2" />
              Excel
            </Button>

            <Dialog open={showPayrollForecast} onOpenChange={setShowPayrollForecast}>
              <DialogTrigger asChild>
                <Button onClick={handleShowPayrollForecast} variant="outline" size="sm" title="Payroll Forecast">
                  <BarChart3 className="size-4 mr-2" />
                  Payroll Forecast
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl">
                <DialogHeader>
                  <DialogTitle>Payroll Forecast</DialogTitle>
                  <DialogDescription>
                    18-month payroll projection based on current organizational structure
                  </DialogDescription>
                </DialogHeader>
                {payrollForecastData && (
                  <PayrollForecastChart data={payrollForecastData} currency="USD" />
                )}
              </DialogContent>
            </Dialog>

            {orgChartStatus === "draft" && (
              <Button onClick={handleSubmitForApproval} size="sm">
                <Send className="size-4 mr-2" />
                Submit for Approval
              </Button>
            )}

            {orgChartStatus === "pending_approval" && (
              <Button onClick={handleApprove} size="sm">
                <FileText className="size-4 mr-2" />
                Approve
              </Button>
            )}

            <Badge
              className={
                orgChartStatus === "draft"
                  ? "bg-gray-100 text-gray-800"
                  : orgChartStatus === "pending_approval"
                  ? "bg-yellow-100 text-yellow-800"
                  : orgChartStatus === "approved"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }
            >
              {orgChartStatus}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content: Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Tree View */}
        <div className="w-2/5 border-r flex flex-col">
          {/* Search & Filters */}
          <div className="p-4 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search org chart..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Show:</span>
              <Button
                size="sm"
                variant={typeFilter.has("department") ? "default" : "outline"}
                onClick={() => toggleTypeFilter("department")}
                className="h-7 text-xs"
              >
                <Building2 className="size-3 mr-1" />
                Departments
              </Button>
              <Button
                size="sm"
                variant={typeFilter.has("position") ? "default" : "outline"}
                onClick={() => toggleTypeFilter("position")}
                className="h-7 text-xs"
              >
                <Users className="size-3 mr-1" />
                Positions
              </Button>
              <Button
                size="sm"
                variant={typeFilter.has("appointment") ? "default" : "outline"}
                onClick={() => toggleTypeFilter("appointment")}
                className="h-7 text-xs"
              >
                <UserCheck className="size-3 mr-1" />
                Appointments
              </Button>
            </div>
          </div>

          {/* Tree */}
          <div className="flex-1 overflow-y-auto p-4">
            {rootRows.length > 0 ? (
              rootRows.map((row) => <TreeRow key={row._id} row={row} />)
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">
                No items found. Try adjusting your filters.
              </div>
            )}
          </div>
        </div>

        {/* Right: Detail Card */}
        <div className="w-3/5 overflow-y-auto p-6">
          {selectedRow ? (
            <>
              {selectedRow.type === "department" && (
                <DepartmentCard
                  department={selectedRow.original as unknown as Department}
                  orgChartStatus={orgChartStatus}
                  onSave={(updates) => handleInlineEdit(selectedRow, updates)}
                  onDelete={() => handleDelete(selectedRow)}
                  onGeneratePDF={() => handleGeneratePDF(selectedRow)}
                />
              )}

              {selectedRow.type === "position" && (
                <PositionCard
                  position={selectedRow.original as unknown as Position}
                  orgChartStatus={orgChartStatus}
                  onSave={(updates) => handleInlineEdit(selectedRow, updates)}
                  onDelete={() => handleDelete(selectedRow)}
                  onGeneratePDF={() => handleGeneratePDF(selectedRow)}
                />
              )}

              {selectedRow.type === "appointment" && (() => {
                const pos = orgChartRows.find((r) => r.type === "position" && r._id === selectedRow.parentId);
                if (!pos) return null;
                return (
                  <AppointmentCard
                    appointment={selectedRow.original as unknown as Appointment}
                    position={pos.original as unknown as Position}
                    orgChartStatus={orgChartStatus}
                    onSave={(updates) => handleInlineEdit(selectedRow, updates)}
                    onDelete={() => handleDelete(selectedRow)}
                    onGeneratePDF={(type) => handleGeneratePDF(selectedRow, type)}
                  />
                );
              })()}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center space-y-2">
                <Building2 className="size-12 mx-auto opacity-20" />
                <p className="text-sm">Select an item from the tree to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-popover border rounded-md shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.row.type === "department" && getDepartmentPermissions(orgChartStatus).canCreate && (
            <>
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                onClick={() => handleContextMenuAction("create-subdepartment", contextMenu.row)}
              >
                <Building2 className="size-4" />
                Create Sub-Department
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                onClick={() => handleContextMenuAction("create-position", contextMenu.row)}
              >
                <Plus className="size-4" />
                Create Position
              </button>
            </>
          )}

          {contextMenu.row.type === "position" && (
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
              onClick={() => handleContextMenuAction("create-appointment", contextMenu.row)}
            >
              <UserCheck className="size-4" />
              Create Appointment
            </button>
          )}

          {/* Duplicate option for all types */}
          <div className="border-t my-1" />
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
            onClick={() => handleContextMenuAction("duplicate", contextMenu.row)}
          >
            <Copy className="size-4" />
            Duplicate {contextMenu.row.type}
          </button>

          {((contextMenu.row.type === "department" && getDepartmentPermissions(orgChartStatus).canDelete) ||
            (contextMenu.row.type === "position") ||
            (contextMenu.row.type === "appointment")) && (
            <>
              <div className="border-t my-1" />
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-accent text-destructive flex items-center gap-2"
                onClick={() => handleContextMenuAction("delete", contextMenu.row)}
              >
                <Trash2 className="size-4" />
                Delete {contextMenu.row.type}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
