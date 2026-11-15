import { NextResponse } from "next/server";

import { parseBody } from "@/lib/auth/middleware";
import { createNote, getUser, listNotes } from "@/lib/db/queries";
import { noteInput } from "@/lib/notes";

export const GET = async () => {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(await listNotes(user.id));
};

export const POST = async (request: Request) => {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await parseBody(request, noteInput);
  if (!body.ok) return body.response;
  return NextResponse.json(await createNote(user.id, body.data.text), { status: 201 });
};
