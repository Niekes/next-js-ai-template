type ErrorBody = { error?: unknown };

/** Fetches a same-origin API path and returns its JSON, or throws the server's error message with the HTTP status. */
export const fetchJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(path, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ErrorBody;
    const message = typeof body.error === "string" ? body.error : "Request failed";
    throw Object.assign(new Error(message), { status: res.status });
  }
  return (await res.json()) as T;
};
