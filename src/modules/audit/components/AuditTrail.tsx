import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AuditService, type AuditLog } from "../audit-service";

interface AuditTrailProps {
  table: string;
  recordId: string;
}

/**
 * AuditTrail Component
 *
 * Displays the complete audit trail (history) for a specific record.
 * Shows all CREATE, UPDATE, DELETE operations with timestamps, users, and changes.
 *
 * @param table - Table name (e.g., 'companies', 'users', 'inquiries')
 * @param recordId - Record ID to show history for
 */
export function AuditTrail({ table, recordId }: AuditTrailProps) {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AuditService.getAuditTrail(table, recordId)
      .then(setLogs)
      .catch((err) => {
        console.error("Error fetching audit trail:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [table, recordId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">{t("audit.trail.loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">
          {t("audit.trail.error")}: {error}
        </p>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">{t("audit.trail.noData")}</p>
      </div>
    );
  }

  return (
    <div className="audit-trail space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {t("audit.trail.title")}
      </h3>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("audit.trail.timestamp")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("audit.trail.action")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("audit.trail.user")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("audit.trail.ipAddress")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("audit.trail.changes")}
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
                <td className="px-4 py-3 text-sm text-gray-900">
                  <div>{log.user_email || t("audit.trail.systemUser")}</div>
                  {log.user_role && (
                    <div className="text-xs text-gray-500">{log.user_role}</div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {log.ip_address || "-"}
                </td>
                <td className="px-4 py-3 text-sm">
                  {log.action === "UPDATE" && log.old_values && log.new_values && (
                    <details className="cursor-pointer">
                      <summary className="text-blue-600 hover:text-blue-800">
                        {t("audit.trail.viewChanges")}
                      </summary>
                      <div className="mt-2 space-y-2 text-xs">
                        <div className="bg-red-50 p-2 rounded border border-red-200">
                          <div className="font-semibold text-red-700 mb-1">
                            {t("audit.trail.oldValues")}:
                          </div>
                          <pre className="whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(log.old_values, null, 2)}
                          </pre>
                        </div>
                        <div className="bg-green-50 p-2 rounded border border-green-200">
                          <div className="font-semibold text-green-700 mb-1">
                            {t("audit.trail.newValues")}:
                          </div>
                          <pre className="whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(log.new_values, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </details>
                  )}
                  {log.action === "CREATE" && log.new_values && (
                    <details className="cursor-pointer">
                      <summary className="text-blue-600 hover:text-blue-800">
                        {t("audit.trail.viewData")}
                      </summary>
                      <div className="mt-2 bg-gray-50 p-2 rounded border border-gray-200">
                        <pre className="whitespace-pre-wrap overflow-x-auto text-xs">
                          {JSON.stringify(log.new_values, null, 2)}
                        </pre>
                      </div>
                    </details>
                  )}
                  {log.action === "DELETE" && log.old_values && (
                    <details className="cursor-pointer">
                      <summary className="text-blue-600 hover:text-blue-800">
                        {t("audit.trail.viewDeletedData")}
                      </summary>
                      <div className="mt-2 bg-gray-50 p-2 rounded border border-gray-200">
                        <pre className="whitespace-pre-wrap overflow-x-auto text-xs">
                          {JSON.stringify(log.old_values, null, 2)}
                        </pre>
                      </div>
                    </details>
                  )}
                  {log.notes && (
                    <div className="text-xs text-gray-500 mt-1">{log.notes}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
