import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTableCreator,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator(name => `${name}`);

export const users = createTable("user", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }),
  password: varchar("password", { length: 256 }).notNull(),
  points: integer("points").default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
}, example => ({
  nameIndex: index("name_idx").on(example.name),
}));

export const players = createTable("player", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  pseudo: varchar("pseudo", { length: 256 }).notNull(),
  riotId: varchar("riot_id", { length: 256 }).unique().notNull(),
  puuid: varchar("puuid", { length: 256 }).unique().notNull(),
  summonerId: varchar("summoner_id", { length: 256 }).unique().notNull(),
  twitchLink: varchar("twitch_link", { length: 256 }),
  twitterLink: varchar("twitter_link", { length: 256 }),
  youtubeLink: varchar("youtube_link", { length: 256 }),
  profilePicture: varchar("profile_picture", { length: 256 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const usersToPlayers = createTable("users_to_players", {
  userId: serial("user_id").notNull().references(() => users.id),
  playerId: serial("player_id").notNull().references(() => players.id),
}, table => ({
  pk: primaryKey({ columns: [ table.userId, table.playerId ] }),
}));

export const bets = createTable("bet", {
  id: serial("id").primaryKey(),
  amount: doublePrecision("amount").notNull(),
  success: boolean("success"),
  gameId: text("game_id"),
  userId: serial("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});
