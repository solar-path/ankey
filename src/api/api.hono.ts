import { Hono } from "hono";
import { cors } from "hono/cors";
import { sendVerificationEmail, sendPasswordResetEmail, sendInquiryConfirmationEmail, sendUserInvitationEmail } from "./mail.settings";

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

// Inquiry routes
const inquiry = new Hono();

/**
 * Send inquiry confirmation email
 * POST /api/inquiry/send-confirmation
 * Body: { email: string, name: string, inquiryId: string }
 */
inquiry.post("/send-confirmation", async (c) => {
  try {
    const { email, name, inquiryId } = await c.req.json();

    if (!email || !name || !inquiryId) {
      return c.json({ error: "Email, name, and inquiryId are required" }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: "Invalid email format" }, 400);
    }

    // Validate inquiry ID format
    if (!/^inquiry_/.test(inquiryId)) {
      return c.json({ error: "Invalid inquiry ID format" }, 400);
    }

    const result = await sendInquiryConfirmationEmail({
      email,
      name,
      inquiryId,
    });

    if (result.success) {
      return c.json({
        success: true,
        message: "Inquiry confirmation email sent successfully",
        messageId: result.messageId,
      });
    } else {
      console.error("Failed to send inquiry confirmation email:", result.error);
      return c.json(
        {
          error: "Failed to send inquiry confirmation email",
          details: result.error instanceof Error ? result.error.message : "Unknown error",
        },
        500
      );
    }
  } catch (error) {
    console.error("Error in send-inquiry-confirmation:", error);
    return c.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Mount inquiry routes
app.route("/api/inquiry", inquiry);

// User routes
const users = new Hono();

/**
 * Send user invitation email
 * POST /api/users/send-invitation
 * Body: { email: string, invitationCode: string, isNewUser: boolean }
 */
users.post("/send-invitation", async (c) => {
  try {
    const { email, invitationCode, isNewUser } = await c.req.json();

    if (!email || !invitationCode || typeof isNewUser !== 'boolean') {
      return c.json({ error: "Email, invitationCode, and isNewUser are required" }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: "Invalid email format" }, 400);
    }

    const result = await sendUserInvitationEmail({
      email,
      invitationCode,
      isNewUser,
    });

    if (result.success) {
      return c.json({
        success: true,
        message: "User invitation email sent successfully",
        messageId: result.messageId,
      });
    } else {
      console.error("Failed to send user invitation email:", result.error);
      return c.json(
        {
          error: "Failed to send user invitation email",
          details: result.error instanceof Error ? result.error.message : "Unknown error",
        },
        500
      );
    }
  } catch (error) {
    console.error("Error in send-user-invitation:", error);
    return c.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Mount user routes
app.route("/api/users", users);

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
