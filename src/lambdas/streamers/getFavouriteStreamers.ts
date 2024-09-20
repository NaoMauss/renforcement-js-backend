/* eslint-disable node/prefer-global/process */
import type { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { players, users, usersToPlayers } from "../../db/schema.js";
import { getUserIdFromToken } from "../../middlewares/getUserIdFromToken.js";
import type {
  ApiResponse,
  getFavouriteSchemaOutputType,
} from "./schema.js";
import {
  cookieReqSchema,
  getFavouriteSchema,
  getFavouriteSchemaOutput,
} from "./schema.js";

const {
  VITE_RIOT_API_KEY: apiKey,
  VITE_RIOT_REGION_V4: regionV4,
} = process.env;

const fetchPlayersInfo = async (summonerId: string): Promise<ApiResponse> => {
  const url = `https://${regionV4}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;
  const headers = { "X-Riot-Token": apiKey! };
  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    console.error(response.json());
    throw new Error("Failed to fetch player's info");
  }

  const data = await response.json() as ApiResponse;

  return data;
};

const tiers = [ "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER" ];
const ranks = [ "I", "II", "III", "IV" ];

const sortPlayersByTierAndRankAndLeaguePoints = (players: getFavouriteSchemaOutputType): getFavouriteSchemaOutputType => {
  const tierOrder = (tier: string) => tiers.indexOf(tier);
  const rankOrder = (rank: string) => ranks.indexOf(rank);

  return players.sort((a, b) => {
    const tierDiff = tierOrder(b.tier) - tierOrder(a.tier);
    if (tierDiff !== 0)
      return tierDiff;

    const rankDiff = rankOrder(a.rank) - rankOrder(b.rank);
    if (rankDiff !== 0)
      return rankDiff;

    return b.leaguePoints - a.leaguePoints;
  });
};

const handler = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { cookies } = cookieReqSchema.parse(req);
    const { token } = cookies;

    const userId = getUserIdFromToken(token);

    const favouritePlayers = await db
      .select({
        id: players.id,
        puuid: players.puuid,
        summonerId: players.summonerId,
        riotId: players.riotId,
        pseudo: players.pseudo,
        twitchLink: players.twitchLink,
        twitterLink: players.twitterLink,
        youtubeLink: players.youtubeLink,
        name: players.name,
        profilePicture: players.profilePicture,
      })
      .from(usersToPlayers)
      .leftJoin(players, eq(usersToPlayers.playerId, players.id))
      .leftJoin(users, eq(usersToPlayers.userId, users.id))
      .where(eq(usersToPlayers.userId, userId));

    const parsedFavouritePlayers = getFavouriteSchema.parse(favouritePlayers);

    const favouriteStreamers = await Promise.all(
      parsedFavouritePlayers.map(async (favouritePlayer) => {
        const playerInfo = await fetchPlayersInfo(favouritePlayer.summonerId);

        const filteredPlayerInfo = playerInfo.filter(player => player.queueType === "RANKED_SOLO_5x5")[0];
        const formattedPlayerInfo = {
          ...favouritePlayer,
          ...filteredPlayerInfo,
          losses: filteredPlayerInfo?.losses ?? 0,
          wins: filteredPlayerInfo?.wins ?? 0,
        };
        const winrate = formattedPlayerInfo.losses > 0 ? (formattedPlayerInfo.wins / (formattedPlayerInfo.losses + formattedPlayerInfo.wins) * 100) : 100;

        return {
          ...formattedPlayerInfo,
          winrate,
        };
      }),
    );

    const filteredFavouriteStreamers = favouriteStreamers.filter(fs => (fs.tier && fs.rank));
    const parsedFavouriteStreamers = getFavouriteSchemaOutput.parse(filteredFavouriteStreamers);

    res.status(200).send(sortPlayersByTierAndRankAndLeaguePoints(parsedFavouriteStreamers));
  }

  catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
};

export default handler;
