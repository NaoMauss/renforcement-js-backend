ALTER TABLE "player" ADD COLUMN "pseudo" varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE "player" ADD COLUMN "twitch_link" varchar(256);--> statement-breakpoint
ALTER TABLE "player" ADD COLUMN "twitter_link" varchar(256);--> statement-breakpoint
ALTER TABLE "player" ADD COLUMN "youtube_link" varchar(256);--> statement-breakpoint
ALTER TABLE "player" ADD COLUMN "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE "player" ADD COLUMN "updated_at" timestamp with time zone;