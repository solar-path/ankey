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
import type { OrgChartRow, OrgChartStatus, Department, Position, Appointment } from "./orgchart.types";
import {
  getDepartmentPermissions,
} from "./orgchart.types";
import { Button } from "@/lib/ui/button";
import { Badge } from "@/lib/ui/badge";
import { Input } from "@/lib/ui/input";
import { Building2, Search, Send, FileText, ChevronRight, ChevronDown, Plus, Users, UserCheck, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DepartmentCard } from "./components/DepartmentCard";
import { PositionCard } from "./components/PositionCard";
import { AppointmentCard } from "./components/AppointmentCard";
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

  useEffect(() => {
    loadOrgChart();
  }, [activeCompany, id]);

  const loadOrgChart = async () => {
    if (!activeCompany || !id || !user) return;

    try {
      setLoading(true);
      const rows = await OrgChartService.getOrgChartHierarchy(activeCompany._id, id);

      setOrgChartRows(rows);

      // Get orgchart status
      const orgChart = rows.find((r) => r.type === "orgchart");
      if (orgChart?.status) {
        setOrgChartStatus(orgChart.status);
      }

      // Auto-expand all on first load
      const allIds = new Set(rows.map(r => r._id));
      setExpandedIds(allIds);
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
        next.delete(id);
      } else {
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
          await OrgChartService.updateDepartment(activeCompany._id, docId, user._id, updates);
          break;
        case "position":
          await OrgChartService.updatePosition(activeCompany._id, docId, user._id, updates);
          break;
        case "appointment":
          await OrgChartService.updateAppointment(activeCompany._id, docId, user._id, updates);
          break;
      }

      toast.success("Updated successfully");
      await loadOrgChart();
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

      await OrgChartService.createDepartment(activeCompany._id, user._id, {
        orgChartId: id,
        title: parentId ? "New Sub-Department" : "New Department",
        description: "",
        headcount: 10,
        parentDepartmentId: parentId,
      });

      toast.success(parentId ? "Sub-department created" : "Department created");
      await loadOrgChart();
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

      await OrgChartService.createPosition(activeCompany._id, user._id, {
        orgChartId: id,
        departmentId: deptId,
        title: "New Position",
        description: "",
        salaryMin: 0,
        salaryMax: 0,
        salaryCurrency: "USD",
        salaryFrequency: "monthly",
      });

      toast.success("Position created with auto-generated code");
      await loadOrgChart();
    } catch (error: any) {
      toast.error(error.message || "Failed to create position");
    }
  };

  const handleAppointUser = async (row: OrgChartRow) => {
    if (!activeCompany || !user || !id || row.type !== "appointment") return;

    const userId = prompt("Enter User ID to appoint:");
    if (!userId) return;

    try {
      const appointmentId = row._id.split(":").pop()!;

      await OrgChartService.updateAppointment(activeCompany._id, appointmentId, user._id, {
        userId,
        isVacant: false,
      });

      toast.success("User appointed successfully");
      await loadOrgChart();
    } catch (error: any) {
      toast.error(error.message || "Failed to appoint user");
    }
  };

  const handleDelete = async (row: OrgChartRow) => {
    if (!activeCompany || !confirm(`Delete ${row.title}? This will cascade delete all children.`)) return;

    const docId = row._id.split(":").pop()!;

    try {
      switch (row.type) {
        case "department":
          await OrgChartService.deleteDepartment(activeCompany._id, docId);
          break;
        case "position":
          await OrgChartService.deletePosition(activeCompany._id, docId);
          break;
        case "appointment":
          await OrgChartService.deleteAppointment(activeCompany._id, docId);
          break;
      }

      toast.success("Deleted successfully");
      setSelectedRow(null);
      await loadOrgChart();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
  };

  const handleSubmitForApproval = async () => {
    if (!activeCompany || !user || !id) return;

    try {
      await OrgChartService.submitForApproval(activeCompany._id, id, user._id);
      toast.success("Submitted for approval");
      await loadOrgChart();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit");
    }
  };

  const handleApprove = async () => {
    if (!activeCompany || !user || !id) return;

    try {
      await OrgChartService.approve(activeCompany._id, id, user._id);
      toast.success("Approved successfully");
      await loadOrgChart();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve");
    }
  };

  const handleSaveOrgChart = async () => {
    if (!activeCompany || !user || !id) return;

    try {
      // Just reload to ensure sync
      await loadOrgChart();
      toast.success("Organizational chart saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save");
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
      const draggedId = draggedRow._id.split(":").pop()!;
      const targetId = targetRow._id.split(":").pop()!;

      // Update parent relationship
      switch (draggedRow.type) {
        case "department":
          await OrgChartService.updateDepartment(activeCompany._id, draggedId, user._id, {
            parentDepartmentId: targetId,
          });
          toast.success("Department moved successfully");
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

      await loadOrgChart();
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

  const handleGeneratePDF = async (row: OrgChartRow) => {
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
              PDFGeneratorFactory.generateJobOffer(
                appt,
                pos.original as unknown as Position,
                dept.original as unknown as Department,
                `User ${appt.userId}`,
                "123 Candidate St, City, State 12345"
              );
              toast.success("Job Offer PDF generated");
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
            <h1 className="text-2xl font-bold">{orgChart?.title || "Organizational Chart"}</h1>
            <p className="text-sm text-muted-foreground">{orgChart?.description}</p>
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

              {selectedRow.type === "position" && (() => {
                const dept = orgChartRows.find((r) => r.type === "department" && r._id === selectedRow.parentId);
                const departmentCode = dept?.code || "";
                return (
                  <PositionCard
                    position={selectedRow.original as unknown as Position}
                    departmentCode={departmentCode}
                    orgChartStatus={orgChartStatus}
                    onSave={(updates) => handleInlineEdit(selectedRow, updates)}
                    onDelete={() => handleDelete(selectedRow)}
                    onGeneratePDF={() => handleGeneratePDF(selectedRow)}
                  />
                );
              })()}

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
                    onGeneratePDF={() => handleGeneratePDF(selectedRow)}
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
