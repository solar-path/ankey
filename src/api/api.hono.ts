import { Hono } from "hono";
import { cors } from "hono/cors";
import { sendVerificationEmail, sendPasswordResetEmail } from "./mail.settings";

const app = new Hono();

// Enable CORS for frontend
app.use("/*", cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
}));

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth routes
const auth = new Hono();

/**
 * Send verification email
 * POST /api/auth/send-verification
 * Body: { email: string, code: string }
 */
auth.post("/send-verification", async (c) => {
  try {
    const { email, code } = await c.req.json();

    if (!email || !code) {
      return c.json({ error: "Email and code are required" }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: "Invalid email format" }, 400);
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return c.json({ error: "Code must be 6 digits" }, 400);
    }

    const result = await sendVerificationEmail(email, code);

    if (result.success) {
      return c.json({
        success: true,
        message: "Verification email sent successfully",
        messageId: result.messageId,
      });
    } else {
      console.error("Failed to send verification email:", result.error);
      return c.json(
        {
          error: "Failed to send verification email",
          details: result.error instanceof Error ? result.error.message : "Unknown error",
        },
        500
      );
    }
  } catch (error) {
    console.error("Error in send-verification:", error);
    return c.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * Send password reset email
 * POST /api/auth/send-password-reset
 * Body: { email: string, resetToken: string }
 */
auth.post("/send-password-reset", async (c) => {
  try {
    const { email, resetToken } = await c.req.json();

    if (!email || !resetToken) {
      return c.json({ error: "Email and resetToken are required" }, 400);
    }

    const result = await sendPasswordResetEmail(email, resetToken);

    if (result.success) {
      return c.json({
        success: true,
        message: "Password reset email sent successfully",
        messageId: result.messageId,
      });
    } else {
      console.error("Failed to send password reset email:", result.error);
      return c.json(
        {
          error: "Failed to send password reset email",
          details: result.error instanceof Error ? result.error.message : "Unknown error",
        },
        500
      );
    }
  } catch (error) {
    console.error("Error in send-password-reset:", error);
    return c.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Mount auth routes
app.route("/api/auth", auth);

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json(
    {
      error: "Internal server error",
      details: err.message,
    },
    500
  );
});

export default app;
