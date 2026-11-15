import { NextResponse } from "next/server";
import { z } from "zod";

import { getUser } from "@/lib/db/queries";

type AdminUser = NonNullable<Awaited<ReturnType<typeof getUser>>>;

/** Wraps an API route handler so only signed-in admins reach it. */
export const withAdmin = <TCtx>(
  handler: (request: Request, ctx: TCtx, user: AdminUser) => Promise<NextResponse>,
) => {
  return async (request: Request, ctx: TCtx) => {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return handler(request, ctx, user);
  };
};

/** Validates a JSON body; on failure returns the 400 response to send. */
export const parseBody = async <T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> => {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json({ error: z.treeifyError(parsed.error).errors }, { status: 400 }),
    };
  }
  return { ok: true, data: parsed.data };
};
