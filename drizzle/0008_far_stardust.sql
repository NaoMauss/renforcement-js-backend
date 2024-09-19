ALTER TABLE "player" ADD COLUMN "summoner_id" varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_summoner_id_unique" UNIQUE("summoner_id");