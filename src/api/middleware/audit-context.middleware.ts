import type { Context, Next } from "hono";
import { Pool } from "pg";

// PostgreSQL connection pool
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || "postgresql://localhost:5432/ankey",
});

/**
 * Middleware для установки user context в PostgreSQL session
 *
 * Извлекает user_id из session token и устанавливает app.user_id в PostgreSQL,
 * что позволяет audit триггерам автоматически отслеживать, кто делает изменения.
 *
 * Порядок работы:
 * 1. Извлекает session token из cookie или Authorization header
 * 2. Валидирует session и получает user_id
 * 3. Устанавливает app.user_id в PostgreSQL session через audit.set_user_context()
 * 4. Сохраняет userId в Hono context для использования в handlers
 */
export async function auditContextMiddleware(c: Context, next: Next) {
  // Извлечь session token из cookie или Authorization header
  let sessionToken = c.req.header("authorization")?.replace("Bearer ", "");

  if (!sessionToken) {
    // Fallback to cookie header (parse manually if c.req.cookie is not available)
    const cookieHeader = c.req.header("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/session_token=([^;]+)/);
      if (match) {
        sessionToken = match[1];
      }
    }
  }

  if (sessionToken) {
    try {
      // Получить user_id из session
      const result = await pool.query(
        `SELECT user_id
         FROM sessions
         WHERE token = $1
           AND type = 'session'
           AND expires_at > $2`,
        [sessionToken, Date.now()]
      );

      if (result.rows.length > 0) {
        const userId = result.rows[0].user_id;

        // Установить user context в PostgreSQL session
        await pool.query("SELECT audit.set_user_context($1)", [userId]);

        // Сохранить в Hono context для использования в handlers
        c.set("userId", userId);

        console.log(`[Audit Context] Set user context: ${userId}`);
      }
    } catch (error) {
      console.error("[Audit Context] Error setting audit context:", error);
      // Не прерываем запрос, даже если не удалось установить контекст
    }
  }

  // Продолжить обработку запроса
  await next();

  // Опционально: Очистить context после запроса
  // В текущей реализации это не обязательно, так как каждый запрос получает новое connection
  // из pool, но для явности можно добавить:
  // try {
  //   await pool.query("SELECT audit.clear_user_context()");
  // } catch (error) {
  //   console.error("[Audit Context] Error clearing context:", error);
  // }
}
