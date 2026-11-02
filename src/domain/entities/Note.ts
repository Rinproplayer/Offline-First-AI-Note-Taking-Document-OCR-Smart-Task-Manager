export type SyncStatus = 'synced' | 'pending' | 'conflict';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  hasOcr: boolean;
  ocrRawText?: string;
  aiSummary?: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
}
