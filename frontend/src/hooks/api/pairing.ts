import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface ConsentSettings {
  share_phase: boolean;
  share_mood_summary: boolean;
  share_energy_summary: boolean;
  share_symptoms: boolean;
  share_journals: boolean;
}

export interface PairingInfo {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'REVOKED';
  role: 'PRIMARY' | 'PARTNER' | 'ADMIN';
  isPrimary: boolean;
  primary_user_id: string;
  partner_user_id: string | null;
  partnerUserId: string | null; // Keeping for potential compatibility, but snake_case is what API returns
  partnerUserName?: string;
  partnerUserEmail?: string;
  primaryUserName?: string;
  primaryUserEmail?: string;
  consent: ConsentSettings | null;
  inviteLink?: string;
  pairCode?: string;
  qrData?: string;
  expiresAt?: string;
}

interface CreatePairingPayload {
  method: 'LINK' | 'QR' | 'CODE';
}

interface AcceptPairingPayload {
  token?: string;
  pairCode?: string;
}

interface UpdateConsentPayload {
  pairingId: string;
  sharePhase?: boolean;
  shareMoodSummary?: boolean;
  shareEnergySummary?: boolean;
  shareSymptoms?: boolean;
  shareJournals?: boolean;
}

const pairingKeys = {
  me: ['pairing', 'me'] as const,
};

export const usePairing = () =>
  useQuery({
    queryKey: pairingKeys.me,
    queryFn: () => apiFetch<PairingInfo | null>('/pairings/me', { auth: true }),
  });

export const useCreatePairing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePairingPayload) =>
      apiFetch<PairingInfo>('/pairings/create', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pairingKeys.me });
    },
  });
};

export const useAcceptPairing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AcceptPairingPayload) =>
      apiFetch('/pairings/accept', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pairingKeys.me });
    },
  });
};

export const useRevokePairing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pairingId: string) =>
      apiFetch('/pairings/revoke', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ pairingId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pairingKeys.me });
    },
  });
};

export const useUpdateConsent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateConsentPayload) =>
      apiFetch<ConsentSettings>('/pairings/consent/update', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pairingKeys.me });
    },
  });
};
