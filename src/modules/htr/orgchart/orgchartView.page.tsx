/**
 * Organizational Chart View Page
 * Displays hierarchical org structure with inline editing (Asana-style)
 */

import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useCompany } from "@/lib/company-context";
import { OrgChartService } from "./orgchart-service";
import { PDFGeneratorFactory } from "./pdf-generator.service";
import { QTableHierarchical } from "@/lib/ui/QTableHierarchical.ui.tsx";
import type { ColumnDef } from "@tanstack/react-table";
import type { OrgChartRow, OrgChartStatus, Department, Position, Appointment } from "./orgchart.types";
import {
  getOrgChartPermissions,
  getDepartmentPermissions,
  getPositionPermissions,
  getAppointmentPermissions,
} from "./orgchart.types";
import { Button } from "@/lib/ui/button";
import { Badge } from "@/lib/ui/badge";
import { Building2, Users, UserCheck, Trash2, FileText, Send, FileDown } from "lucide-react";
import { toast } from "sonner";

export default function OrgChartViewPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { activeCompany } = useCompany();

  const [orgChartRows, setOrgChartRows] = useState<OrgChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgChartStatus, setOrgChartStatus] = useState<OrgChartStatus>("draft");

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
    } catch (error) {
      console.error("Failed to load orgchart:", error);
      toast.error("Failed to load organizational chart");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleInlineEdit = async (row: OrgChartRow, field: string, value: any) => {
    if (!activeCompany || !user) return;

    const docId = row._id.split(":").pop()!;

    try {
      switch (row.type) {
        case "orgchart":
          await OrgChartService.updateOrgChart(activeCompany._id, docId, user._id, { [field]: value });
          break;
        case "department":
          await OrgChartService.updateDepartment(activeCompany._id, docId, user._id, { [field]: value });
          break;
        case "position":
          await OrgChartService.updatePosition(activeCompany._id, docId, user._id, { [field]: value });
          break;
        case "appointment":
          await OrgChartService.updateAppointment(activeCompany._id, docId, user._id, { [field]: value });
          break;
      }

      toast.success("Updated successfully");
      await loadOrgChart();
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
      throw error;
    }
  };

  const handleAddDepartment = async (parent: OrgChartRow) => {
    if (!activeCompany || !user || !id) return;

    try {
      const parentId = parent.type === "orgchart" ? undefined : parent._id.split(":").pop();

      await OrgChartService.createDepartment(activeCompany._id, user._id, {
        orgChartId: id,
        title: "New Department",
        description: "",
        headcount: 10,
        parentDepartmentId: parentId,
      });

      toast.success("Department created");
      await loadOrgChart();
    } catch (error: any) {
      toast.error(error.message || "Failed to create department");
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

      toast.success("Position created");
      await loadOrgChart();
    } catch (error: any) {
      toast.error(error.message || "Failed to create position");
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

  // ============================================================================
  // PDF Generation Handlers
  // ============================================================================

  const handleGeneratePDF = async (row: OrgChartRow) => {
    if (!activeCompany) return;

    try {
      // Set company info for PDF
      PDFGeneratorFactory.setCompanyInfo({
        name: activeCompany.title,
        email: "hr@company.com", // TODO: Get from company settings
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
          // Find parent department
          const dept = orgChartRows.find(
            (r) => r.type === "department" && r._id === row.parentId
          );
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
          // Find parent position and department
          const pos = orgChartRows.find(
            (r) => r.type === "position" && r._id === row.parentId
          );
          if (pos) {
            const dept = orgChartRows.find(
              (r) => r.type === "department" && r._id === pos.parentId
            );
            if (dept && !appt.isVacant) {
              // Job Offer
              PDFGeneratorFactory.generateJobOffer(
                appt,
                pos.original as unknown as Position,
                dept.original as unknown as Department,
                `User ${appt.userId}`, // TODO: Get user name from users DB
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
  // Table Configuration
  // ============================================================================

  const columns: ColumnDef<OrgChartRow>[] = [
    {
      id: "title",
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const typeIcons = {
          orgchart: <Building2 className="size-4 text-blue-500" />,
          department: <Building2 className="size-4 text-green-500" />,
          position: <Users className="size-4 text-orange-500" />,
          appointment: <UserCheck className="size-4 text-purple-500" />,
        };

        return (
          <div className="flex items-center gap-2">
            {typeIcons[row.original.type]}
            <span className="font-medium">{row.original.title}</span>
            {row.original.isVacant && (
              <Badge variant="outline" className="text-xs">
                Vacant
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "description",
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.description || "-"}</span>
      ),
    },
    {
      id: "code",
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="text-xs font-mono">{row.original.code || "-"}</span>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        if (row.original.type !== "orgchart") return null;

        const statusColors = {
          draft: "bg-gray-100 text-gray-800",
          pending_approval: "bg-yellow-100 text-yellow-800",
          approved: "bg-green-100 text-green-800",
          revoked: "bg-red-100 text-red-800",
        };

        return (
          <Badge className={statusColors[row.original.status as OrgChartStatus]}>
            {row.original.status}
          </Badge>
        );
      },
    },
  ];

  const inlineEditConfig = [
    {
      field: "title" as keyof OrgChartRow,
      type: "text" as const,
      onSave: (row: OrgChartRow, value: string) => handleInlineEdit(row, "title", value),
      canEdit: (row: OrgChartRow) => {
        switch (row.type) {
          case "orgchart":
            return getOrgChartPermissions(orgChartStatus).canUpdate;
          case "department":
            return getDepartmentPermissions(orgChartStatus).canUpdate;
          case "position":
            return getPositionPermissions(orgChartStatus).canUpdate;
          case "appointment":
            return getAppointmentPermissions(orgChartStatus).canUpdate;
          default:
            return false;
        }
      },
    },
    {
      field: "description" as keyof OrgChartRow,
      type: "text" as const,
      onSave: (row: OrgChartRow, value: string) => handleInlineEdit(row, "description", value),
      canEdit: (row: OrgChartRow) => {
        switch (row.type) {
          case "orgchart":
            return getOrgChartPermissions(orgChartStatus).canUpdate;
          case "department":
            return getDepartmentPermissions(orgChartStatus).canUpdate;
          case "position":
            return getPositionPermissions(orgChartStatus).canUpdate;
          case "appointment":
            return false; // Appointments don't have description
          default:
            return false;
        }
      },
    },
  ];

  const rowActions = [
    {
      label: "Add Department",
      icon: <Building2 className="size-4" />,
      onClick: handleAddDepartment,
      show: (row: OrgChartRow) =>
        (row.type === "orgchart" || row.type === "department") &&
        getDepartmentPermissions(orgChartStatus).canCreate,
    },
    {
      label: "Add Position",
      icon: <Users className="size-4" />,
      onClick: handleAddPosition,
      show: (row: OrgChartRow) =>
        row.type === "department" && getPositionPermissions(orgChartStatus).canCreate,
    },
    {
      label: "Generate PDF",
      icon: <FileDown className="size-4" />,
      onClick: handleGeneratePDF,
      show: (row: OrgChartRow) => {
        // Show for department (charter), position (job desc), appointment (job offer)
        if (row.type === "department") return true;
        if (row.type === "position") return true;
        if (row.type === "appointment" && !row.isVacant) return true;
        return false;
      },
    },
    {
      label: "Delete",
      icon: <Trash2 className="size-4" />,
      onClick: handleDelete,
      variant: "destructive" as const,
      show: (row: OrgChartRow) => {
        switch (row.type) {
          case "orgchart":
            return false; // Never delete orgchart
          case "department":
            return getDepartmentPermissions(orgChartStatus).canDelete;
          case "position":
            return getPositionPermissions(orgChartStatus).canDelete;
          case "appointment":
            return getAppointmentPermissions(orgChartStatus).canDelete;
          default:
            return false;
        }
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading organizational chart...</p>
      </div>
    );
  }

  const orgChart = orgChartRows.find((r) => r.type === "orgchart");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{orgChart?.title || "Organizational Chart"}</h1>
          <p className="text-muted-foreground">{orgChart?.description}</p>
        </div>

        <div className="flex items-center gap-2">
          {orgChartStatus === "draft" && (
            <Button onClick={handleSubmitForApproval}>
              <Send className="size-4 mr-2" />
              Submit for Approval
            </Button>
          )}

          {orgChartStatus === "pending_approval" && (
            <Button onClick={handleApprove}>
              <FileText className="size-4 mr-2" />
              Approve
            </Button>
          )}

          <Badge className={
            orgChartStatus === "draft" ? "bg-gray-100 text-gray-800" :
            orgChartStatus === "pending_approval" ? "bg-yellow-100 text-yellow-800" :
            orgChartStatus === "approved" ? "bg-green-100 text-green-800" :
            "bg-red-100 text-red-800"
          }>
            {orgChartStatus}
          </Badge>
        </div>
      </div>

      {/* Table */}
      <QTableHierarchical
        columns={columns}
        data={orgChartRows}
        searchable
        searchPlaceholder="Search organizational chart..."
        defaultExpanded
        indentSize={32}
        inlineEdit={inlineEditConfig}
        rowActions={rowActions}
        emptyMessage="No organizational structure found. Create departments to get started."
      />
    </div>
  );
}
