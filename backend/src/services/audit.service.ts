import { getSupabaseClient } from '../lib/supabase.js';

export type AuditAction =
  | 'pairing.create'
  | 'pairing.accept'
  | 'pairing.revoke'
  | 'consent.update'
  | 'consent.create'
  | 'consent.revoke'
  | 'admin.user-update'
  | 'admin.user-delete'
  | 'admin.force-unpair'
  | 'admin.impersonate-user'
  | 'ai.explain'
  | 'ai.partner-guidance'
  | 'ai.journal-summary'
  | 'chatbot.message'
  | 'chatbot.history-cleared';

export const logAuditEvent = async (actorUserId: string | null, action: AuditAction, metadata?: Record<string, unknown>) => {
  const supabase = getSupabaseClient();
  await supabase.from('audit_logs').insert({
    actor_user_id: actorUserId,
    action,
    metadata,
  });
};

export const logAIInteraction = async (
  userId: string,
  contextType: 'EXPLAINER' | 'GUIDANCE' | 'JOURNAL' | 'DAILY_INSIGHTS',
  promptContext: Record<string, unknown>,
  response: string,
) => {
  const supabase = getSupabaseClient();
  await supabase.from('ai_interactions').insert({
    user_id: userId,
    context_type: contextType,
    input_context: promptContext,
    llm_response: response,
  });
};
