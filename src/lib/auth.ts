import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";

import { db } from "@/lib/db/drizzle";
import { accounts, sessions, users, verifications } from "@/lib/db/schema";
import { env } from "@/lib/env";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: users, session: sessions, account: accounts, verification: verifications },
  }),
  emailAndPassword: { enabled: true },
  plugins: [admin({ defaultRole: "member" }), nextCookies()],
  // Rate limits key on the client IP from X-Forwarded-For. A header holding a chain of IPs
  // (several proxies, or a client-forged entry) only resolves with the outer proxies trusted
  advanced: {
    ipAddress: {
      trustedProxies:
        env.TRUSTED_PROXIES?.split(",")
          .map((ip) => ip.trim())
          .filter(Boolean) ?? [],
    },
  },
});
