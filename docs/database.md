# Database

Drizzle ORM on Postgres (`postgres` driver). Schema and queries live in
`src/lib/db/`; migrations output to `src/lib/db/migrations/`.

Start the local database with `make start` or `docker compose up -d --wait`
(port `54322`).

## Migrations

**Never write `.sql` migration files by hand.** Edit the TypeScript schema in
`src/lib/db/schema/`, then:

```bash
pnpm db:generate   # diff schema → new SQL migration
pnpm db:migrate    # apply migrations
```

(`pnpm db:setup` runs both.)

Data backfills go in a custom migration created with
`pnpm db:generate --custom --name=<name>`, never by hand-creating a file.

The auth tables in `src/lib/db/schema/auth.ts` follow Better Auth's schema
plus its admin plugin. Adding a Better Auth plugin usually adds columns or
tables; check the plugin docs, extend the schema, then generate.
`rate_limit` holds Better Auth's rate-limit counters, so every replica shares
them; Better Auth prunes expired rows itself.

## Tests

Query tests never touch a real database: they mock `@/lib/db/drizzle` with
`createDbMock()` from `src/lib/db/test-db.ts`, queue the results each query
should return, and assert the builder calls.

## Inspect

```bash
pnpm db:studio   # Drizzle Studio UI
```

Make a user admin in Drizzle Studio by setting `role` to `admin`.
