import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  encrypted_text: string;
  ai_summary?: string | null;
  created_at: string;
}

const journalKeys = {
  list: ['journals', 'list'] as const,
};

export const useJournalEntries = (limit = 30) =>
  useQuery({
    queryKey: journalKeys.list,
    queryFn: () => apiFetch<JournalEntry[]>(`/journals/list?limit=${limit}`, { auth: true }),
  });

interface CreateJournalPayload {
  date: string;
  encryptedText: string;
  aiSummary?: string;
}

export const useCreateJournal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateJournalPayload) =>
      apiFetch<JournalEntry>('/journals/create', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.list });
    },
  });
};
