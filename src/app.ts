import process from "node:process";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { defineRoutes } from "./routes.js";

const { VITE_COOKIE_SECRET } = process.env;

const app = Fastify();

const start = async () => {
  try {
    defineRoutes(app);
    await app.register(cookie, {
      secret: VITE_COOKIE_SECRET,
    });

    await app.register(cors, {
      origin: "http://localhost:5173",
      credentials: true,
    });

    await app.listen({ port: 3000, host: "0.0.0.0" });
  }
  catch (err) {
    app.log.error(err);
    console.error(err);
    process.exit(1);
  }
};

start();
