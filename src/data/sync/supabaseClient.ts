import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export interface SupabaseNoteRow {
  id: string;
  title: string;
  content: string;
  tags: string[];
  is_pinned: boolean;
  is_archived: boolean;
  has_ocr: boolean;
  ocr_raw_text?: string;
  ai_summary?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface SupabaseTaskRow {
  id: string;
  note_id?: string;
  title: string;
  description?: string;
  is_completed: boolean;
  priority: string;
  due_date?: string;
  source: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}
