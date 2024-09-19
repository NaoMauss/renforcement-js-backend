import type { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { players, usersToPlayers } from "../../db/schema.js";
import { getUserIdFromToken } from "../../middlewares/getUserIdFromToken.js";
import {
  deleteStreamerReqSchema,
} from "./schema.js";

const handler = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const {
      params: { playerId },
      cookies: { token },
    } = deleteStreamerReqSchema.parse(req);

    const userId = getUserIdFromToken(token);

    const deletePlayer = await db.delete(players).where(eq(players.id, Number(playerId))).returning();

    if (deletePlayer.length === 0)
      res.status(404).send({ error: "Player not found" });

    await db.delete(usersToPlayers).where(eq(usersToPlayers.userId, userId)).returning();

    res.status(200).send({ message: "Player deleted" });
  }
  catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
};

export default handler;
