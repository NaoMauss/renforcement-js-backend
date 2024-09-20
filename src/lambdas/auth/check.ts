import { compare } from "bcryptjs";

/* eslint-disable node/prefer-global/process */
import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { loginReqSchema } from "./schema.js";

const { VITE_JWT_SECRET } = process.env;

const generateToken = (userId: number): string =>
  jwt.sign({ userId }, VITE_JWT_SECRET!, { expiresIn: "1h" });

const handler = async (req: FastifyRequest, res: FastifyReply) => {
  const { body: { email, password } } = loginReqSchema.parse(req);

  const [ user ] = await db.select().from(users).where(eq(users.email, email));

  if (!user || !(await compare(password, user.password)))
    return res.status(401).send({ error: "Invalid credentials" });

  const token = generateToken(user.id);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000 * 24 * 30, // 1 month
    path: "/",
  });

  res.send({ message: "Login successful" });
};

export default handler;
