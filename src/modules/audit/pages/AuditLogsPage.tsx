import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Eye, Calendar } from "lucide-react";
import { QTable, SortableHeader } from "@/lib/ui/QTable.ui";
import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/input";
import { Label } from "@/lib/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/lib/ui/collapsible";
import { ActiveSessions } from "../components/ActiveSessions";
import { AuditService, type AuditLog } from "../audit-service";

/**
 * Audit Logs Page
 *
 * Main page for viewing and monitoring audit logs and user sessions.
 * Displays recent activity with filtering, date range, and export capabilities.
 */
export function AuditLogsPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSessions, setShowSessions] = useState(false);

  const [filters, setFilters] = useState({
    action: "",
    table: "",
    startDate: "",
    endDate: "",
  });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const startDate = filters.startDate ? new Date(filters.startDate) : undefined;
      const endDate = filters.endDate ? new Date(filters.endDate) : undefined;

      const data = await AuditService.getRecentLogs(
        1000, // Load more records for filtering
        filters.action || undefined,
        filters.table || undefined,
        startDate,
        endDate
      );
      setLogs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load logs on mount and when filters change (with debounce for table filter)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadLogs();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [loadLogs]);

  // Export logs to CSV
  const exportLogs = () => {
    if (logs.length === 0) return;

    const headers = [
      "Timestamp",
      "Action",
      "Table",
      "Record ID",
      "User Email",
      "User ID",
      "IP Address",
      "User Agent",
      "Notes",
      "Old Values",
      "New Values",
    ];

    const rows = logs.map((log) => [
      new Date(log.created_at).toISOString(),
      log.action,
      log.table_name,
      log.record_id,
      log.user_email || "",
      log.user_id || "",
      log.ip_address || "",
      log.user_agent || "",
      log.notes || "",
      log.old_values ? JSON.stringify(log.old_values) : "",
      log.new_values ? JSON.stringify(log.new_values) : "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `audit-logs-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Define columns for QTable
  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("audit.trail.timestamp", "Timestamp")}
          </SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="whitespace-nowrap text-sm">
            {new Date(row.original.created_at).toLocaleString()}
          </div>
        ),
      },
      {
        accessorKey: "action",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("audit.trail.action", "Action")}
          </SortableHeader>
        ),
        cell: ({ row }) => (
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(
              row.original.action
            )}`}
          >
            {row.original.action}
          </span>
        ),
      },
      {
        accessorKey: "table_name",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("audit.page.table", "Table")}
          </SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="text-sm text-gray-600">{row.original.table_name}</div>
        ),
      },
      {
        accessorKey: "record_id",
        header: t("audit.trail.recordId", "Record ID"),
        cell: ({ row }) => (
          <div className="text-sm font-mono text-gray-500 max-w-[120px] truncate">
            {row.original.record_id}
          </div>
        ),
      },
      {
        accessorKey: "user_email",
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("audit.trail.user", "User")}
          </SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="text-gray-900">
              {row.original.user_email || t("audit.trail.systemUser", "System")}
            </div>
            {row.original.user_role && (
              <div className="text-xs text-gray-500">{row.original.user_role}</div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "ip_address",
        header: t("audit.trail.ipAddress", "IP Address"),
        cell: ({ row }) => (
          <div className="text-sm text-gray-500">
            {row.original.ip_address || "-"}
          </div>
        ),
      },
      {
        accessorKey: "notes",
        header: t("audit.page.notes", "Notes"),
        cell: ({ row }) => (
          <div className="text-sm text-gray-600 max-w-md truncate">
            {row.original.notes || "-"}
          </div>
        ),
      },
    ],
    [t]
  );

  return (
    <div className="audit-logs-page max-w-full mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("audit.page.title", "Audit Logs")}
        </h1>
        <p className="text-gray-600 mt-2">
          {t(
            "audit.page.subtitle",
            "Monitor user activity, sessions, and system changes"
          )}
        </p>
      </div>

      {/* Active Sessions (Collapsible) */}
      <Collapsible open={showSessions} onOpenChange={setShowSessions}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full">
            <Eye className="mr-2 size-4" />
            {showSessions
              ? t("audit.sessions.hide", "Hide Active Sessions")
              : t("audit.sessions.show", "Show Active Sessions")}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="bg-white rounded-lg shadow p-6">
            <ActiveSessions />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {t("audit.page.filters", "Filters")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action Filter */}
          <div className="space-y-2">
            <Label htmlFor="action-filter">
              {t("audit.page.filterAction", "Filter by Action")}
            </Label>
            <Select
              value={filters.action || "ALL"}
              onValueChange={(value) =>
                setFilters({ ...filters, action: value === "ALL" ? "" : value })
              }
            >
              <SelectTrigger id="action-filter">
                <SelectValue
                  placeholder={t("audit.page.allActions", "All Actions")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {t("audit.page.allActions", "All Actions")}
                </SelectItem>
                <SelectItem value="CREATE">CREATE</SelectItem>
                <SelectItem value="UPDATE">UPDATE</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="LOGIN">LOGIN</SelectItem>
                <SelectItem value="LOGOUT">LOGOUT</SelectItem>
                <SelectItem value="LOGIN_FAILED">LOGIN_FAILED</SelectItem>
                <SelectItem value="APPROVE">APPROVE</SelectItem>
                <SelectItem value="REJECT">REJECT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table Filter */}
          <div className="space-y-2">
            <Label htmlFor="table-filter">
              {t("audit.page.filterTable", "Filter by Table")}
            </Label>
            <Input
              id="table-filter"
              type="text"
              value={filters.table}
              onChange={(e) =>
                setFilters({ ...filters, table: e.target.value })
              }
              placeholder="companies, users, etc."
            />
          </div>

          {/* Start Date Filter */}
          <div className="space-y-2">
            <Label htmlFor="start-date">
              <Calendar className="inline mr-1 size-4" />
              {t("audit.page.startDate", "Start Date")}
            </Label>
            <Input
              id="start-date"
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
            />
          </div>

          {/* End Date Filter */}
          <div className="space-y-2">
            <Label htmlFor="end-date">
              <Calendar className="inline mr-1 size-4" />
              {t("audit.page.endDate", "End Date")}
            </Label>
            <Input
              id="end-date"
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex gap-2 items-center">
          {loading && (
            <span className="text-sm text-gray-500">
              {t("audit.page.loading", "Loading...")}
            </span>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setFilters({
                action: "",
                table: "",
                startDate: "",
                endDate: "",
              });
            }}
            disabled={!filters.action && !filters.table && !filters.startDate && !filters.endDate}
          >
            {t("audit.page.clearFilters", "Clear Filters")}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <QTable
          columns={columns}
          data={logs}
          searchable={true}
          searchPlaceholder={t(
            "audit.page.searchPlaceholder",
            "Search by user, table, action..."
          )}
          filterable={true}
          pageSizes={[25, 50, 100, 250]}
          defaultPageSize={50}
          enableRowSelection={false}
          emptyMessage={
            loading
              ? t("audit.page.loading", "Loading...")
              : t("audit.page.noLogs", "No audit logs found")
          }
          mainButton={{
            label: t("audit.page.export", "Export CSV"),
            icon: <Download className="mr-2 size-4" />,
            onClick: exportLogs,
          }}
          className="mt-4"
        />
      </div>
    </div>
  );
}

/**
 * Get color class for action badge
 */
function getActionColor(action: string): string {
  switch (action) {
    case "CREATE":
      return "bg-green-100 text-green-800";
    case "UPDATE":
      return "bg-blue-100 text-blue-800";
    case "DELETE":
      return "bg-red-100 text-red-800";
    case "LOGIN":
      return "bg-purple-100 text-purple-800";
    case "LOGOUT":
      return "bg-gray-100 text-gray-800";
    case "LOGIN_FAILED":
      return "bg-orange-100 text-orange-800";
    case "APPROVE":
      return "bg-teal-100 text-teal-800";
    case "REJECT":
      return "bg-pink-100 text-pink-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
