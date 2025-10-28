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
 * Generic function to call any PostgreSQL function
 * Maps to pattern: POST /api/{function.name}
 */
app.post("/:fn", async (c: Context) => {
  const functionName = c.req.param("fn");
  const body = await c.req.json();

  try {
    // Extract parameters from body
    const params = Object.values(body);

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
