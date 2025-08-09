CREATE TABLE "core_user_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"gender" text,
	"date_of_birth" text,
	"timezone" text,
	"language" text DEFAULT 'en',
	"phone" text,
	"address" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"emergency_contact_relationship" text,
	"theme" text DEFAULT 'system',
	"density" text DEFAULT 'comfortable',
	"primary_color" text DEFAULT '#000000',
	"font_size" text DEFAULT 'medium',
	"sidebar_collapsed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "core_users" ADD COLUMN "avatar" text;--> statement-breakpoint
ALTER TABLE "core_user_settings" ADD CONSTRAINT "core_user_settings_user_id_core_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."core_users"("id") ON DELETE cascade ON UPDATE no action;