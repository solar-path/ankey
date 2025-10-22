import { serve } from "@hono/node-server";
import app from "./api.hono";

const port = parseInt(process.env.API_PORT || "3001");

console.log(`🚀 Starting API server on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ API server running at http://localhost:${port}`);
console.log(`📧 Email service: ${process.env.SMTP_HOST || 'mail.privateemail.com'}`);
console.log(`📨 From: ${process.env.FROM_EMAIL || 'notify@ysollo.com'}`);
