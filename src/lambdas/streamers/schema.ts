import { z } from "zod";

export const cookieReqSchema = z.object({
  cookies: z.object({
    token: z.string(),
  }),
});

export const addStreamerReqSchema = z.object({
  params: z.object({
    lolIgn: z.string(),
    lolTag: z.string(),
  }),
  body: z.object({
    twitchLink: z.string().optional(),
    twitterLink: z.string().optional(),
    youtubeLink: z.string().optional(),
    profilePicture: z.string().optional(),
    name: z.string(),
  }),
  cookies: z.object({
    token: z.string(),
  }),
});

export const getFavouriteSchema = z.array(
  z.object({
    id: z.number(),
    puuid: z.string(),
    summonerId: z.string(),
    riotId: z.string(),
    pseudo: z.string(),
    name: z.string(),
    twitchLink: z.string().optional(),
    twitterLink: z.string().optional(),
    youtubeLink: z.string().optional(),
    profilePicture: z.string().optional(),
  }),
);

export const getFavouriteSchemaOutput = z.array(
  z.object({
    id: z.number(),
    puuid: z.string(),
    summonerId: z.string(),
    riotId: z.string(),
    pseudo: z.string(),
    name: z.string(),
    twitchLink: z.string().optional(),
    twitterLink: z.string().optional(),
    youtubeLink: z.string().optional(),
    profilePicture: z.string().optional(),
    winrate: z.number(),
    losses: z.number(),
    leaguePoints: z.number(),
    wins: z.number(),
    tier: z.string(),
    rank: z.string(),
  }),
);

export type getFavouriteSchemaOutputType = z.infer<typeof getFavouriteSchemaOutput>;

export const deleteStreamerReqSchema = z.object({
  params: z.object({
    playerId: z.string(),
  }),
  cookies: z.object({
    token: z.string(),
  }),
});

export type getFavouriteSchemaType = z.infer<typeof getFavouriteSchema>;

export interface puuidRequest {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface summonerRequest {
  id: string;
  accountId: string;
  puuid: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export const ApiResponseSchema = z.array(z.object({
  queueType: z.string(),
  summonerId: z.string(),
  leagueId: z.string().optional(),
  leaguePoints: z.number(),
  wins: z.number(),
  losses: z.number(),
  veteran: z.boolean(),
  inactive: z.boolean(),
  freshBlood: z.boolean(),
  hotStreak: z.boolean(),
  tier: z.string().optional(),
  rank: z.string().optional(),
}));

export type ApiResponse = z.infer<typeof ApiResponseSchema>;
