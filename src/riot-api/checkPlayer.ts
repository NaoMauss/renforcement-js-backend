/* eslint-disable node/prefer-global/process */
import type { FastifyReply, FastifyRequest } from "fastify";

import { checkPlayerReqSchema } from "./schema.js";

const {
  VITE_RIOT_API_KEY: apiKey,
  VITE_RIOT_REGION: region,
} = process.env;

const handler = async (req: FastifyRequest, res: FastifyReply) => {
  const { params: { lolIgn, lolTag } } = checkPlayerReqSchema.parse(req);

  const riotApiUrl = `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${lolIgn}/${lolTag}`;

  const headers = { "X-Riot-Token": apiKey as string };

  const response = await fetch(riotApiUrl, { headers });

  if (response.ok)
    res.send({ playerExist: true });

  else
    res.send({ playerExist: false });
};

export default handler;
