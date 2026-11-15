import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db/drizzle";
import { notes, users } from "@/lib/db/schema";

/** The signed-in user, or null. Every API route handler starts with this (see route-auth.test.ts). */
export const getUser = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  // session.user is read fresh from the DB (role, ban) only while cookieCache is off in auth.ts
  return session?.user ?? null;
};

export const listUsers = () =>
  db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .orderBy(users.email);

export const listNotes = (userId: string) =>
  db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.createdAt));

export const createNote = async (userId: string, text: string) => {
  const [note] = await db.insert(notes).values({ userId, text }).returning();
  return note;
};
