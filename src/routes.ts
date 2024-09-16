import type { FastifyInstance } from "fastify";

export const defineRoutes = (app: FastifyInstance) => {
  app.get("/", async () => {
    return "Hello World";
  });
};
