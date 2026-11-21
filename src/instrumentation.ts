import type { Instrumentation } from "next";

/** Logs every server error once, without query string, headers, bodies or query values. */
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const err = error instanceof Error ? error : new Error(String(error));
  // Drizzle appends the query's values ("\nparams: ..."), which hold user data; the cause is
  // left out for the same reason (Postgres puts row values in its detail)
  const message = err.message.replace(/\nparams:[\s\S]*/, "");
  console.error("Request failed", {
    method: request.method,
    // Query strings can carry tokens (password reset, email verification)
    path: request.path.split("?")[0],
    route: context.routePath,
    message,
    // Links the digest shown by error.tsx to this log line
    digest: "digest" in err ? err.digest : undefined,
    stack: String(err.stack).replace(err.message, message),
  });
};
