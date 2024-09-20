import type { FastifyInstance } from "fastify";

import checkPlayer from "./riot-api/checkPlayer.js";

import register from "./lambdas/auth/register.js";
import login from "./lambdas/auth/login.js";

import addStreamer from "./lambdas/streamers/addStreamer.js";
import deleteStreamer from "./lambdas/streamers/deleteStreamer.js";
import getUnfavouriteStreamers from "./lambdas/streamers/getUnfavouriteStreamers.js";
import getFavouriteStreamers from "./lambdas/streamers/getFavouriteStreamers.js";
import updateFavourites from "./lambdas/streamers/updateFavourites.js";

import { verifyToken } from "./middlewares/verifyToken.js";

export const defineRoutes = (app: FastifyInstance) => {
  app.get("/", async () => {
    return "Hello World";
  });

  app.post("/auth/register", register);
  app.post("/auth/login", login);
  app.get("/auth/check", { preHandler: verifyToken }, (_, res) => {
    res.send({ authenticated: true });
  });

  app.get("/check-player/:lolIgn/:lolTag", checkPlayer);
  app.get("/streamers", { preHandler: verifyToken }, getFavouriteStreamers);
  app.post("/streamers/:lolIgn/:lolTag", { preHandler: verifyToken }, addStreamer);
  app.delete("/streamers/:playerId", { preHandler: verifyToken }, deleteStreamer);
  app.put("/streamers/:lolIgn/:lolTag", { preHandler: verifyToken }, updateFavourites);
  app.get("/streamers/unfavourite", { preHandler: verifyToken }, getUnfavouriteStreamers);
};
