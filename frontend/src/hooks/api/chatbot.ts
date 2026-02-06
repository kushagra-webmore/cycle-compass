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
  session_id?: string;
}

interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

interface SendMessageResponse {
  message: string;
  disclaimer: string;
  sessionId: string;
}

interface ChatHistoryResponse {
  history: ChatMessage[];
}

interface ChatSessionsResponse {
  sessions: ChatSession[];
}

export const useChatSessions = () => {
  return useQuery({
    queryKey: ['chatSessions'],
    queryFn: async () => {
      const response = await apiClient.get<ChatSessionsResponse>('/chatbot/sessions');
      return response.data.sessions;
    },
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<ChatSession>('/chatbot/sessions');
      return response.data;
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      // We might want to return this to the caller to switch context immediately
    },
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      await apiClient.delete(`/chatbot/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
  });
};

export const useSendMessage = (sessionId?: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (message: string) => {
      const response = await apiClient.post<SendMessageResponse>('/chatbot/message', { 
        message,
        sessionId 
      });
      return response.data;
    },
    onMutate: async (newMessage) => {
      // Optimistic update
      const queryKey = ['chatHistory', sessionId];
      
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousHistory = queryClient.getQueryData<ChatMessage[]>(queryKey);

      // Optimistically update to the new value
      const optimisticMessage: ChatMessage = {
        id: 'temp-id-' + Date.now(),
        role: 'USER',
        message: newMessage,
        context_type: 'OPTIMISTIC',
        created_at: new Date().toISOString(),
        is_deleted: false,
        deleted_at: null,
        session_id: sessionId,
      };
      
      queryClient.setQueryData<ChatMessage[]>(queryKey, (old) => [...(old || []), optimisticMessage]);

      return { previousHistory };
    },
    onError: (err, newMessage, context) => {
      if (context?.previousHistory) {
         const queryKey = ['chatHistory', sessionId];
         queryClient.setQueryData(queryKey, context.previousHistory);
      }
    },
    onSuccess: (data) => {
      // Invalidate chat history to refetch real messages (including AI response)
      // Ideally we would merge the response here too to avoid flicker, but refetch is safer for now.
      // Also need to invalidate sessions because the session title might have changed (if new chat)
      // or updated_at changed.
      queryClient.invalidateQueries({ queryKey: ['chatHistory', sessionId ?? data.sessionId] });
      
      // If we just promoted a new chat (undefined sessionId) to a real session,
      // we MUST clear the 'undefined' history so the next "New Chat" is empty.
      if (!sessionId) {
        queryClient.removeQueries({ queryKey: ['chatHistory', undefined] });
      }

      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
  });
};

export const useChatHistory = (sessionId?: string) => {
  return useQuery({
    queryKey: ['chatHistory', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const response = await apiClient.get<ChatHistoryResponse>(`/chatbot/history?sessionId=${sessionId}`);
      return response.data.history;
    },
    enabled: !!sessionId, // Only fetch if we have a session ID
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
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
  });
};
