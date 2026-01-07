import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

interface PartnerSummaries {
  moodSummary: string | null;
  energySummary: string | null;
}

export interface PartnerSummaryResponse {
  pairingId: string;
  primaryUserId: string;
  partnerUserName?: string;
  primaryUserName?: string;
  consent: {
    share_phase: boolean;
    share_mood_summary: boolean;
    share_energy_summary: boolean;
    share_symptoms: boolean;
    share_journals: boolean;
  };
  cycle: {
    id: string;
    startDate: string;
    cycleLength: number;
    isPredicted: boolean;
    context: {
      phase: string;
      currentDay: number;
      cycleLength: number;
      daysUntilNextPhase: number;
    };
  } | null;
  summaries: PartnerSummaries;
  sharedData?: {
    symptoms: any[];
    journals: any[];
  };
}

const partnerKeys = {
  summary: ['partner', 'summary'] as const,
};

export const usePartnerSummary = () =>
  useQuery({
    queryKey: partnerKeys.summary,
    queryFn: () => apiFetch<PartnerSummaryResponse | null>('/partner/summary', { auth: true }),
  });
