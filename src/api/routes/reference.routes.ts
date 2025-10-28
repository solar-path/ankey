/**
 * Reference Data API Routes (Countries and Industries)
 *
 * Following PostgreSQL-centric architecture:
 * - All business logic in PostgreSQL functions
 * - Hono as thin API gateway (transport layer only)
 * - Universal router pattern
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
 * Universal Router Pattern
 * POST /api/reference/:fn
 * Calls PostgreSQL function: reference.{fn}
 */
app.post("/:fn", async (c: Context) => {
  const functionName = c.req.param("fn");
  const body = await c.req.json().catch(() => ({}));
  const params = Object.values(body);

  try {
    // Generate placeholders: $1, $2, $3, ...
    const placeholders = params.map((_, i) => `$${i + 1}`).join(", ");

    // Call PostgreSQL function
    const query = `SELECT reference.${functionName}(${placeholders}) AS result`;
    const result = await pool.query(query, params);

    return c.json(result.rows[0]?.result || {});
  } catch (error: any) {
    console.error(`[reference.${functionName}] Error:`, error.message);
    return c.json({ error: error.message }, 400);
  }
});

/**
 * Backward compatibility routes (will redirect to PostgreSQL functions)
 * These can be removed once frontend is updated
 */

// GET /api/reference/countries -> reference.get_all_countries()
app.get("/countries", async (c: Context) => {
  try {
    const result = await pool.query('SELECT reference.get_all_countries() AS result');
    return c.json(result.rows[0]?.result || []);
  } catch (error: any) {
    console.error("[reference.get_all_countries] Error:", error.message);
    return c.json({ error: error.message }, 400);
  }
});

// GET /api/reference/countries/:code -> reference.get_country_by_code(code)
app.get("/countries/:code", async (c: Context) => {
  try {
    const code = c.req.param("code");
    const result = await pool.query(
      'SELECT reference.get_country_by_code($1) AS result',
      [code]
    );
    return c.json(result.rows[0]?.result || null);
  } catch (error: any) {
    console.error("[reference.get_country_by_code] Error:", error.message);
    return c.json({ error: error.message }, 400);
  }
});

// GET /api/reference/industries -> reference.get_all_industries()
app.get("/industries", async (c: Context) => {
  try {
    const result = await pool.query('SELECT reference.get_all_industries() AS result');
    return c.json(result.rows[0]?.result || []);
  } catch (error: any) {
    console.error("[reference.get_all_industries] Error:", error.message);
    return c.json({ error: error.message }, 400);
  }
});

// GET /api/reference/industries/:code -> reference.get_industry_by_code(code)
app.get("/industries/:code", async (c: Context) => {
  try {
    const code = parseInt(c.req.param("code"));
    if (isNaN(code)) {
      return c.json({ error: "Invalid industry code" }, 400);
    }

    const result = await pool.query(
      'SELECT reference.get_industry_by_code($1) AS result',
      [code]
    );
    return c.json(result.rows[0]?.result || null);
  } catch (error: any) {
    console.error("[reference.get_industry_by_code] Error:", error.message);
    return c.json({ error: error.message }, 400);
  }
});

export default app;
