/**
 * Hono API Routes for Auth Module
 *
 * This is a thin gateway layer that calls PostgreSQL functions
 * All business logic is in auth.sql
 */

import { Hono } from "hono";
import type { Context } from "hono";
import { Pool } from "pg";

const app = new Hono();

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/ankey",
});

/**
 * Parameter order mapping for PostgreSQL functions
 * CRITICAL: PostgreSQL functions require parameters in exact order
 * Object.values() does NOT guarantee order, so we explicitly map parameter names
 */
const FUNCTION_PARAMS: Record<string, string[]> = {
  // Auth functions
  "auth.signup": ["email", "password", "fullname"],
  "auth.signin": ["email", "password", "ip_address", "user_agent"],
  "auth.signout": ["token"],
  "auth.verify_account": ["code"],
  "auth.verify_session": ["token"],
  "auth.verify_2fa": ["email", "token"],
  "auth.setup_2fa": ["user_id"],
  "auth.enable_2fa": ["user_id", "token"],
  "auth.disable_2fa": ["user_id", "token"],
  "auth.get_2fa_status": ["user_id"],
  "auth.update_profile": [
    "user_id",
    "fullname",
    "dob",
    "gender",
    "avatar",
    "phone",
    "address",
    "city",
    "state",
    "zip_code",
    "country",
  ],
  "auth.change_password": ["user_id", "current_password", "new_password"],
  "auth.forgot_password": ["email"],
  "auth.invite_user": ["email", "company_ids"],
  "auth.accept_invitation": ["email", "invitation_code", "new_password"],
  "auth.get_user_by_email": ["email"],
  "auth.cleanup_expired_sessions": [],

  // Company functions
  "company.create_company": [
    "user_id",
    "type",
    "title",
    "logo",
    "website",
    "business_id",
    "tax_id",
    "residence",
    "industry",
    "contact",
  ],
  "company.get_user_companies": ["user_id"],
  "company.get_company_by_id": ["company_id"],
  "company.get_company_members": ["company_id"],
  "company.get_user_role": ["user_id", "company_id"],
  "company.has_access": ["user_id", "company_id"],
  "company.has_permission": ["user_id", "company_id", "required_role"],
  "company.add_member": ["company_id", "user_id", "role"],
  "company.remove_member": ["company_id", "user_id"],
  "company.update_member_role": ["company_id", "user_id", "new_role"],
  "company.transfer_ownership": ["company_id", "current_owner_id", "new_owner_id"],
  "company.update_company": [
    "company_id",
    "title",
    "logo",
    "website",
    "business_id",
    "tax_id",
    "residence",
    "industry",
    "contact",
    "settings",
  ],
  "company.delete_company": ["company_id"],

  // Inquiry functions
  "inquiry.create_inquiry": ["name", "email", "message", "company", "phone", "attachments"],
  "inquiry.get_all_inquiries": ["status", "limit", "offset"],
  "inquiry.get_inquiry_by_id": ["inquiry_id"],
  "inquiry.get_inquiries_by_email": ["email"],
  "inquiry.get_statistics": [],
  "inquiry.update_status": ["inquiry_id", "status", "response"],
  "inquiry.delete_inquiry": ["inquiry_id"],

  // OrgChart functions
  "orgchart.create_orgchart": ["company_id", "title", "description", "code", "version", "status"],
  "orgchart.create_department": [
    "company_id",
    "parent_id",
    "title",
    "description",
    "code",
    "headcount",
    "charter",
  ],
  "orgchart.create_position": [
    "company_id",
    "parent_id",
    "title",
    "description",
    "salary_min",
    "salary_max",
    "job_description",
  ],
  "orgchart.create_appointment": [
    "company_id",
    "position_id",
    "user_id",
    "appointee_fullname",
    "appointee_email",
  ],
  "orgchart.get_all_orgcharts": ["company_id"],
  "orgchart.get_tree": ["company_id", "orgchart_id"],
  "orgchart.update_node": [
    "node_id",
    "title",
    "description",
    "code",
    "version",
    "status",
    "headcount",
    "charter",
    "salary_min",
    "salary_max",
    "job_description",
  ],
  "orgchart.delete_node": ["node_id", "cascade"],
  "orgchart.remove_appointment": ["position_id"],
  "orgchart.set_company_context": ["company_id"],

  // Reference functions
  "reference.get_all_countries": [],
  "reference.get_country_by_code": ["code"],
  "reference.search_countries": ["query", "limit"],
  "reference.get_all_industries": [],
  "reference.get_industry_by_code": ["code"],
  "reference.search_industries": ["query", "limit"],

  // Users functions
  "users.get_all": [],
  "users.get_by_id": ["user_id"],
  "users.get_by_company": ["company_id"],
  "users.get_stats": ["company_id"],
  "users.toggle_block": ["user_id", "block"],
  "users.delete": ["user_id"],
};

/**
 * Generic function to call any PostgreSQL function
 * Maps to pattern: POST /api/{function.name}
 */
app.post("/:fn", async (c: Context) => {
  const functionName = c.req.param("fn");
  const body = await c.req.json();

  try {
    // Get expected parameter order for this function
    const paramOrder = FUNCTION_PARAMS[functionName];

    if (!paramOrder) {
      throw new Error(
        `Function ${functionName} not found in parameter mapping. Please add it to FUNCTION_PARAMS.`
      );
    }

    // Auto-inject IP and User-Agent for auth.signin
    if (functionName === "auth.signin") {
      // Extract IP address (check various headers)
      const ip = c.req.header("x-forwarded-for")?.split(",")[0].trim()
        || c.req.header("x-real-ip")
        || c.req.header("cf-connecting-ip")
        || null;

      // Extract User-Agent
      const userAgent = c.req.header("user-agent") || null;

      // Auto-fill if not provided in body
      if (!body.ip_address) body.ip_address = ip;
      if (!body.user_agent) body.user_agent = userAgent;
    }

    // Extract parameters in correct order
    const params = paramOrder.map((paramName) => body[paramName]);

    // Build parameter placeholders ($1, $2, $3, etc.)
    const placeholders = params.map((_, i) => `$${i + 1}`).join(", ");

    // Call PostgreSQL function
    const query = `SELECT ${functionName}(${placeholders}) AS result`;

    console.log(`[Hono] Calling PostgreSQL function: ${functionName}`);
    console.log(`[Hono] Query: ${query}`);
    console.log(`[Hono] Params:`, params);

    const result = await pool.query(query, params);

    console.log(`[Hono] Result:`, result.rows[0]?.result);

    // Return the result (already JSON from PostgreSQL)
    return c.json(result.rows[0]?.result || {});
  } catch (error: any) {
    console.error(`[Hono] Error calling ${functionName}:`, error);

    // PostgreSQL errors have a specific format
    if (error.code) {
      return c.json(
        {
          error: error.message || "Database error",
          code: error.code,
          detail: error.detail,
        },
        400
      );
    }

    return c.json(
      {
        error: error.message || "Internal server error",
      },
      500
    );
  }
});

export default app;
