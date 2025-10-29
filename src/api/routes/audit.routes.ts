import { Hono } from "hono";
import type { Context } from "hono";
import { Pool } from "pg";

const app = new Hono();

// PostgreSQL connection pool
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || "postgresql://localhost:5432/ankey",
});

/**
 * GET /api/audit/trail/:table/:recordId
 * Get audit trail for a specific record
 *
 * @param table - Table name (e.g., 'companies', 'users', 'inquiries')
 * @param recordId - Record ID
 * @returns JSONB array of audit logs
 */
app.get("/trail/:table/:recordId", async (c: Context) => {
  try {
    const { table, recordId } = c.req.param();

    // Validate parameters
    if (!table || !recordId) {
      return c.json({ error: "Table and recordId are required" }, 400);
    }

    const result = await pool.query(
      "SELECT audit.get_audit_trail($1, $2) AS trail",
      [table, recordId]
    );

    return c.json(result.rows[0]?.trail || []);
  } catch (error: any) {
    console.error("[Audit Routes] Error fetching audit trail:", error);
    return c.json(
      {
        error: "Failed to fetch audit trail",
        details: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/audit/user/:userId/activity
 * Get user activity for a time period
 *
 * @param userId - User ID
 * @query from - Start timestamp (ISO string, default: 30 days ago)
 * @query to - End timestamp (ISO string, default: now)
 * @returns JSONB object with user activity statistics
 */
app.get("/user/:userId/activity", async (c: Context) => {
  try {
    const { userId } = c.req.param();
    const from =
      c.req.query("from") ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const to = c.req.query("to") || new Date().toISOString();

    if (!userId) {
      return c.json({ error: "userId is required" }, 400);
    }

    const result = await pool.query(
      "SELECT audit.get_user_activity($1, $2::TIMESTAMP, $3::TIMESTAMP) AS activity",
      [userId, from, to]
    );

    return c.json(result.rows[0]?.activity || {});
  } catch (error: any) {
    console.error("[Audit Routes] Error fetching user activity:", error);
    return c.json(
      {
        error: "Failed to fetch user activity",
        details: error.message,
      },
      500
    );
  }
});

/**
 * POST /api/audit/report/generate
 * Generate SOC/SoX compliance report
 *
 * @body reportType - Report type (e.g., 'SOC2', 'SOX')
 * @body periodStart - Start timestamp (ISO string)
 * @body periodEnd - End timestamp (ISO string)
 * @body generatedBy - User ID of person generating report
 * @returns JSONB object with report data
 */
app.post("/report/generate", async (c: Context) => {
  try {
    const { reportType, periodStart, periodEnd, generatedBy } =
      await c.req.json();

    // Validate required fields
    if (!reportType || !periodStart || !periodEnd || !generatedBy) {
      return c.json(
        {
          error:
            "reportType, periodStart, periodEnd, and generatedBy are required",
        },
        400
      );
    }

    const result = await pool.query(
      "SELECT audit.generate_soc_report($1, $2::TIMESTAMP, $3::TIMESTAMP, $4) AS report",
      [reportType, periodStart, periodEnd, generatedBy]
    );

    return c.json(result.rows[0]?.report || {});
  } catch (error: any) {
    console.error("[Audit Routes] Error generating report:", error);
    return c.json(
      {
        error: "Failed to generate report",
        details: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/audit/sessions/active
 * Get all active sessions
 *
 * @returns Array of active session records
 */
app.get("/sessions/active", async (c: Context) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        user_id,
        user_email,
        login_at,
        login_ip,
        last_activity_at,
        actions_count,
        is_suspicious,
        suspicious_reason
      FROM audit_sessions
      WHERE status = 'active'
      ORDER BY login_at DESC
    `);

    return c.json(result.rows);
  } catch (error: any) {
    console.error("[Audit Routes] Error fetching active sessions:", error);
    return c.json(
      {
        error: "Failed to fetch active sessions",
        details: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/audit/sessions/suspicious
 * Get all suspicious sessions
 *
 * @returns Array of suspicious session records
 */
app.get("/sessions/suspicious", async (c: Context) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        user_id,
        user_email,
        login_at,
        login_ip,
        login_user_agent,
        last_activity_at,
        actions_count,
        suspicious_reason,
        status
      FROM audit_sessions
      WHERE is_suspicious = TRUE
      ORDER BY login_at DESC
      LIMIT 100
    `);

    return c.json(result.rows);
  } catch (error: any) {
    console.error("[Audit Routes] Error fetching suspicious sessions:", error);
    return c.json(
      {
        error: "Failed to fetch suspicious sessions",
        details: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/audit/logs/recent
 * Get recent audit logs
 *
 * @query limit - Number of logs to return (default: 100)
 * @query action - Filter by action type (optional)
 * @query table - Filter by table name (optional)
 * @returns Array of audit log records
 */
app.get("/logs/recent", async (c: Context) => {
  try {
    const limit = parseInt(c.req.query("limit") || "100");
    const action = c.req.query("action");
    const table = c.req.query("table");

    let query = `
      SELECT
        id,
        user_id,
        user_email,
        user_role,
        action,
        table_name,
        record_id,
        company_id,
        old_values,
        new_values,
        ip_address,
        user_agent,
        notes,
        created_at
      FROM audit_log
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (action) {
      query += ` AND action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }

    if (table) {
      query += ` AND table_name = $${paramIndex}`;
      params.push(table);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);

    return c.json(result.rows);
  } catch (error: any) {
    console.error("[Audit Routes] Error fetching recent logs:", error);
    return c.json(
      {
        error: "Failed to fetch recent logs",
        details: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/audit/soft-deletes
 * Get soft-deleted records that can be restored
 *
 * @query table - Filter by table name (optional)
 * @returns Array of soft-deleted records
 */
app.get("/soft-deletes", async (c: Context) => {
  try {
    const table = c.req.query("table");

    let query = `
      SELECT
        id,
        table_name,
        record_id,
        deleted_by,
        deleted_at,
        data_snapshot,
        company_id,
        restored,
        restored_by,
        restored_at,
        permanent_delete_at
      FROM audit_soft_deletes
      WHERE restored = FALSE
    `;

    const params: any[] = [];

    if (table) {
      query += ` AND table_name = $1`;
      params.push(table);
    }

    query += ` ORDER BY deleted_at DESC LIMIT 100`;

    const result = await pool.query(query, params);

    return c.json(result.rows);
  } catch (error: any) {
    console.error("[Audit Routes] Error fetching soft deletes:", error);
    return c.json(
      {
        error: "Failed to fetch soft deletes",
        details: error.message,
      },
      500
    );
  }
});

/**
 * POST /api/audit/restore/:table/:recordId
 * Restore a soft-deleted record
 *
 * @param table - Table name
 * @param recordId - Record ID
 * @body restoredBy - User ID of person restoring
 * @returns JSONB result
 */
app.post("/restore/:table/:recordId", async (c: Context) => {
  try {
    const { table, recordId } = c.req.param();
    const { restoredBy } = await c.req.json();

    if (!table || !recordId || !restoredBy) {
      return c.json(
        { error: "table, recordId, and restoredBy are required" },
        400
      );
    }

    const result = await pool.query(
      "SELECT audit.restore_soft_deleted($1, $2, $3) AS result",
      [table, recordId, restoredBy]
    );

    return c.json(result.rows[0]?.result || {});
  } catch (error: any) {
    console.error("[Audit Routes] Error restoring record:", error);
    return c.json(
      {
        error: "Failed to restore record",
        details: error.message,
      },
      500
    );
  }
});

export default app;
