import { appSchema, tableSchema } from '@nozbe/watermelondb';

/**
 * WatermelonDB Schema v1 for MindVault Offline-First architecture.
 * Contains 2 tables: `notes` and `tasks`.
 * `id` is automatically created and indexed by WatermelonDB for all tables.
 */
export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'notes',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'tags', type: 'string' }, // Serialized JSON string array
        { name: 'sync_status', type: 'string' }, // 'synced' | 'pending' | 'conflict'
        { name: 'is_pinned', type: 'boolean', isOptional: true },
        { name: 'is_archived', type: 'boolean', isOptional: true },
        { name: 'has_ocr', type: 'boolean', isOptional: true },
        { name: 'ocr_raw_text', type: 'string', isOptional: true },
        { name: 'ai_summary', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number', isIndexed: true }
      ]
    }),
    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'priority', type: 'string' }, // 'low' | 'medium' | 'high'
        { name: 'due_date', type: 'number', isOptional: true },
        { name: 'status', type: 'string' }, // 'pending' | 'in_progress' | 'completed'
        { name: 'note_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'is_completed', type: 'boolean' },
        { name: 'source', type: 'string' }, // 'manual' | 'ai_extracted' | 'ocr'
        { name: 'sync_status', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number', isIndexed: true }
      ]
    })
  ]
});
