# Conventions

- **Path alias**: `@/*` → `./src/*`. Pages and routes import only through it.
- **Auth**: Better Auth (`src/lib/auth.ts`, client in `src/lib/auth-client.ts`),
  email and password plus the admin plugin (roles `member` and `admin`).
  `getUser()` from `src/lib/db/queries.ts` resolves the session on the server.
  Admin route handlers wrap themselves in `withAdmin` from
  `src/lib/auth/middleware.ts`; every other handler opens with
  `const user = await getUser(); if (!user) return ...`. Page protection lives
  in `src/proxy.ts`.
- **Validation**: request bodies go through a zod schema and `parseBody`. The
  schema lives in the feature's `api/`, so client and server share it.
- **Data mutations**: API route → TanStack Query `useMutation` →
  `queryClient.invalidateQueries({ queryKey })` on success.
- **Query keys**: define and consume every key through the `queryKeys` store in
  `src/lib/query-keys.ts`. Never write key arrays by hand.
- **Server Components** import queries from the feature's `server/` (or
  `src/lib/db/queries.ts` for shared ones) directly.
- **Client Components** use the feature's hooks from `api/` or `hooks/`, and
  shared hooks from `src/lib/hooks/`.
- **Browser APIs** (storage, `matchMedia`, window/document listeners,
  `setInterval`, clipboard, observers) go through
  [ahooks](https://ahooks.js.org) (`pnpm add ahooks` on first use) or a house
  hook in `src/lib/hooks/`. Lint bans the raw calls in `src/`; server code
  (`src/lib/db/`, `src/app/api/`, `src/features/*/server/`) is exempt.
- **CSRF / trusted origins**: configure via Better Auth, not hand-rolled checks.
- **Environment**: every variable is declared in the zod schema in
  `src/lib/env.ts` and in `.env.example`; read `env`, never `process.env`.
- **Import ordering**: enforced by `simple-import-sort`. `vp check --fix` fixes it.
- **Function style**: `const` arrow functions only, never `function`
  declarations. Pages and layouts export at the bottom:
  `const Page = () => {...}; export default Page;`.
- **No enums**: a union of string literals or an `as const` object.
- **Tests**: colocate `*.test.ts(x)` next to the code. Component tests start
  with `// @vitest-environment jsdom`. See [quality.md](quality.md).
- **Pointer cursor**: set once in `src/app/globals.css` for real buttons. Make
  clickable things real `<a>`/`<button>`; lint bans `onClick` on
  non-interactive elements.
