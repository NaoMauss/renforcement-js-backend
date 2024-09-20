import type { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { players } from "../../db/schema.js";

import {
  addStreamerReqSchema,
} from "./schema.js";

const handler = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const {
      params: { lolIgn, lolTag },
      body: { twitchLink, twitterLink, youtubeLink },
    } = addStreamerReqSchema.parse(req);

    const decodedIgn = decodeURIComponent(lolIgn);
    const [ playerToUpdate ] = await db.select({ id: players.id }).from(players).where(eq(players.pseudo, `${decodedIgn}#${lolTag}`));

    const { id: playerIdToUpdate } = playerToUpdate;

    if (!playerIdToUpdate)
      res.status(404).send({ error: "Player not found" });

    await db.update(players).set({
      twitchLink,
      twitterLink,
      youtubeLink,
    }).where(eq(players.id, playerIdToUpdate)).returning();

    res.status(200).send({ message: "Player updated" });
  }
  catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
};

export default handler;
