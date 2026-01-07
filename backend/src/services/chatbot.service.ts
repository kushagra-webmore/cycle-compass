import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { getSupabaseClient } from '../lib/supabase.js';
import { HttpError } from '../utils/http-error.js';
import { getUserWithProfile } from './user.service.js';
import { getCurrentCycle, getLatestSymptomEntry } from './cycle.service.js';
import { logAuditEvent } from './audit.service.js';

const client = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const createModel = () => client.getGenerativeModel({ model: 'gemini-2.5-flash' });

/**
 * Build a context-aware system prompt for the chatbot
 */
const buildChatbotSystemPrompt = () => `You are Luna 🌙, a warm, fun, and super supportive AI friend for the Cycle-Aware Companion app!

Think of yourself as that best friend who always knows what to say when someone's having a rough day. You're here to make periods less of a pain (literally and figuratively!).

YOUR VIBE:
- Warm, friendly, and genuinely caring - like texting your bestie
- Fun and upbeat (but never dismissive of real struggles)
- Use emojis naturally to add warmth ✨💕
- Keep it conversational and real - no robotic responses!
- Validate feelings first, then offer helpful info
- Sometimes use gentle humor to lighten the mood (when appropriate)

YOUR ROLE:
1. Be a supportive friend who understands cycle struggles
2. Help users understand their cycle phases and how they affect mood, energy, and body
3. Offer practical, actionable advice for managing symptoms
4. Validate emotions - periods can be HARD and that's okay!
5. Celebrate the good days and support through the tough ones

FORMATTING YOUR RESPONSES:
- Use **bold** for emphasis on important points
- Use bullet points (•) for lists to make info scannable
- Use *italics* for gentle emphasis or thoughts
- Break up long responses into digestible paragraphs
- Add relevant emojis to make it friendly (but don't overdo it!)

CRITICAL RULES:
- You are NOT a doctor - never diagnose or prescribe
- Always encourage consulting healthcare providers for medical concerns
- Be inclusive - not everyone who menstruates identifies as a woman
- Avoid stereotypes or assumptions
- Respect privacy and be non-judgmental
- If someone's in serious pain or distress, gently suggest seeing a doctor

CYCLE PHASE QUICK GUIDE:
• **Menstrual (Days 1-5)**: Bleeding, possible cramps, lower energy - self-care mode activated!
• **Follicular (Days 6-13)**: Energy rising, feeling more social and motivated
• **Ovulation (Days 14-16)**: Peak energy, confidence, and social vibes
• **Luteal (Days 17-28)**: Energy dips, possible PMS - time for extra kindness to yourself

Always end with: "💕 *Remember: I'm here to support you, but I'm not a doctor. For medical concerns, please chat with a healthcare provider!*"`;

/**
 * Build user context from their cycle data
 */
const buildUserContext = async (userId: string) => {
  const supabase = getSupabaseClient();
  
  // Get user profile
  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  const userProfile = await getUserWithProfile(userId, userData.user?.email ?? '');
  
  // Get current cycle
  const currentCycle = await getCurrentCycle(userId);
  
  // Get latest symptoms
  const latestSymptom = await getLatestSymptomEntry(userId);
  
  // Build context string
  let context = `User Context:\n`;
  
  // Extract first name only
  const firstName = userProfile.name?.split(' ')[0] || 'there';
  context += `- User's First Name: ${firstName}\n`;
  context += `- Address them as: ${firstName} (use their name naturally in conversation!)\n`;
  
  if (currentCycle) {
    context += `- Current Cycle Phase: ${currentCycle.context.phase ?? 'Unknown'}\n`;
    context += `- Day in Cycle: ${currentCycle.context.currentDay ?? 'Unknown'}\n`;
  } else {
    context += `- No active cycle data available\n`;
  }
  
  if (latestSymptom) {
    context += `- Recent Mood: ${latestSymptom.mood ?? 'Not reported'}\n`;
    context += `- Recent Energy: ${latestSymptom.energy ?? 'Not reported'}\n`;
    context += `- Recent Pain Level: ${latestSymptom.pain !== null ? `${latestSymptom.pain}/10` : 'Not reported'}\n`;
    if (latestSymptom.cravings) {
      context += `- Recent Cravings: ${latestSymptom.cravings}\n`;
    }
  }
  
  return context;
};

