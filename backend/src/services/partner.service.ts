import { getSupabaseClient } from '../lib/supabase.js';
import { HttpError } from '../utils/http-error.js';
import { getCurrentCycle, getSymptomHistory } from './cycle.service.js';

interface ConsentSettings {
  share_phase: boolean;
  share_mood_summary: boolean;
  share_energy_summary: boolean;
  share_symptoms: boolean;
  share_journals: boolean;
  share_my_cycle: boolean;
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
  const valid = entries.filter((e) => e.mood && moodWeights[e.mood] !== undefined);
  if (!valid.length) return null;
  const score = valid.reduce((sum, item) => sum + (moodWeights[item.mood!] ?? 1), 0) / valid.length;
  if (score < 0.5) return 'Low';
  if (score < 1.5) return 'Neutral';
  return 'Upbeat';
};

const averageEnergy = (entries: Array<{ energy: string | null }>) => {
  if (!entries.length) return null;
  const valid = entries.filter((e) => e.energy && energyWeights[e.energy] !== undefined);
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

  const rawConsent = pairing.consent_settings;
  // Handle array or single object return from Supabase join
  const consentData = Array.isArray(rawConsent) ? rawConsent[0] : rawConsent;
  const consent = (consentData ?? {}) as ConsentSettings;
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

  // Fetch detailed data if consented
  let sharedSymptoms: any[] = [];
  let sharedJournals: any[] = [];

  if (consent.share_symptoms) {
    sharedSymptoms = await getSymptomHistory(primaryUserId, 30); // Last 30 days
  }

  if (consent.share_journals) {
    const { listJournalEntries } = await import('./journal.service.js');
    sharedJournals = await listJournalEntries(primaryUserId, 5); // Last 5 entries
  }

  // Fetch cycle history if consented
  let sharedCycles: any[] = [];
  if (consent.share_my_cycle) {
    const { getCyclesHistory } = await import('./cycle.service.js');
    sharedCycles = await getCyclesHistory(primaryUserId);
  }

  // Fetch primary user name
  const { data: primaryProfile } = await supabase
    .from('profiles')
    .select('name')
    .eq('user_id', primaryUserId)
    .single();

  return {
    pairingId: pairing.id,
    primaryUserId,
    primaryUserName: primaryProfile?.name,
    consent,
    cycle,
    summaries: {
      moodSummary: consent.share_mood_summary ? moodSummary : null,
      energySummary: consent.share_energy_summary ? energySummary : null,
    },
    sharedData: {
      symptoms: sharedSymptoms,
      journals: sharedJournals,
      cycles: sharedCycles,
    }
  };
};
