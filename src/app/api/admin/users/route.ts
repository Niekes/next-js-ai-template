import { NextResponse } from "next/server";

import { withAdmin } from "@/lib/auth/middleware";
import { listUsers } from "@/lib/db/queries";

export const GET = withAdmin(async () => NextResponse.json(await listUsers()));
