import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";

import * as schema from "./schema";

// postgres.js connects lazily, so importing this module opens no connection
export const db = drizzle(postgres(env.POSTGRES_URL), { schema });
