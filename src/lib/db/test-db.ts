// Test double for `db`: every query-builder call returns the chain, awaiting it yields the next queued result
export const createDbMock = () => {
  const results: unknown[] = [];
  const calls: { method: string; args: unknown[] }[] = [];
  const chain: object = new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === "then") {
          return (resolve: (value: unknown) => void) => {
            resolve(results.shift());
          };
        }
        return (...args: unknown[]) => {
          calls.push({ method: String(prop), args });
          return chain;
        };
      },
    },
  );
  const reset = () => {
    results.length = 0;
    calls.length = 0;
  };
  return { results, calls, chain, reset };
};
