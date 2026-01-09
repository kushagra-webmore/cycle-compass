import { getSupabaseClient } from '../lib/supabase.js';
export const logAuditEvent = async (actorUserId, action, metadata) => {
    const supabase = getSupabaseClient();
    await supabase.from('audit_logs').insert({
        actor_user_id: actorUserId,
        action,
        metadata,
    });
};
export const logAIInteraction = async (userId, contextType, promptContext, response) => {
    const supabase = getSupabaseClient();
    await supabase.from('ai_interactions').insert({
        user_id: userId,
        context_type: contextType,
        input_context: promptContext,
        llm_response: response,
    });
};
//# sourceMappingURL=audit.service.js.map