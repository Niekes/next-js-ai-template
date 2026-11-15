import { index, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import { users } from "./auth";

export const notes = pgTable(
  "note",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("note_user_id_idx").on(table.userId)],
);

export type Note = typeof notes.$inferSelect;
