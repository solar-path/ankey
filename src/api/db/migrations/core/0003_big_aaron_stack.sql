CREATE TABLE "core_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "core_permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "core_role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "core_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "core_user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_by" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "core_user_settings" ALTER COLUMN "theme" SET DEFAULT 'light';--> statement-breakpoint
ALTER TABLE "core_role_permissions" ADD CONSTRAINT "core_role_permissions_role_id_core_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."core_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_role_permissions" ADD CONSTRAINT "core_role_permissions_permission_id_core_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."core_permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_user_roles" ADD CONSTRAINT "core_user_roles_user_id_core_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."core_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_user_roles" ADD CONSTRAINT "core_user_roles_role_id_core_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."core_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_user_roles" ADD CONSTRAINT "core_user_roles_assigned_by_core_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."core_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_user_settings" DROP COLUMN "emergency_contact_name";--> statement-breakpoint
ALTER TABLE "core_user_settings" DROP COLUMN "emergency_contact_phone";--> statement-breakpoint
ALTER TABLE "core_user_settings" DROP COLUMN "emergency_contact_relationship";--> statement-breakpoint
ALTER TABLE "core_user_settings" DROP COLUMN "density";--> statement-breakpoint
ALTER TABLE "core_user_settings" DROP COLUMN "primary_color";--> statement-breakpoint
ALTER TABLE "core_user_settings" DROP COLUMN "font_size";--> statement-breakpoint
ALTER TABLE "core_user_settings" DROP COLUMN "sidebar_collapsed";