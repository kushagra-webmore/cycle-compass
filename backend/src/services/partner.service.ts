import { getSupabaseClient } from '../lib/supabase';
import { HttpError } from '../utils/http-error';
import { getCurrentCycle, getSymptomHistory } from './cycle.service';

interface ConsentSettings {
  share_phase: boolean;
  share_mood_summary: boolean;
  share_energy_summary: boolean;
  share_symptoms: boolean;
  share_journals: boolean;
}

const moodWeights: Record<string, number> = {
  LOW: 0,
  NEUTRAL: 1,
  HIGH: 2,
};

const energyWeights: Record<string, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
};

const averageMood = (entries: Array<{ mood: string | null }>) => {
  if (!entries.length) return null;
  const valid = entries.filter((e) => e.mood && moodWeights[e.mood]);
  if (!valid.length) return null;
  const score = valid.reduce((sum, item) => sum + (moodWeights[item.mood!] ?? 1), 0) / valid.length;
  if (score < 0.5) return 'Low';
  if (score < 1.5) return 'Neutral';
  return 'Upbeat';
};

const averageEnergy = (entries: Array<{ energy: string | null }>) => {
  if (!entries.length) return null;
  const valid = entries.filter((e) => e.energy && energyWeights[e.energy]);
  if (!valid.length) return null;
  const score = valid.reduce((sum, item) => sum + (energyWeights[item.energy!] ?? 1), 0) / valid.length;
  if (score < 0.5) return 'Low';
  if (score < 1.5) return 'Balanced';
  return 'High';
};

export const getPartnerSummary = async (partnerUserId: string) => {
  const supabase = getSupabaseClient();

  const { data: pairing, error } = await supabase
    .from('pairings')
    .select('id, primary_user_id, consent_settings(*)')
    .eq('partner_user_id', partnerUserId)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (error) {
    throw new HttpError(400, 'Failed to fetch pairing', error);
  }

  if (!pairing) {
    return null;
  }

  const consent = (pairing.consent_settings ?? {}) as ConsentSettings;
  const primaryUserId = pairing.primary_user_id;

  const cycle = consent.share_phase ? await getCurrentCycle(primaryUserId) : null;

  let moodSummary: string | null = null;
  let energySummary: string | null = null;

  if (consent.share_mood_summary || consent.share_energy_summary) {
    const recent = await getSymptomHistory(primaryUserId, 14);
    if (consent.share_mood_summary) {
      moodSummary = averageMood(recent as Array<{ mood: string | null }>);
    }
    if (consent.share_energy_summary) {
      energySummary = averageEnergy(recent as Array<{ energy: string | null }>);
    }
  }

  return {
    pairingId: pairing.id,
    primaryUserId,
    consent,
    cycle,
    summaries: {
      moodSummary: consent.share_mood_summary ? moodSummary : null,
      energySummary: consent.share_energy_summary ? energySummary : null,
    },
  };
};
