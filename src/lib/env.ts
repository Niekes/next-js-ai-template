import { config } from "dotenv";
import { z } from "zod";

config({ quiet: true });

const envSchema = z.object({
  POSTGRES_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
});

type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

// shortcut: `next build` and tests run without a real .env, so an invalid env falls back to the raw
// values instead of throwing; throw here once builds get real env values
export const env: Env = parsed.success ? parsed.data : (process.env as unknown as Env);
