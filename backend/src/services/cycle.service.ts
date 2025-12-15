import { getSupabaseClient } from '../lib/supabase';
import { HttpError } from '../utils/http-error';
import { getCycleContext, CycleContext } from '../utils/cycle';

export interface CreateCycleInput {
  startDate: string;
  endDate?: string;
  cycleLength?: number;
  isPredicted?: boolean;
}

export interface SymptomLogInput {
  date: string;
  pain: number;
  mood: 'LOW' | 'NEUTRAL' | 'HIGH';
  energy: 'LOW' | 'MEDIUM' | 'HIGH';
  sleepHours?: number;
  cravings?: string;
  bloating?: boolean;
}

export interface CycleSummary {
  id: string;
  startDate: string;
  endDate?: string | null;
  cycleLength: number;
  isPredicted: boolean;
  context: CycleContext;
}

export interface SymptomEntry {
  id: string;
  date: string;
  pain: number | null;
  mood: string | null;
  energy: string | null;
  sleep_hours: number | null;
  cravings: string | null;
  bloating: boolean | null;
}

const mapCycleRow = (row: any): CycleSummary => {
  const cycleLength = row.cycle_length ?? 28;
  return {
    id: row.id,
    startDate: row.start_date,
    endDate: row.end_date,
    cycleLength,
    isPredicted: row.is_predicted,
    context: getCycleContext(row.start_date, cycleLength),
  };
};

export const createCycle = async (userId: string, input: CreateCycleInput) => {
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

  return mapCycleRow(data);
};

export const getCurrentCycle = async (userId: string): Promise<CycleSummary | null> => {
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

  return mapCycleRow(data);
};

export const getCycleById = async (userId: string, cycleId: string): Promise<CycleSummary | null> => {
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

  return mapCycleRow(data);
};

export const logSymptom = async (userId: string, cycleId: string, input: SymptomLogInput) => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('symptoms')
    .upsert(
      {
        user_id: userId,
        cycle_id: cycleId,
        date: input.date,
        pain: input.pain,
        mood: input.mood,
        energy: input.energy,
        sleep_hours: input.sleepHours,
        cravings: input.cravings,
        bloating: input.bloating,
      },
      {
        onConflict: 'user_id,date',
      },
    )
    .select()
    .single();

  if (error || !data) {
    throw new HttpError(400, 'Failed to log symptoms', error);
  }

  return data;
};

export const getSymptomHistory = async (
  userId: string,
  days = 60,
): Promise<SymptomEntry[]> => {
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

  return (data as SymptomEntry[]) ?? [];
};

export const getLatestSymptomEntry = async (userId: string): Promise<SymptomEntry | null> => {
  const history = await getSymptomHistory(userId, 7);
  return history.length > 0 ? history[0] : null;
};
