CREATE TABLE "plan_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"limit_type" text NOT NULL,
	"limit_value" integer,
	"current_usage" integer DEFAULT 0 NOT NULL,
	"warning_threshold" integer DEFAULT 80 NOT NULL,
	"is_exceeded" boolean DEFAULT false NOT NULL,
	"last_checked" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"plan_name" text NOT NULL,
	"plan_features" jsonb,
	"status" text DEFAULT 'trial' NOT NULL,
	"user_count" integer DEFAULT 0 NOT NULL,
	"max_users" integer,
	"price_per_user" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"total_monthly_price" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"billing_cycle" text DEFAULT 'monthly' NOT NULL,
	"trial_ends_at" timestamp,
	"next_billing_date" timestamp,
	"last_synced_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usage_date" timestamp DEFAULT now() NOT NULL,
	"active_users" integer DEFAULT 0 NOT NULL,
	"total_users" integer DEFAULT 0 NOT NULL,
	"storage_used" integer DEFAULT 0 NOT NULL,
	"api_requests" integer DEFAULT 0 NOT NULL,
	"data_transfer" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
