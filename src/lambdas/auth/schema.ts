import { z } from "zod";

export const registerReqSchema = z.object({
  body: z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string(),
  }),
});

export const loginReqSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});
