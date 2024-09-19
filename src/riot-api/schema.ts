import { z } from "zod";

export const checkPlayerReqSchema = z.object({
  params: z.object({
    lolIgn: z.string(),
    lolTag: z.string(),
  }),
});
