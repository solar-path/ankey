import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActiveSessions } from "../components/ActiveSessions";
import { AuditService, type AuditLog } from "../audit-service";

/**
 * Audit Logs Page
 *
 * Main page for viewing and monitoring audit logs and user sessions.
 * Displays recent activity, active sessions, and provides filtering capabilities.
 */
export function AuditLogsPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    action: "",
    table: "",
    limit: 50,
  });

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AuditService.getRecentLogs(
        filters.limit,
        filters.action || undefined,
        filters.table || undefined
      );
      setLogs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="audit-logs-page max-w-7xl mx-auto p-6 space-y-8">
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

      {/* Active Sessions Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <ActiveSessions />
      </section>

      {/* Recent Logs Section */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {t("audit.page.recentLogs", "Recent Activity")}
          </h2>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading
              ? t("audit.page.loading", "Loading...")
              : t("audit.page.loadLogs", "Load Logs")}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("audit.page.filterAction", "Filter by Action")}
            </label>
            <select
              value={filters.action}
              onChange={(e) =>
                setFilters({ ...filters, action: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">{t("audit.page.allActions", "All Actions")}</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("audit.page.filterTable", "Filter by Table")}
            </label>
            <input
              type="text"
              value={filters.table}
              onChange={(e) =>
                setFilters({ ...filters, table: e.target.value })
              }
              placeholder="companies, users, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("audit.page.limit", "Limit")}
            </label>
            <select
              value={filters.limit}
              onChange={(e) =>
                setFilters({ ...filters, limit: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="250">250</option>
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Logs Table */}
        {logs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("audit.trail.timestamp")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("audit.trail.action")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("audit.page.table", "Table")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("audit.trail.user")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("audit.trail.ipAddress")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t("audit.page.notes", "Notes")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.table_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {log.user_email || t("audit.trail.systemUser")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {log.ip_address || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate">
                      {log.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {logs.length === 0 && !loading && !error && (
          <div className="p-8 text-center text-gray-500">
            {t("audit.page.noLogs", "Click 'Load Logs' to view recent activity")}
          </div>
        )}
      </section>
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
