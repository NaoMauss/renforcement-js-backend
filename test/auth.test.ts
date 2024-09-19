/* eslint-disable ts/ban-ts-comment */
import type { Mock } from "vitest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../src/db/index.js";
import loginHandler from "../src/lambdas/auth/login.js";
import registerHandler from "../src/lambdas/auth/register.js";

// Mock the bcrypt module
vi.mock("bcryptjs", async () => {
  const actual = await vi.importActual<typeof import("bcryptjs")>("bcryptjs");
  return {
    ...actual,
    hash: vi.fn().mockResolvedValue("mocked-hashed-password"),
    compare: vi.fn().mockImplementation((password, hash) => hash === "mocked-hashed-password"),
  };
});

// Mock the database module
vi.mock("../src/db/index.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

describe("lambda Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("registerHandler", () => {
    it("should register a new user and set a cookie", async () => {
      const mockRequest = {
        body: {
          name: "TestUser",
          email: "test@example.com",
          password: "password123",
        },
      } as FastifyRequest;

      const mockReply = {
        cookie: vi.fn(),
        send: vi.fn(),
      } as unknown as FastifyReply;

      const mockUser = { id: 1 };

      (db.insert as Mock).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([ mockUser ]),
        }),
      });

      await registerHandler(mockRequest, mockReply);

      expect(db.insert).toHaveBeenCalled();

      // @ts-expect-error
      expect(mockReply.cookie).toHaveBeenCalledWith(
        "token",
        expect.any(String),
        expect.objectContaining({ httpOnly: true }),
      );
      expect(mockReply.send).toHaveBeenCalledWith({
        message: "Registration successful",
      });
    });
  });

  describe("loginHandler", () => {
    it("should log in an existing user and set a cookie", async () => {
      const mockRequest = {
        body: {
          email: "test@example.com",
          password: "password123",
        },
      } as FastifyRequest;

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
        cookie: vi.fn(),
      } as unknown as FastifyReply;

      const mockUser = {
        id: 1,
        email: "test@example.com",
        password: "mocked-hashed-password",
      };

      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([ mockUser ]),
        }),
      });

      await loginHandler(mockRequest, mockReply);

      expect(db.select).toHaveBeenCalled();

      // @ts-expect-error
      expect(mockReply.cookie).toHaveBeenCalledWith(
        "token",
        expect.any(String),
        expect.objectContaining({ httpOnly: true }),
      );
      expect(mockReply.send).toHaveBeenCalledWith({
        message: "Login successful",
      });
    });

    it("should return an error if the user does not exist", async () => {
      const mockRequest = {
        body: {
          email: "test@example.com",
          password: "password123",
        },
      } as FastifyRequest;

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
        cookie: vi.fn(),
      } as unknown as FastifyReply;

      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      await loginHandler(mockRequest, mockReply);

      expect(db.select).toHaveBeenCalled();

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Invalid credentials",
      });
    });

    it("should return an error if the password is incorrect", async () => {
      const mockRequest = {
        body: {
          email: "test@example.com",
          password: "password123",
        },
      } as FastifyRequest;

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
        cookie: vi.fn(),
      } as unknown as FastifyReply;

      const mockUser = {
        id: 1,
        email: "test@example.com",
        password: "invalid-mocked-hashed-password",
      };

      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([ mockUser ]),
        }),
      });

      await loginHandler(mockRequest, mockReply);

      expect(db.select).toHaveBeenCalled();

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: "Invalid credentials",
      });
    });
  });
});
