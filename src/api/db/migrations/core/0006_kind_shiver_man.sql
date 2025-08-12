ALTER TABLE "core_users" ADD COLUMN "password_expiry_days" integer DEFAULT 45;--> statement-breakpoint
ALTER TABLE "core_users" ADD COLUMN "password_changed_at" timestamp DEFAULT now();