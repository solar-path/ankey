CREATE TABLE "core_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text,
	"old_values" text,
	"new_values" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "core_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"email_verified" boolean DEFAULT false,
	"two_factor_enabled" boolean DEFAULT false,
	"two_factor_secret" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "core_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"email" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "email_verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subdomain" text NOT NULL,
	"database" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"billing_email" text NOT NULL,
	"user_count" integer DEFAULT 0,
	"monthly_rate" integer DEFAULT 25,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tenants_subdomain_unique" UNIQUE("subdomain"),
	CONSTRAINT "tenants_database_unique" UNIQUE("database")
);
--> statement-breakpoint
ALTER TABLE "core_audit_logs" ADD CONSTRAINT "core_audit_logs_user_id_core_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."core_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_sessions" ADD CONSTRAINT "core_sessions_user_id_core_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."core_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_core_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."core_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_core_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."core_users"("id") ON DELETE no action ON UPDATE no action;