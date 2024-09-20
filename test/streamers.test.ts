import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../src/db/index.js";
import addStreamerHandler from "../src/lambdas/streamers/addStreamer.js";
import getFavouriteStreamersHandler from "../src/lambdas/streamers/getFavouriteStreamers.js";
import getUnfavouriteStreamersHandler from "../src/lambdas/streamers/getUnfavouriteStreamers.js";
import deleteStreamerHandler from "../src/lambdas/streamers/deleteStreamer.js";
import updateFavouritesHandler from "../src/lambdas/streamers/updateFavourites.js";
import { getUserIdFromToken } from "../src/middlewares/getUserIdFromToken.js";

// Mock the db module
vi.mock("../src/db/index.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the getUserIdFromToken function
vi.mock("../src/middlewares/getUserIdFromToken.js", () => ({
  getUserIdFromToken: vi.fn(),
}));

describe("streamers Lambda Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addStreamerHandler", () => {
    it("should add a new streamer and associate with the user", async () => {
      const mockRequest = {
        params: {
          lolIgn: "TestUser",
          lolTag: "EUW",
        },
        cookies: {
          token: "mocked-token",
        },
        body: {
          twitchLink: "https://twitch.tv/testuser",
          twitterLink: "https://twitter.com/testuser",
          youtubeLink: "https://youtube.com/testuser",
          name: "TestUser#EUW",
          profilePicture: "https://example.com/profile.png",
        },
      } as unknown as FastifyRequest;

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      // Mock getUserIdFromToken to return a userId
      (getUserIdFromToken as Mock).mockReturnValue(1);

      // Mock external fetch calls
      globalThis.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes("/accounts/by-riot-id")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                puuid: "mocked-puuid",
              }),
          });
        }

        if (url.includes("/summoner/v4/summoners/by-puuid")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                accountId: "mocked-account-id",
                id: "mocked-summoner-id",
              }),
          });
        }

        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({}),
        });
      });

      // Mock db.select and db.insert
      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      (db.insert as Mock).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([ { id: 2 } ]),
        }),
      });

      await addStreamerHandler(mockRequest, mockReply);

      expect(getUserIdFromToken).toHaveBeenCalledWith("mocked-token");
      expect(db.insert).toHaveBeenCalledTimes(2); // For players and usersToPlayers
      expect(mockReply.send).toHaveBeenCalled();
    });
  });

  describe("getFavouriteStreamersHandler", () => {
    it("should return favourite streamers for the user", async () => {
      const mockRequest = {
        cookies: {
          token: "mocked-token",
        },
      } as unknown as FastifyRequest;

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as unknown as FastifyReply;

      (getUserIdFromToken as Mock).mockReturnValue(1);

      // Mock db.select for favourite players
      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([
                {
                  puuid: "mocked-puuid",
                  summonerId: "mocked-summoner-id",
                  riotId: "mocked-riot-id",
                  pseudo: "TestUser#EUW",
                  name: "TestUser#EUW",
                  profilePicture: "https://example.com/profile.png",
                  id: 1,
                },
              ]),
            }),
          }),
        }),
      });

      // Mock fetch for player info
      globalThis.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                queueType: "RANKED_SOLO_5x5",
                summonerId: "mocked-summoner-id",
                tier: "GOLD",
                rank: "I",
                leaguePoints: 100,
                wins: 10,
                losses: 5,
              },
            ]),
        }),
      );

      await getFavouriteStreamersHandler(mockRequest, mockReply);

      expect(getUserIdFromToken).toHaveBeenCalledWith("mocked-token");
      expect(db.select).toHaveBeenCalled();
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith([
        expect.objectContaining({
          pseudo: "TestUser#EUW",
          wins: 10,
          losses: 5,
          winrate: 66.66666666666666,
        }),
      ]);
    });
  });

  describe("getUnfavouriteStreamersHandler", () => {
    it("should return unfavourite streamers", async () => {
      const mockRequest = {
        cookies: {
          token: "mocked-token",
        },
      } as unknown as FastifyRequest;

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as unknown as FastifyReply;

      (getUserIdFromToken as Mock).mockReturnValue(1);

      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([ { playerId: 1 } ]),
        }),
      });

      (db.select as Mock).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              puuid: "mocked-puuid",
              summonerId: "mocked-summoner-id",
              riotId: "mocked-riot-id",
              pseudo: "TestUser#EUW",
              name: "TestUser#EUW",
              profilePicture: "https://example.com/profile.png",
              id: 1,
            },
          ]),
        }),
      });

      globalThis.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                queueType: "RANKED_SOLO_5x5",
                summonerId: "mocked-summoner-id",
                wins: 5,
                losses: 5,
              },
            ]),
        }),
      );

      await getUnfavouriteStreamersHandler(mockRequest, mockReply);

      expect(getUserIdFromToken).toHaveBeenCalledWith("mocked-token");
      expect(db.select).toHaveBeenCalledTimes(2);
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith([
        expect.objectContaining({
          wins: 5,
          losses: 5,
          winrate: 50,
        }),
      ]);
    });
  });

  describe("deleteStreamerHandler", () => {
    it("should delete a streamer associated with the user", async () => {
      const mockRequest = {
        params: {
          playerId: "1",
        },
        cookies: {
          token: "mocked-token",
        },
      } as unknown as FastifyRequest;

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as unknown as FastifyReply;

      (getUserIdFromToken as Mock).mockReturnValue(1);

      (db.delete as Mock).mockReturnValueOnce({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([ { id: 1 } ]),
        }),
      });

      (db.delete as Mock).mockReturnValueOnce({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([ { userId: 1, playerId: 1 } ]),
        }),
      });

      await deleteStreamerHandler(mockRequest, mockReply);

      expect(getUserIdFromToken).toHaveBeenCalledWith("mocked-token");
      expect(db.delete).toHaveBeenCalledTimes(2);
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({ message: "Player deleted" });
    });
  });

  describe("updateFavouritesHandler", () => {
    it("should update a streamer's links", async () => {
      const mockRequest = {
        params: {
          lolIgn: "TestUser",
          lolTag: "EUW",
        },
        body: {
          twitchLink: "https://twitch.tv/newtestuser",
          twitterLink: "https://twitter.com/newtestuser",
          youtubeLink: "https://youtube.com/newtestuser",
          name: "NewTestUser#EUW",
          profilePicture: "https://example.com/newprofile.png",
        },
        cookies: {
          token: "mocked-token",
        },
      } as unknown as FastifyRequest;

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as unknown as FastifyReply;

      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([ { id: 1 } ]),
        }),
      });

      (db.update as Mock).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([ { id: 1 } ]),
          }),
        }),
      });

      await updateFavouritesHandler(mockRequest, mockReply);

      expect(db.select).toHaveBeenCalled();
      expect(db.update).toHaveBeenCalled();
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({ message: "Player updated" });
    });
  });
});
