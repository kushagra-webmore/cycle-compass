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

interface UpdateCyclePayload {
  id: string;
  startDate?: string;
  endDate?: string;
}

interface BulkCyclePayload {
  cycles: CreateCyclePayload[];
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
  intercourse?: boolean;
  protection?: boolean;
  flow?: string;
  otherSymptoms?: string[];
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
  intercourse: boolean | null;
  protection_used: boolean | null;
  flow: string | null;
  other_symptoms: string[] | null;
}

const cycleKeys = {
  current: ['cycle', 'current'] as const,
  list: ['cycles', 'list'] as const,
  history: (days: number) => ['symptoms', 'history', days] as const,
};

export const useCycles = () =>
  useQuery({
    queryKey: cycleKeys.list,
    queryFn: () => apiFetch<CycleSummary[]>('/cycles/history', { auth: true }),
  });

export const useCurrentCycle = () => {
  return useQuery({
    queryKey: cycleKeys.current,
    queryFn: () => {
      // Get client's current date to send to server for timezone-aware calculations
      const clientDate = new Date().toISOString();
      return apiFetch<CycleSummary | null>(`/cycles/current?date=${encodeURIComponent(clientDate)}`, { auth: true });
    },
  });
};

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
      queryClient.invalidateQueries({ queryKey: cycleKeys.list });
      queryClient.invalidateQueries({ queryKey: cycleKeys.history(30) });
    },
  });
};

export const useUpdateCycle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCyclePayload) =>
      apiFetch<CycleSummary>(`/cycles/${id}`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.current });
      queryClient.invalidateQueries({ queryKey: cycleKeys.list });
      queryClient.invalidateQueries({ queryKey: cycleKeys.history(30) });
    },
  });
};

export const useDeleteCycle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: true }>(`/cycles/${id}`, {
        method: 'DELETE',
        auth: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.current });
      queryClient.invalidateQueries({ queryKey: cycleKeys.list });
      queryClient.invalidateQueries({ queryKey: cycleKeys.history(30) });
    },
  });
};

export const useBulkCreateCycles = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkCyclePayload) =>
      apiFetch<{ cycles: CycleSummary[] }>('/cycles/bulk', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cycleKeys.current });
      queryClient.invalidateQueries({ queryKey: cycleKeys.list });
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
