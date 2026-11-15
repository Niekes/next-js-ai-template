import { getTableColumns } from "drizzle-orm";
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vite-plus/test";

import * as schema from "./index";

const tables = Object.values(schema) as PgTable[];

describe("schema", () => {
  it("defines the Better Auth tables and notes", () => {
    expect(tables.map((table) => getTableConfig(table).name)).toEqual([
      "user",
      "session",
      "account",
      "verification",
      "note",
    ]);
  });

  it("points every foreign key at the user table", () => {
    const targets = tables.flatMap((table) =>
      getTableConfig(table).foreignKeys.map(
        (fk) => getTableConfig(fk.reference().foreignTable).name,
      ),
    );

    expect(targets).toEqual(["user", "user", "user"]);
  });

  it("stamps updated_at with the current time on update", () => {
    const stamps = tables.flatMap((table) =>
      Object.values(getTableColumns(table)).flatMap((column) =>
        column.onUpdateFn ? [column.onUpdateFn()] : [],
      ),
    );

    expect(stamps).toHaveLength(4);
    expect(stamps.every((stamp) => stamp instanceof Date)).toBe(true);
  });
});
