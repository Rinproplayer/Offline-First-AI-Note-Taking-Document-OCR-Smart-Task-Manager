import { Note } from '../entities/Note';

export interface INoteRepository {
  getNotes(): Promise<Note[]>;
  getNoteById(id: string): Promise<Note | null>;
  createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Note>;
  updateNote(id: string, updates: Partial<Note>): Promise<Note>;
  deleteNote(id: string): Promise<void>;
  searchNotes(query: string, tag?: string): Promise<Note[]>;
}
