import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { getLocalDateString } from '@/lib/utils';

interface PartnerSummaries {
  moodSummary: string | null;
  energySummary: string | null;
}

export interface PartnerSummaryResponse {
  pairingId: string;
  primaryUserId: string;
  partnerUserName?: string;
  primaryUserName?: string;
  primaryUserAvatar?: string;
  consent: {
    share_phase: boolean;
    share_mood_summary: boolean;
    share_energy_summary: boolean;
    share_symptoms: boolean;
    share_journals: boolean;
    share_my_cycle: boolean;
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
    cycles: any[];
  };
}

const partnerKeys = {
  summary: ['partner', 'summary'] as const,
};

export const usePartnerSummary = () => {
  return useQuery({
    queryKey: partnerKeys.summary,
    queryFn: () => {
      // Get client's current date to send to server for timezone-aware calculations
      // Use getLocalDateString() to send YYYY-MM-DD local date
      const clientDate = getLocalDateString();
      console.log('[Partner Frontend] Fetching partner summary with client date:', clientDate);
      return apiFetch<PartnerSummaryResponse | null>(`/partner/summary?date=${encodeURIComponent(clientDate)}`, { auth: true });
    },
  });
};
