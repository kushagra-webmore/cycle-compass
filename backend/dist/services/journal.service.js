import { DateTime } from 'luxon';
import { getSupabaseClient } from '../lib/supabase.js';
import { HttpError } from '../utils/http-error.js';
export const createJournalEntry = async ({ userId, date, encryptedText, aiSummary }) => {
    const supabase = getSupabaseClient();
    const istNow = DateTime.now().setZone('Asia/Kolkata');
    const isoDate = date
        ? DateTime.fromISO(date, { setZone: true }).setZone('Asia/Kolkata')
        : istNow;
    const { data, error } = await supabase
        .from('journals')
        .insert({
        user_id: userId,
        date: isoDate.toISO(),
        created_at: istNow.toISO(),
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
export const listJournalEntries = async (userId, limit = 30) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('date', { ascending: false })
        .limit(limit);
    if (error) {
        throw new HttpError(400, 'Failed to fetch journals', error);
    }
    return data ?? [];
};
export const softDeleteJournalEntry = async (userId, journalId) => {
    const supabase = getSupabaseClient();
    const istNow = DateTime.now().setZone('Asia/Kolkata');
    const { error } = await supabase
        .from('journals')
        .update({
        is_deleted: true,
        deleted_at: istNow.toISO(),
    })
        .eq('id', journalId)
        .eq('user_id', userId);
    if (error) {
        throw new HttpError(400, 'Failed to delete journal entry', error);
    }
};
//# sourceMappingURL=journal.service.js.map