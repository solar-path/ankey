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
import { Plus, Eye } from "lucide-react";
import { toast } from "sonner";

export default function OrgChartListPage() {
  const { user } = useAuth();
  const { activeCompany } = useCompany();
  const [, setLocation] = useLocation();
  const [orgCharts, setOrgCharts] = useState<OrgChart[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrgCharts();
  }, [activeCompany]);

  const loadOrgCharts = async () => {
    if (!activeCompany || !user) return;

    try {
      setLoading(true);
      const charts = await OrgChartService.getCompanyOrgCharts(activeCompany._id);
      setOrgCharts(charts);
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
    const chartId = chart._id.split(":").pop()!;
    setLocation(`/orgchart/${chartId}`);
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

  const columns: ColumnDef<OrgChart>[] = [
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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "enforcedAt",
      header: "Enforced",
      cell: ({ row }) =>
        row.original.enforcedAt ? (
          <span className="text-sm">
            {new Date(row.original.enforcedAt).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: "revokedAt",
      header: "Revoked",
      cell: ({ row }) =>
        row.original.revokedAt ? (
          <span className="text-sm text-red-600">
            {new Date(row.original.revokedAt).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
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
          <button
            onClick={() => handleRowClick(chart)}
            className="flex items-center gap-2 text-sm hover:text-primary"
          >
            <Eye className="size-4" />
            View
          </button>
        )}
        emptyMessage="No organizational charts yet. Create your first one to get started."
        enableRowSelection={false}
      />
    </div>
  );
}
