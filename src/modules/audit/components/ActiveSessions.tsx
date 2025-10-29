import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AuditService, type ActiveSession } from "../audit-service";

/**
 * ActiveSessions Component
 *
 * Displays all currently active user sessions with their details.
 * Useful for security monitoring and identifying suspicious activities.
 */
export function ActiveSessions() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = () => {
    setLoading(true);
    AuditService.getActiveSessions()
      .then(setSessions)
      .catch((err) => {
        console.error("Error fetching active sessions:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSessions();
    // Refresh every 30 seconds
    const interval = setInterval(loadSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">{t("audit.sessions.loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">
          {t("audit.sessions.error")}: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="active-sessions space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {t("audit.sessions.title")} ({sessions.length})
        </h3>
        <button
          onClick={loadSessions}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? t("audit.sessions.refreshing") : t("audit.sessions.refresh")}
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-gray-600">{t("audit.sessions.noActive")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("audit.sessions.user")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("audit.sessions.loginTime")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("audit.sessions.lastActivity")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("audit.sessions.ipAddress")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("audit.sessions.actions")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("audit.sessions.status")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr
                  key={session.id}
                  className={`hover:bg-gray-50 ${
                    session.is_suspicious ? "bg-red-50" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-medium">{session.user_email}</div>
                    <div className="text-xs text-gray-500">{session.user_id}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {new Date(session.login_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {session.last_activity_at
                      ? formatRelativeTime(new Date(session.last_activity_at))
                      : "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {session.login_ip || "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {session.actions_count}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {session.is_suspicious ? (
                      <div>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {t("audit.sessions.suspicious")}
                        </span>
                        {session.suspicious_reason && (
                          <div className="text-xs text-red-600 mt-1">
                            {session.suspicious_reason}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {t("audit.sessions.normal")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Format timestamp as relative time (e.g., "2 minutes ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}
