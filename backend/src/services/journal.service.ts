import { DateTime } from 'luxon';
import { getSupabaseClient } from '../lib/supabase.js';
import { HttpError } from '../utils/http-error.js';

export interface CreateJournalParams {
  userId: string;
  date: string;
  encryptedText: string;
  aiSummary?: string;
}

export const createJournalEntry = async ({ userId, date, encryptedText, aiSummary }: CreateJournalParams) => {
  const supabase = getSupabaseClient();
  const now = DateTime.utc();

  const isoDate = date
    ? DateTime.fromISO(date, { setZone: true }).toUTC()
    : now;

  const { data, error } = await supabase
    .from('journals')
    .insert({
      user_id: userId,
      date: isoDate.toISO(),
      created_at: now.toISO(),
      encrypted_text: encryptedText,
      ai_summary: aiSummary,
    })
    .select()
    .single();

  if (error || !data) {
    throw new HttpError(400, 'Failed to create journal entry', error);
  }

  return data;
};

export const listJournalEntries = async (userId: string, limit = 30) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('journals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new HttpError(400, 'Failed to fetch journals', error);
  }

  return data ?? [];
};

export const softDeleteJournalEntry = async (userId: string, journalId: string) => {
  const supabase = getSupabaseClient();
  const now = DateTime.utc();

  const { error } = await supabase
    .from('journals')
    .update({
      is_deleted: true,
      deleted_at: now.toISO(),
    })
    .eq('id', journalId)
    .eq('user_id', userId);

  if (error) {
    throw new HttpError(400, 'Failed to delete journal entry', error);
  }
};
