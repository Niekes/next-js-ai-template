import { z } from "zod";

const envSchema = z.object({
  POSTGRES_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  TRUSTED_PROXIES: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const message = `Invalid environment, check .env:\n${z.prettifyError(parsed.error)}`;
  // A running production server must not start with a weak secret or a broken database URL
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    throw new Error(message);
  }
  // Without this, a missing .env surfaces later as a confusing DB or auth error
  if (process.env.NODE_ENV === "development") console.warn(message);
}

// `next build` and tests run without a real .env, so there an invalid env falls back to the raw values
export const env: Env = parsed.success ? parsed.data : (process.env as unknown as Env);
