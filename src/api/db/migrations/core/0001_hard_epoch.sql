CREATE TABLE "pricing_discounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"name" text NOT NULL,
	"discount_percent" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT true,
	"promo_code" text,
	"min_months" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pricing_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_per_user_per_month" integer NOT NULL,
	"min_users" integer DEFAULT 1,
	"max_users" integer,
	"features" text NOT NULL,
	"trial_days" integer DEFAULT 0,
	"trial_max_users" integer DEFAULT 5,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"badge" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenant_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"discount_id" uuid,
	"status" text DEFAULT 'active' NOT NULL,
	"user_count" integer DEFAULT 1 NOT NULL,
	"price_per_user" integer NOT NULL,
	"total_monthly_price" integer NOT NULL,
	"billing_cycle" text DEFAULT 'monthly' NOT NULL,
	"trial_ends_at" timestamp,
	"next_billing_date" timestamp,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "pricing_discounts" ADD CONSTRAINT "pricing_discounts_plan_id_pricing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."pricing_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_plan_id_pricing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."pricing_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_discount_id_pricing_discounts_id_fk" FOREIGN KEY ("discount_id") REFERENCES "public"."pricing_discounts"("id") ON DELETE no action ON UPDATE no action;