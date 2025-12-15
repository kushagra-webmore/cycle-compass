import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

interface CycleContext {
  currentDay: number;
  cycleLength: number;
  phase: string;
  daysUntilNextPhase: number;
}

export interface CycleSummary {
  id: string;
  startDate: string;
  endDate?: string | null;
  cycleLength: number;
  isPredicted: boolean;
  context: CycleContext;
}

interface CreateCyclePayload {
  startDate: string;
  endDate?: string;
  cycleLength?: number;
  isPredicted?: boolean;
}

interface SymptomLogPayload {
  cycleId?: string;
  date: string;
  pain: number;
  mood: 'LOW' | 'NEUTRAL' | 'HIGH';
  energy: 'LOW' | 'MEDIUM' | 'HIGH';
  sleepHours?: number;
  cravings?: string;
  bloating?: boolean;
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

const cycleKeys = {
  current: ['cycle', 'current'] as const,
  history: (days: number) => ['symptoms', 'history', days] as const,
};

export const useCurrentCycle = () =>
  useQuery({
    queryKey: cycleKeys.current,
    queryFn: () => apiFetch<CycleSummary | null>('/cycles/current', { auth: true }),
  });

export const useCreateCycle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCyclePayload) =>
      apiFetch<CycleSummary>('/cycles', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.current });
      queryClient.invalidateQueries({ queryKey: cycleKeys.history(30) });
    },
  });
};

export const useSymptomHistory = (days = 30) =>
  useQuery({
    queryKey: cycleKeys.history(days),
    queryFn: () =>
      apiFetch<SymptomEntry[]>(`/symptoms/history?days=${days}`, {
        auth: true,
      }),
  });

export const useLogSymptom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SymptomLogPayload) =>
      apiFetch('/symptoms/log', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.history(30) });
    },
  });
};
