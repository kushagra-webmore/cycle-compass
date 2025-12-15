import { getSupabaseClient } from '../lib/supabase';
import { HttpError } from '../utils/http-error';

export interface CreateJournalParams {
  userId: string;
  date: string;
  encryptedText: string;
  aiSummary?: string;
}

export const createJournalEntry = async ({ userId, date, encryptedText, aiSummary }: CreateJournalParams) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('journals')
    .insert({
      user_id: userId,
      date,
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
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    throw new HttpError(400, 'Failed to fetch journals', error);
  }

  return data ?? [];
};
