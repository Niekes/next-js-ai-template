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
      {/* onSubmit, not action: React resets an action form before the save is known to succeed */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          createNote.mutate(
            { text: formText(new FormData(form), "text") },
            {
              onSuccess: () => {
                form.reset();
              },
            },
          );
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
      {createNote.isError && <p role="alert">Could not save the note.</p>}
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
