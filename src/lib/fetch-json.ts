type ErrorBody = { error?: unknown };

/** Fetches a same-origin API path and returns its JSON, or throws the server's error message. */
export const fetchJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(path, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ErrorBody;
    throw new Error(typeof body.error === "string" ? body.error : "Request failed");
  }
  return (await res.json()) as T;
};