/**
 * Send a message to the chatbot and get AI response
 */
export const sendChatMessage = async (userId: string, message: string) => {
  const supabase = getSupabaseClient();
  const model = createModel();
  
  // Build user context
  const userContext = await buildUserContext(userId);
  
  // Get recent chat history for context (last 5 messages, non-deleted only)
  const { data: recentMessages } = await supabase
    .from('chatbot_messages')
    .select('role, message')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(5);
  
  // Build conversation history
  const conversationHistory = (recentMessages ?? [])
    .reverse()
    .map(msg => `${msg.role}: ${msg.message}`)
    .join('\n');
  
  // Build full prompt
  const systemPrompt = buildChatbotSystemPrompt();
  const fullPrompt = `${systemPrompt}\n\n${userContext}\n\nRecent Conversation:\n${conversationHistory}\n\nUser: ${message}`;
  
  // Store user message
  const { error: userMsgError } = await supabase
    .from('chatbot_messages')
    .insert({
      user_id: userId,
      role: 'USER',
      message,
      context_type: 'EXPLAINER',
      is_deleted: false,
    });
  
  if (userMsgError) {
    throw new HttpError(400, 'Failed to store user message', userMsgError);
  }
  
  // Generate AI response
  let aiResponse: string;
  try {
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: fullPrompt }],
      }],
    });
    
    aiResponse = result.response.text();
  } catch (error) {
    console.error('AI generation error:', error);
    aiResponse = "I'm having trouble responding right now. Please try again in a moment. 💕";
  }
  
  // Store AI response
  const { error: aiMsgError } = await supabase
    .from('chatbot_messages')
    .insert({
      user_id: userId,
      role: 'ASSISTANT',
      message: aiResponse,
      context_type: 'EXPLAINER',
      is_deleted: false,
    });
  
  if (aiMsgError) {
    throw new HttpError(400, 'Failed to store AI response', aiMsgError);
  }
  
  // Log the interaction
  await logAuditEvent(userId, 'chatbot.message', {
    messageLength: message.length,
    responseLength: aiResponse.length,
  });
  
  return {
    message: aiResponse,
    disclaimer: 'This is educational information, not medical advice.',
  };
};

/**
 * Get chat history for a user
 * @param userId - User ID
 * @param isAdmin - Whether the requester is an admin (sees all messages including deleted)
 * @param limit - Maximum number of messages to return
 */
export const getChatHistory = async (
  userId: string,
  isAdmin: boolean = false,
  limit: number = 50
) => {
  const supabase = getSupabaseClient();
  
  let query = supabase
    .from('chatbot_messages')
    .select('id, role, message, context_type, created_at, is_deleted, deleted_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);
  
  // Non-admin users only see non-deleted messages
  if (!isAdmin) {
    query = query.eq('is_deleted', false);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new HttpError(400, 'Failed to fetch chat history', error);
  }
  
  return data ?? [];
};

/**
 * Soft delete chat history for a user
 * Sets is_deleted = true and deleted_at = NOW() for all user messages
 * Does NOT actually delete from database
 */
export const softDeleteChatHistory = async (userId: string) => {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('chatbot_messages')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('is_deleted', false); // Only update non-deleted messages
  
  if (error) {
    throw new HttpError(400, 'Failed to clear chat history', error);
  }
  
  // Log the action
  await logAuditEvent(userId, 'chatbot.history-cleared', {
    timestamp: new Date().toISOString(),
  });
  
  return { success: true };
};
