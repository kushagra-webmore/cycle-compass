import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

interface CycleExplainPayload {
  cycleId?: string;
  symptoms?: string[];
  mood?: string;
  energy?: string;
  history?: string;
}

interface CycleExplainResponse {
  explainer: string;
  disclaimer: string;
}

interface PartnerGuidanceResponse {
  guidance: {
    explanation: string;
    actions: string[];
    foodRecommendation: string;
    activityRecommendation: string;
  };
  disclaimer: string;
}

interface JournalSummaryResponse {
  summary: string;
  disclaimer: string;
}

interface DailyInsightsResponse {
  insights: {
    food: string;
    activity: string;
    wisdom: string;
  };
  disclaimer: string;
}


  
// Actually, to avoid complexity, I will use `useQuery`.
export const useDailyInsights = () => 
  useQuery({
    queryKey: ['daily-insights'],
    queryFn: () => apiFetch<DailyInsightsResponse>('/ai/daily-insights', { method: 'POST', auth: true }),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: false,
  });

export const useCycleExplainer = () =>
  useMutation({
    mutationFn: (payload: CycleExplainPayload) =>
      apiFetch<CycleExplainResponse>('/ai/explain', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload),
      }),
  });

export const usePartnerGuidance = () =>
  useMutation({
    mutationFn: () =>
      apiFetch<PartnerGuidanceResponse>('/ai/partner-guidance', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({}),
      }),
  });

export const useJournalSummary = () =>
  useMutation({
    mutationFn: (entries: string[]) =>
      apiFetch<JournalSummaryResponse>('/ai/journal-summary', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ entries }),
      }),
  });
