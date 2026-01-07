import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  message: string;
  context_type: string;
  created_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
}

interface SendMessageResponse {
  message: string;
  disclaimer: string;
}

interface ChatHistoryResponse {
  history: ChatMessage[];
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (message: string) => {
      const response = await apiClient.post<SendMessageResponse>('/chatbot/message', { message });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate chat history to refetch with new messages
      queryClient.invalidateQueries({ queryKey: ['chatHistory'] });
    },
  });
};

export const useChatHistory = () => {
  return useQuery({
    queryKey: ['chatHistory'],
    queryFn: async () => {
      const response = await apiClient.get<ChatHistoryResponse>('/chatbot/history');
      return response.data.history;
    },
  });
};

export const useClearHistory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/chatbot/clear');
      return response.data;
    },
    onSuccess: () => {
      // Invalidate chat history to show empty state
      queryClient.invalidateQueries({ queryKey: ['chatHistory'] });
    },
  });
};
