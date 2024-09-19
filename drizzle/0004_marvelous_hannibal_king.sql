ALTER TABLE "user" ALTER COLUMN "points" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "useless";