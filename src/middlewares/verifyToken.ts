/* eslint-disable node/prefer-global/process */
import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

const { VITE_JWT_SECRET } = process.env;

export const verifyToken = (req: FastifyRequest, res: FastifyReply, next: () => void) => {
  const { token } = req.cookies;

  try {
    const decoded = jwt.verify(token!, VITE_JWT_SECRET!);
    (req as any).user = decoded;
    next();
  }
  catch (error) {
    return res.status(401).send({ error: "Invalid token" });
  }
};
