/**
 * Organizational Charts List Page
 * Displays all orgcharts for the active company
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useCompany } from "@/lib/company-context";
import { OrgChartService } from "./orgchart-service";
import type { OrgChart } from "./orgchart.types";
import { QTable } from "@/lib/ui/QTable.ui";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/lib/ui/badge";
import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/input";
import { Label } from "@/lib/ui/label";
import { Textarea } from "@/lib/ui/textarea";
import { Plus, Eye, MoreHorizontal, Copy, Send, Edit } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/lib/ui/dialog";

// Extended OrgChart type with statistics
interface OrgChartWithStats extends OrgChart {
  stats?: {
    departments: number;
    positions: number;
    appointments: number;
    totalHeadcount: number;
    vacancies: number;
  };
}

export default function OrgChartListPage() {
  const { user } = useAuth();
  const { activeCompany } = useCompany();
  const [, setLocation] = useLocation();
  const [orgCharts, setOrgCharts] = useState<OrgChartWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedChart, setSelectedChart] = useState<OrgChart | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [renameDescription, setRenameDescription] = useState("");

  useEffect(() => {
    loadOrgCharts();
  }, [activeCompany]);

  const loadOrgCharts = async () => {
    if (!activeCompany || !user) return;

    try {
      setLoading(true);
      const charts = await OrgChartService.getCompanyOrgCharts(activeCompany._id);

      // Load statistics for each orgchart
      const chartsWithStats = await Promise.all(
        charts.map(async (chart) => {
          try {
            const hierarchy = await OrgChartService.getOrgChartHierarchy(activeCompany._id, chart.id);

            const departments = hierarchy.filter((n: any) => n.type === 'department').length;
            const positions = hierarchy.filter((n: any) => n.type === 'position').length;
            const appointments = hierarchy.filter((n: any) => n.type === 'position' && !n.isVacant).length;
            const vacancies = hierarchy.filter((n: any) => n.type === 'position' && n.isVacant).length;

            // Calculate total headcount from all departments
            const totalHeadcount = hierarchy
              .filter((n: any) => n.type === 'department')
              .reduce((sum: number, dept: any) => sum + (dept.headcount || 0), 0);

            return {
              ...chart,
              stats: {
                departments,
                positions,
                appointments,
                totalHeadcount,
                vacancies,
              },
            } as OrgChartWithStats;
          } catch (error) {
            console.error(`Failed to load stats for orgchart ${chart.id}:`, error);
            return chart as OrgChartWithStats;
          }
        })
      );

      setOrgCharts(chartsWithStats);
    } catch (error) {
      console.error("Failed to load orgcharts:", error);
      toast.error("Failed to load organizational charts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrgChart = async () => {
    if (!activeCompany || !user) return;

    try {
      await OrgChartService.createOrgChart(activeCompany._id, user._id, {
        title: `Organizational Chart ${new Date().getFullYear()}`,
        description: "New organizational structure",
      });

      toast.success("Organizational chart created");
      await loadOrgCharts();
    } catch (error: any) {
      toast.error(error.message || "Failed to create orgchart");
    }
  };

  const handleRowClick = (chart: OrgChart) => {
    setLocation(`/orgchart/${chart.id}`);
  };

  const handleDuplicate = async (chart: OrgChart, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeCompany || !user) return;

    try {
      await OrgChartService.duplicateOrgChart(activeCompany._id, chart.id, user._id);
      toast.success("Organizational chart duplicated successfully");
      await loadOrgCharts();
    } catch (error: any) {
      toast.error(error.message || "Failed to duplicate orgchart");
    }
  };

  const handleSendForApproval = async (chart: OrgChart, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeCompany || !user) return;

    // Only draft charts can be sent for approval
    if (chart.status !== "draft") {
      toast.error("Only draft charts can be sent for approval");
      return;
    }

    try {
      // Use the new approval service
      const { OrgChartApprovalService } = await import("./orgchart-approval.service");
      await OrgChartApprovalService.submitForApproval(activeCompany._id, chart.id, user._id);

      toast.success("Organizational chart sent for approval");
      await loadOrgCharts();
    } catch (error: any) {
      toast.error(error.message || "Failed to send for approval");
    }
  };

  const handleOpenRenameDialog = (chart: OrgChart, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedChart(chart);
    setRenameTitle(chart.title);
    setRenameDescription(chart.description || "");
    setRenameDialogOpen(true);
  };

  const handleRename = async () => {
    if (!selectedChart) return;

    try {
      const chartId = selectedChart.id;
      await OrgChartService.renameOrgChart(chartId, renameTitle, renameDescription);
      toast.success("Organizational chart renamed successfully");
      setRenameDialogOpen(false);
      await loadOrgCharts();
    } catch (error: any) {
      toast.error(error.message || "Failed to rename orgchart");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: "bg-gray-100 text-gray-800",
      pending_approval: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      revoked: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.draft}>
        {status}
      </Badge>
    );
  };

  const columns: ColumnDef<OrgChartWithStats>[] = [
    {
      accessorKey: "version",
      header: "Version",
      cell: ({ row }) => <span className="font-mono font-semibold">{row.original.version}</span>,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.description || "-"}</span>
      ),
    },
    {
      accessorKey: "stats.departments",
      header: "Depts",
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.original.stats?.departments ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "stats.positions",
      header: "Positions",
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.original.stats?.positions ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "stats.appointments",
      header: "Filled",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-green-600">
          {row.original.stats?.appointments ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "stats.vacancies",
      header: "Vacant",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-orange-600">
          {row.original.stats?.vacancies ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "stats.totalHeadcount",
      header: "Headcount",
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.original.stats?.totalHeadcount ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-sm">{new Date(row.original.createdAt).toLocaleDateString()}</span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading organizational charts...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizational Charts</h1>
          <p className="text-muted-foreground">
            Manage your organizational structures and hierarchies
          </p>
        </div>
      </div>

      {/* Table */}
      <QTable
        columns={columns}
        data={orgCharts}
        searchable
        searchPlaceholder="Search organizational charts..."
        onRowClick={handleRowClick}
        mainButton={{
          label: "Create OrgChart",
          icon: <Plus className="size-4 mr-2" />,
          onClick: handleCreateOrgChart,
        }}
        rowActions={(chart) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleRowClick(chart)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => handleOpenRenameDialog(chart, e)}>
                <Edit className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleDuplicate(chart, e)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => handleSendForApproval(chart, e)}
                disabled={chart.status !== "draft"}
              >
                <Send className="mr-2 h-4 w-4" />
                Send for Approval
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        emptyMessage="No organizational charts yet. Create your first one to get started."
        enableRowSelection={false}
      />

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Organizational Chart</DialogTitle>
            <DialogDescription>
              Update the title and description of your organizational chart.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                placeholder="Enter title..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={renameDescription}
                onChange={(e) => setRenameDescription(e.target.value)}
                placeholder="Enter description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!renameTitle.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
