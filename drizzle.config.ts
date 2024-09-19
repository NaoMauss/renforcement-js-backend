/* eslint-disable node/prefer-global/process */
import type { Config } from "drizzle-kit";

const { VITE_DB_URL: url } = process.env;

if (!url)
  throw new Error("VITE_DB_URL is not set");

export default {
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url,
  },
} satisfies Config;
