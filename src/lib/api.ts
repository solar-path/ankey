/**
 * API Helper Functions
 *
 * Thin client layer for calling PostgreSQL functions via Hono API
 * Following PostgreSQL-first architecture from ARCHITECTURE.md
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Call a PostgreSQL function via Hono API
 *
 * @param functionName - PostgreSQL function name (e.g., "orgchart.create_orgchart")
 * @param params - Function parameters as key-value pairs
 * @returns Promise with function result
 *
 * @example
 * const result = await callFunction("orgchart.get_all_orgcharts", {
 *   company_id: "company_123"
 * });
 */
export async function callFunction(
  functionName: string,
  params: Record<string, any> = {}
): Promise<any> {
  const response = await fetch(`${API_URL}/api/${functionName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to call ${functionName}`);
  }

  return response.json();
}
