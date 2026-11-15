"use client";

import { AppButton } from "@/components/app-button";
import { AppInput } from "@/components/app-input";
import { useCreateNote, useNotes } from "@/features/notes/api/use-notes";
import { formText } from "@/lib/forms";

export const NotesPanel = () => {
  const notes = useNotes();
  const createNote = useCreateNote();

  return (
    <>
      <form
        action={(form) => {
          createNote.mutate({ text: formText(form, "text") });
        }}
        className="mb-6 flex items-end gap-2"
      >
        <div className="flex-1">
          <AppInput label="New note" name="text" required maxLength={2000} />
        </div>
        <AppButton type="submit" disabled={createNote.isPending}>
          Add
        </AppButton>
      </form>
      {notes.isError && <p role="alert">Could not load notes.</p>}
      <ul className="grid gap-2">
        {notes.data?.map((note) => (
          <li key={note.id} className="rounded-lg border p-3">
            {note.text}
          </li>
        ))}
      </ul>
    </>
  );
};
