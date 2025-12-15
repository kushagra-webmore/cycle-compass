import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface AdminUser {
  id: string;
  role: 'PRIMARY' | 'PARTNER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  created_at: string;
  profiles?: {
    name?: string | null;
    timezone?: string | null;
    onboarding_completed?: boolean | null;
  } | null;
}

export interface AdminPairing {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'REVOKED';
  created_at: string;
  primary_user_id: string;
  partner_user_id: string | null;
  consent_settings: Record<string, unknown> | null;
}

export interface ConsentLog {
  id: string;
  action: string;
  actor_user_id: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface AIInteraction {
  id: string;
  user_id: string;
  type: string;
  prompt: string;
  response: string;
  created_at: string;
}

export interface AnalyticsOverview {
  snapshot_date: string;
  total_users: number;
  active_pairings: number;
  ai_interactions_count: number;
}

export interface MythArticle {
  id: string;
  title: string;
  content: string;
  tags?: string[] | null;
  is_published: boolean;
  created_at: string;
}

interface UpdateUserPayload {
  userId: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  role?: 'PRIMARY' | 'PARTNER' | 'ADMIN';
}

const adminKeys = {
  users: ['admin', 'users'] as const,
  pairings: ['admin', 'pairings'] as const,
  consentLogs: ['admin', 'consentLogs'] as const,
  analytics: ['admin', 'analytics'] as const,
  aiInteractions: ['admin', 'aiInteractions'] as const,
  myths: ['admin', 'myths'] as const,
};

export const useAdminUsers = () =>
  useQuery({
    queryKey: adminKeys.users,
    queryFn: () => apiFetch<AdminUser[]>('/admin/users', { auth: true }),
  });

export const useUpdateAdminUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateUserPayload) =>
      apiFetch('/admin/users/update', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users });
    },
  });
};

export const useAdminPairings = () =>
  useQuery({
    queryKey: adminKeys.pairings,
    queryFn: () => apiFetch<AdminPairing[]>('/admin/pairings', { auth: true }),
  });

export const useForceUnpair = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pairingId: string) =>
      apiFetch('/admin/pairings/force-unpair', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ pairingId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.pairings });
    },
  });
};

export const useConsentLogs = () =>
  useQuery({
    queryKey: adminKeys.consentLogs,
    queryFn: () => apiFetch<ConsentLog[]>('/admin/consent/logs', { auth: true }),
  });

export const useAnalyticsOverview = () =>
  useQuery({
    queryKey: adminKeys.analytics,
    queryFn: () => apiFetch<AnalyticsOverview>('/admin/analytics/overview', { auth: true }),
  });

export const useAIInteractions = () =>
  useQuery({
    queryKey: adminKeys.aiInteractions,
    queryFn: () => apiFetch<AIInteraction[]>('/admin/ai/interactions', { auth: true }),
  });

export const useMythArticles = () =>
  useQuery({
    queryKey: adminKeys.myths,
    queryFn: () => apiFetch<MythArticle[]>('/admin/myths', { auth: true }),
  });

interface UpsertMythPayload {
  id?: string;
  title: string;
  content: string;
  tags?: string[];
  isPublished?: boolean;
}

export const useUpsertMythArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertMythPayload) =>
      apiFetch<MythArticle>('/admin/myths/upsert', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.myths });
    },
  });
};

export const useDeleteMythArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/myths/${id}`, {
        method: 'DELETE',
        auth: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.myths });
    },
  });
};
