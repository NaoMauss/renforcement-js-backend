import { hash } from "bcryptjs";

/* eslint-disable node/prefer-global/process */
import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { registerReqSchema } from "./schema.js";

const {
  VITE_JWT_SECRET,
} = process.env;

const generateToken = (userId: number): string =>
  jwt.sign({ userId }, VITE_JWT_SECRET!, { expiresIn: "1h" });

const handler = async (req: FastifyRequest, res: FastifyReply) => {
  const { body: { name, email, password } } = registerReqSchema.parse(req);

  const saltRounds = 10;
  const hashedPassword = await hash(password, saltRounds);

  const [ user ] = await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  }).returning({ id: users.id });

  const token = generateToken(user.id);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000 * 24 * 30, // 1 month
    path: "/",
  });

  res.send({ message: "Registration successful" });
};

export default handler;
