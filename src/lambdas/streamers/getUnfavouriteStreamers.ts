/* eslint-disable node/prefer-global/process */
import type { FastifyReply, FastifyRequest } from "fastify";
import { eq, inArray, not } from "drizzle-orm";
import { db } from "../../db/index.js";
import { players, usersToPlayers } from "../../db/schema.js";
import { getUserIdFromToken } from "../../middlewares/getUserIdFromToken.js";
import type { ApiResponse } from "./schema.js";
import { cookieReqSchema, getFavouriteSchema } from "./schema.js";

const {
  VITE_RIOT_API_KEY: apiKey,
  VITE_RIOT_REGION_V4: regionV4,
} = process.env;

const fetchPlayersInfo = async (summonerId: string): Promise<ApiResponse> => {
  const url = `https://${regionV4}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;
  const headers = { "X-Riot-Token": apiKey! };
  const response = await fetch(url, { method: "GET", headers });

  if (!response.ok) {
    console.error(await response.json());
    throw new Error("Failed to fetch player's info");
  }

  return await response.json() as ApiResponse;
};

const handler = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { cookies } = cookieReqSchema.parse(req);
    const { token } = cookies;

    const userId = getUserIdFromToken(token);

    const favouritePlayerIds = await db
      .select({ playerId: usersToPlayers.playerId })
      .from(usersToPlayers)
      .where(eq(usersToPlayers.userId, userId));

    const nonFavouritePlayers = await db
      .select({
        id: players.id,
        puuid: players.puuid,
        summonerId: players.summonerId,
        riotId: players.riotId,
        name: players.name,
        profilePicture: players.profilePicture,
        pseudo: players.pseudo,
        twitchLink: players.twitchLink,
        twitterLink: players.twitterLink,
        youtubeLink: players.youtubeLink,
      })
      .from(players)
      .where(not(inArray(players.id, favouritePlayerIds.map(fp => fp.playerId))));

    const parsedNonFavouritePlayers = getFavouriteSchema.parse(nonFavouritePlayers);

    const nonFavouriteStreamers = await Promise.all(
      parsedNonFavouritePlayers.map(async (player) => {
        const playerInfo = await fetchPlayersInfo(player.summonerId);
        const filteredPlayerInfo = playerInfo.filter(p => p.queueType === "RANKED_SOLO_5x5")[0];
        const winrate = filteredPlayerInfo.losses > 0
          ? (filteredPlayerInfo.wins / (filteredPlayerInfo.losses + filteredPlayerInfo.wins) * 100)
          : 100;
        return {
          ...player,
          ...filteredPlayerInfo,
          winrate,
        };
      }),
    );

    res.status(200).send(nonFavouriteStreamers);
  }
  catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
};

export default handler;
