import { getSupabaseClient } from '../lib/supabase.js';
import { HttpError } from '../utils/http-error.js';
import { getCurrentCycle, getSymptomHistory } from './cycle.service.js';
const moodWeights = {
    LOW: 0,
    NEUTRAL: 1,
    HIGH: 2,
};
const energyWeights = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
};
const averageMood = (entries) => {
    if (!entries.length)
        return null;
    const valid = entries.filter((e) => e.mood && moodWeights[e.mood] !== undefined);
    if (!valid.length)
        return null;
    const score = valid.reduce((sum, item) => sum + (moodWeights[item.mood] ?? 1), 0) / valid.length;
    if (score < 0.5)
        return 'Low';
    if (score < 1.5)
        return 'Neutral';
    return 'Upbeat';
};
const averageEnergy = (entries) => {
    if (!entries.length)
        return null;
    const valid = entries.filter((e) => e.energy && energyWeights[e.energy] !== undefined);
    if (!valid.length)
        return null;
    const score = valid.reduce((sum, item) => sum + (energyWeights[item.energy] ?? 1), 0) / valid.length;
    if (score < 0.5)
        return 'Low';
    if (score < 1.5)
        return 'Balanced';
    return 'High';
};
export const getPartnerSummary = async (partnerUserId) => {
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
    const consent = (consentData ?? {});
    const primaryUserId = pairing.primary_user_id;
    const cycle = consent.share_phase ? await getCurrentCycle(primaryUserId) : null;
    let moodSummary = null;
    let energySummary = null;
    if (consent.share_mood_summary || consent.share_energy_summary) {
        const recent = await getSymptomHistory(primaryUserId, 14);
        if (consent.share_mood_summary) {
            moodSummary = averageMood(recent);
        }
        if (consent.share_energy_summary) {
            energySummary = averageEnergy(recent);
        }
    }
    // Fetch detailed data if consented
    let sharedSymptoms = [];
    let sharedJournals = [];
    if (consent.share_symptoms) {
        sharedSymptoms = await getSymptomHistory(primaryUserId, 30); // Last 30 days
    }
    if (consent.share_journals) {
        const { listJournalEntries } = await import('./journal.service.js');
        sharedJournals = await listJournalEntries(primaryUserId, 5); // Last 5 entries
    }
    // Fetch cycle history if consented
    let sharedCycles = [];
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
//# sourceMappingURL=partner.service.js.map