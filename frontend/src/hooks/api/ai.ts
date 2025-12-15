import { useMutation } from '@tanstack/react-query';
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
  guidance: string;
  disclaimer: string;
}

interface JournalSummaryResponse {
  summary: string;
  disclaimer: string;
}

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
