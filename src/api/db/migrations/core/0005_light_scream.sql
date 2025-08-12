CREATE TABLE "email_two_factor_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "core_users" ADD COLUMN "two_factor_backup_codes" text;--> statement-breakpoint
ALTER TABLE "email_two_factor_tokens" ADD CONSTRAINT "email_two_factor_tokens_user_id_core_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."core_users"("id") ON DELETE no action ON UPDATE no action;