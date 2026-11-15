import { z } from "zod";

/** What a client may send to create a note; the server owns every other column. */
export const noteInput = z.object({ text: z.string().trim().min(1).max(2000) });

export type NoteInput = z.infer<typeof noteInput>;
