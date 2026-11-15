import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db/drizzle";
import { notes } from "@/lib/db/schema";

export const listNotes = (userId: string) =>
  db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.createdAt));

export const createNote = async (userId: string, text: string) => {
  const [note] = await db.insert(notes).values({ userId, text }).returning();
  return note;
};
