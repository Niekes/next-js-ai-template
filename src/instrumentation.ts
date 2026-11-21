import type { Instrumentation } from "next";

/** Logs every server error once; query strings, bodies and headers stay out of the log. */
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  console.error("Request failed", {
    method: request.method,
    // Query strings can carry tokens (password reset, email verification)
    path: request.path.split("?")[0],
    route: context.routePath,
    error,
  });
};
