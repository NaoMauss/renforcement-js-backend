CREATE TABLE IF NOT EXISTS "bet" (
	"id" serial PRIMARY KEY NOT NULL,
	"amount" double precision NOT NULL,
	"success" boolean,
	"game_id" text,
	"user_id" serial NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "player" (
	"id" serial PRIMARY KEY NOT NULL,
	"riot_id" varchar(256) NOT NULL,
	"puuid" varchar(256) NOT NULL,
	CONSTRAINT "player_riot_id_unique" UNIQUE("riot_id"),
	CONSTRAINT "player_puuid_unique" UNIQUE("puuid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256),
	"email" varchar(256),
	"password" varchar(256),
	"points" double precision DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users_to_players" (
	"user_id" serial NOT NULL,
	"player_id" serial NOT NULL,
	CONSTRAINT "users_to_players_user_id_player_id_pk" PRIMARY KEY("user_id","player_id")
);
--> statement-breakpoint
DROP TABLE "azeazea_post";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bet" ADD CONSTRAINT "bet_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_to_players" ADD CONSTRAINT "users_to_players_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_to_players" ADD CONSTRAINT "users_to_players_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "name_idx" ON "user" USING btree ("name");