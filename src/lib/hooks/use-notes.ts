"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Note } from "@/lib/db/schema";
import { fetchJson } from "@/lib/fetch-json";
import type { NoteInput } from "@/lib/notes";
import { queryKeys } from "@/lib/query-keys";

// Dates arrive as JSON strings
type NoteRow = Omit<Note, "createdAt"> & { createdAt: string };

export const useNotes = () =>
  useQuery({
    queryKey: queryKeys.notes.list.queryKey,
    queryFn: () => fetchJson<NoteRow[]>("/api/notes"),
  });

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NoteInput) =>
      fetchJson<NoteRow>("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notes.list.queryKey }),
  });
};
