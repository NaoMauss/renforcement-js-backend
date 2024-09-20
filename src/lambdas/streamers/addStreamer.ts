/* eslint-disable node/prefer-global/process */
import type { FastifyReply, FastifyRequest } from "fastify";
import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { players, usersToPlayers } from "../../db/schema.js";
import { getUserIdFromToken } from "../../middlewares/getUserIdFromToken.js";
import {
  addStreamerReqSchema,
  type puuidRequest,
  type summonerRequest,
} from "./schema.js";

const {
  VITE_RIOT_API_KEY: apiKey,
  VITE_RIOT_REGION: region,
  VITE_RIOT_REGION_V4: regionV4,
} = process.env;

const handler = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const {
      params: { lolIgn, lolTag },
      cookies: { token },
      body: { twitchLink, twitterLink, youtubeLink, profilePicture, name },
    } = addStreamerReqSchema.parse(req);

    const userId = getUserIdFromToken(token);
    const decodedIgn = decodeURIComponent(lolIgn);

    const riotPlayerPuuidApiUrl = `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${decodedIgn}/${lolTag}`;
    const headers = { "X-Riot-Token": apiKey! };
    const responsePuuid = await fetch(riotPlayerPuuidApiUrl, { headers });
    const data = await responsePuuid.json() as puuidRequest;

    const { puuid } = data;

    const player = await db.select().from(players).where(eq(players.puuid, puuid));
    const playerAlreadyExist = player.length > 0;

    if (playerAlreadyExist) {
      const isAlreadyFavorite = await db
        .select()
        .from(usersToPlayers)
        .where(and(
          eq(usersToPlayers.userId, userId),
          eq(usersToPlayers.playerId, player[0].id),
        ));
      if (isAlreadyFavorite.length > 0) {
        res.status(400).send({ error: "You already favorite this player" });
        return;
      }
    }

    const riotPlayerInfoApiUrl = `https://${regionV4!}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    const responsePlayerInfo = await fetch(riotPlayerInfoApiUrl, { headers });
    const dataPlayerInfo = await responsePlayerInfo.json() as summonerRequest;

    const { accountId: riotId, id: summonerId } = dataPlayerInfo;
    const newPlayer = playerAlreadyExist
      ? player
      : await db.insert(players).values({
        pseudo: `${decodedIgn}#${lolTag}`,
        riotId,
        puuid,
        summonerId,
        name,
        twitchLink: twitchLink ?? "",
        twitterLink: twitterLink ?? "",
        youtubeLink: youtubeLink ?? "",
        profilePicture: profilePicture ?? "",
      }).returning();

    const playerId = newPlayer[0].id;

    await db.insert(usersToPlayers).values({
      userId,
      playerId,
    });

    res.send(dataPlayerInfo);
  }
  catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
};

export default handler;
