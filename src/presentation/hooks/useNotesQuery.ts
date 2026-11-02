import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { watermelonNoteRepository } from '../../data/repositories/WatermelonNoteRepository';
import { Note } from '../../domain/entities/Note';

export function useNotes(query = '', tag = 'Tất cả') {
  return useQuery({
    queryKey: ['notes', query, tag],
    queryFn: async () => {
      return watermelonNoteRepository.searchNotes(query, tag);
    }
  });
}

export function useNoteById(id: string) {
  return useQuery({
    queryKey: ['note', id],
    queryFn: async () => {
      return watermelonNoteRepository.getNoteById(id);
    },
    enabled: !!id
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newNote: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => {
      return watermelonNoteRepository.createNote(newNote);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Note> }) => {
      return watermelonNoteRepository.updateNote(id, updates);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note', updated.id] });
    }
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return watermelonNoteRepository.deleteNote(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });
}
