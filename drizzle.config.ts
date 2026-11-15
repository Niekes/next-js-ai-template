import "dotenv/config";

import type { Config } from "drizzle-kit";

const url = process.env.POSTGRES_URL;
if (!url) throw new Error("POSTGRES_URL is not set");

export default {
  schema: "./src/lib/db/schema/index.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
} satisfies Config;
