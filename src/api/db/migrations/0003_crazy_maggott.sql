ALTER TABLE "core_user_settings" ALTER COLUMN "theme" SET DEFAULT 'light';--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "theme" SET DEFAULT 'light';--> statement-breakpoint
ALTER TABLE "core_user_settings" DROP COLUMN "density";--> statement-breakpoint
ALTER TABLE "core_user_settings" DROP COLUMN "primary_color";--> statement-breakpoint
ALTER TABLE "core_user_settings" DROP COLUMN "font_size";--> statement-breakpoint
ALTER TABLE "core_user_settings" DROP COLUMN "sidebar_collapsed";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "density";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "primary_color";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "font_size";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "sidebar_collapsed";