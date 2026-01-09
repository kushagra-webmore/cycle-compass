import { getSupabaseClient } from '../lib/supabase.js';
import { HttpError } from '../utils/http-error.js';
import { getCycleContext } from '../utils/cycle.js';
const mapCycleRow = (row, periodLength = 5) => {
    const cycleLength = row.cycle_length ?? 28;
    return {
        id: row.id,
        startDate: row.start_date,
        endDate: row.end_date,
        cycleLength,
        isPredicted: row.is_predicted,
        context: getCycleContext(row.start_date, cycleLength, periodLength),
    };
};
export const createCycle = async (userId, input) => {
    const supabase = getSupabaseClient();
    const cycleLength = input.cycleLength ?? 28;
    const { data, error } = await supabase
        .from('cycles')
        .insert({
        user_id: userId,
        start_date: input.startDate,
        end_date: input.endDate,
        cycle_length: cycleLength,
        is_predicted: input.isPredicted ?? false,
    })
        .select()
        .single();
    if (error || !data) {
        throw new HttpError(400, 'Failed to create cycle', error);
    }
    await supabase
        .from('profiles')
        .update({
        last_period_date: input.startDate,
        cycle_length: cycleLength,
        onboarding_completed: true,
    })
        .eq('user_id', userId);
    const { data: profile } = await supabase
        .from('profiles')
        .select('period_length')
        .eq('user_id', userId)
        .single();
    return mapCycleRow(data, profile?.period_length);
};
export const createCyclesBulk = async (userId, cycles) => {
    if (!cycles || cycles.length < 2) {
        throw new HttpError(400, 'Please provide at least the most recent two cycles.');
    }
    const supabase = getSupabaseClient();
    const sanitized = cycles
        .filter((cycle) => Boolean(cycle.startDate))
        .map((cycle) => ({
        user_id: userId,
        start_date: cycle.startDate,
        end_date: cycle.endDate ?? null,
        cycle_length: cycle.cycleLength ?? 28,
        is_predicted: cycle.isPredicted ?? false,
    }));
    if (sanitized.length < 2) {
        throw new HttpError(400, 'At least two cycles with start dates are required.');
    }
    sanitized.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    const { data, error } = await supabase
        .from('cycles')
        .upsert(sanitized, { onConflict: 'user_id,start_date' })
        .select()
        .order('start_date', { ascending: false });
    if (error) {
        throw new HttpError(400, 'Failed to import cycles', error);
    }
    const mostRecent = sanitized[0];
    await supabase
        .from('profiles')
        .update({
        last_period_date: mostRecent.start_date,
        cycle_length: mostRecent.cycle_length,
        onboarding_completed: true,
    })
        .eq('user_id', userId);
    const { data: profile } = await supabase
        .from('profiles')
        .select('period_length')
        .eq('user_id', userId)
        .single();
    const periodLength = profile?.period_length ?? 5;
    return (data ?? []).map(row => mapCycleRow(row, periodLength));
};
export const getCurrentCycle = async (userId) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error) {
        throw new HttpError(400, 'Failed to fetch cycle', error);
    }
    if (!data) {
        return null;
    }
    const { data: profile } = await supabase
        .from('profiles')
        .select('period_length')
        .eq('user_id', userId)
        .single();
    return mapCycleRow(data, profile?.period_length);
};
export const getCycleById = async (userId, cycleId) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', userId)
        .eq('id', cycleId)
        .maybeSingle();
    if (error) {
        throw new HttpError(400, 'Failed to fetch cycle', error);
    }
    if (!data) {
        return null;
    }
    const { data: profile } = await supabase
        .from('profiles')
        .select('period_length')
        .eq('user_id', userId)
        .single();
    return mapCycleRow(data, profile?.period_length);
};
export const logSymptom = async (userId, cycleId, input) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('symptoms')
        .upsert({
        user_id: userId,
        cycle_id: cycleId,
        date: input.date,
        pain: input.pain,
        mood: input.mood,
        energy: input.energy,
        sleep_hours: input.sleepHours,
        cravings: input.cravings,
        bloating: input.bloating,
        intercourse: input.intercourse,
        protection_used: input.protection,
        flow: input.flow,
        other_symptoms: input.otherSymptoms,
    }, {
        onConflict: 'user_id,date',
    })
        .select()
        .single();
    if (error || !data) {
        throw new HttpError(400, 'Failed to log symptoms', error);
    }
    return data;
};
export const getSymptomHistory = async (userId, days = 60) => {
    const supabase = getSupabaseClient();
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data, error } = await supabase
        .from('symptoms')
        .select('*')
        .eq('user_id', userId)
        .gte('date', since.toISOString().split('T')[0])
        .order('date', { ascending: false });
    if (error) {
        throw new HttpError(400, 'Failed to fetch symptoms history', error);
    }
    return data ?? [];
};
export const getLatestSymptomEntry = async (userId) => {
    const history = await getSymptomHistory(userId, 7);
    return history.length > 0 ? history[0] : null;
};
export const getCyclesHistory = async (userId) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });
    if (error) {
        throw new HttpError(400, 'Failed to fetch cycles history', error);
    }
    const { data: profile } = await supabase
        .from('profiles')
        .select('period_length')
        .eq('user_id', userId)
        .single();
    const periodLength = profile?.period_length ?? 5;
    return (data ?? []).map(row => mapCycleRow(row, periodLength));
};
export const updateCycle = async (userId, cycleId, input) => {
    const supabase = getSupabaseClient();
    const updates = {};
    if (input.startDate)
        updates.start_date = input.startDate;
    if (input.endDate !== undefined)
        updates.end_date = input.endDate; // Correctly handle null/undefined
    if (input.cycleLength)
        updates.cycle_length = input.cycleLength;
    const { data, error } = await supabase
        .from('cycles')
        .update(updates)
        .eq('id', cycleId)
        .eq('user_id', userId)
        .select()
        .single();
    if (error || !data) {
        throw new HttpError(400, 'Failed to update cycle', error);
    }
    const { data: profile } = await supabase
        .from('profiles')
        .select('period_length')
        .eq('user_id', userId)
        .single();
    return mapCycleRow(data, profile?.period_length);
};
export const deleteCycle = async (userId, cycleId) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
        .from('cycles')
        .delete()
        .eq('id', cycleId)
        .eq('user_id', userId);
    if (error) {
        throw new HttpError(400, 'Failed to delete cycle', error);
    }
};
//# sourceMappingURL=cycle.service.js.map