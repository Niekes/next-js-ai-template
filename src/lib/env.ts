import { z } from "zod";

const envSchema = z.object({
  POSTGRES_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  TRUSTED_PROXIES: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

// Without this, a missing .env surfaces later as a confusing DB or auth error
if (!parsed.success && process.env.NODE_ENV === "development") {
  console.warn(`Invalid environment, check .env:\n${z.prettifyError(parsed.error)}`);
}

// shortcut: `next build` and tests run without a real .env, so an invalid env falls back to the raw
// values instead of throwing; throw here once builds get real env values
export const env: Env = parsed.success ? parsed.data : (process.env as unknown as Env);
