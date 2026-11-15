import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ROUTES } from "@/const/routes";
import { auth } from "@/lib/auth";

// Pages under /dashboard need a session; API routes check auth themselves (route-auth.test.ts)
export const proxy = async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session) return NextResponse.next();

  const signIn = new URL(ROUTES.signIn, request.url);
  signIn.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(signIn);
};

export const config = { matcher: ["/dashboard/:path*"] };
