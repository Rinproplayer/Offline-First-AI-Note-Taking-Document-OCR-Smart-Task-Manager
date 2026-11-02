import { SyncStatus } from './Note';

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskSource = 'manual' | 'ai_extracted' | 'ocr';

export interface Task {
  id: string;
  noteId?: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  priority: TaskPriority;
  dueDate?: Date;
  source: TaskSource;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
}
