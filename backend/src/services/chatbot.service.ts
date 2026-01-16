import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { getSupabaseClient } from '../lib/supabase.js';
import { HttpError } from '../utils/http-error.js';
import { getUserWithProfile } from './user.service.js';
import { getCurrentCycle, getLatestSymptomEntry, getSymptomHistory } from './cycle.service.js';
import { logAuditEvent } from './audit.service.js';
import { getActivePairingsForUser } from './pairing.service.js';

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
6. **ANSWER QUESTIONS ABOUT HISTORY**: If the user asks "When did I last...", use the context provided to give a specific answer (e.g. "You logged log intimacy on Jan 14th").

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
- **FERTILITY TIMING EXCEPTION**: If the 'User Goal' in context is 'CONCEIVE' or is asking for fertility timing related questions, you MAY share the "Estimated Fertile Window" dates provided in the context. However, you MUST explicitly state that these are "estimates based on your cycle history" and recommend using ovulation tests or consulting a doctor for pinpoint accuracy. Do NOT guarantee pregnancy.

CYCLE PHASE QUICK GUIDE:
• **Menstrual (Days 1-5)**: Bleeding, possible cramps, lower energy - self-care mode activated!
• **Follicular (Days 6-13)**: Energy rising, feeling more social and motivated
• **Ovulation (Days 14-16)**: Peak energy, confidence, and social vibes
• **Luteal (Days 17-28)**: Energy dips, possible PMS - time for extra kindness to yourself

Always end with: "💕 *Remember: I'm here to support you, but I'm not a doctor. For medical concerns, please chat with a healthcare provider!*"`;

/**
 * Build a system prompt for PARTNER users
 */
const buildPartnerChatbotSystemPrompt = () => `You are Luna 🌙, a supportive guide helping partners understand their loved one's menstrual cycle.

Your goal is to help the user be a better, more understanding partner by explaining what their partner is going through and suggesting helpful ways to support them.

YOUR VIBE:
- Encouraging, insightful, and practical
- Empathetic to both the user and their partner
- Educational but accessible (no jargon)
- Use emojis naturally ✨🤝

YOUR ROLE:
1. Explain the partner's current cycle phase and its effects (mood, energy, physical).
2. Interpret symptoms or moods: "She might be feeling tired because of low hormones right now."
3. Suggest concrete, supportive actions: "Maybe cook dinner tonight," "Give her space," "Surprise her with chocolate."
4. Help navigate communication: "Try asking her how she feels instead of assuming."
5. Frame everything with empathy and love.

CRITICAL RULES:
- You are NOT a doctor.
- Respect the primary user's privacy (don't share sensitive medical details unless explicitly asked relevant to support).
- Focus on SUPPORT and UNDERSTANDING.

Always end with: "💕 *Remember: Communication is key! Ask her what she needs. I'm not a doctor, so for medical concerns, suggest seeing a professional.*"`;

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
  
  // Get latest symptoms AND history for lookback
  const latestSymptom = await getLatestSymptomEntry(userId);
  const historyFull = await getSymptomHistory(userId, 3650); // Look back ~10 years (effectively whole history)

  // Build context string
  let context = `User Context:\n`;
  
  // Extract first name only
  const firstName = userProfile.name?.split(' ')[0] || 'there';
  context += `- User's First Name: ${firstName}\n`;
  context += `- Address them as: ${firstName} (use their name naturally in conversation!)\n`;
  
  // Get User Goal
  context += `- User Goal: ${userProfile.goal || 'TRACKING'} (If 'CONCEIVE', prioritize fertility support)\n`;

  if (currentCycle) {
    context += `- Current Cycle Phase: ${currentCycle.context.phase ?? 'Unknown'}\n`;
    context += `- Day in Cycle: ${currentCycle.context.currentDay ?? 'Unknown'}\n`;

    // Inject Fertility Window if Goal is CONCEIVE
    if (userProfile.goal === 'CONCEIVE') {
       const startDate = new Date(currentCycle.startDate);
       const cycleLength = currentCycle.cycleLength || 28;
       
       // Calculate dates based on Anchor Method
       // Ovulation = CycleLength - 14
       const ovulationDayIndex = cycleLength - 14; 
       // Fertile Window = Ovulation - 5 to Ovulation + 1
       const fertileStartIndex = ovulationDayIndex - 5;
       const fertileEndIndex = ovulationDayIndex + 1;
       
       const fertileStart = new Date(startDate);
       fertileStart.setDate(startDate.getDate() + fertileStartIndex);
       
       const fertileEnd = new Date(startDate);
       fertileEnd.setDate(startDate.getDate() + fertileEndIndex);
       
       const ovulationDate = new Date(startDate);
       ovulationDate.setDate(startDate.getDate() + ovulationDayIndex);
       
       const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };

       context += `- **Estimated Fertile Window**: ${fertileStart.toLocaleDateString('en-US', options)} to ${fertileEnd.toLocaleDateString('en-US', options)}\n`;
       context += `- **Estimated Ovulation Date**: ${ovulationDate.toLocaleDateString('en-US', options)}\n`;
    }
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
    
    // Look back for last intercourse
    const lastIntercourse = historyFull.find(log => log.intercourse);
    if (lastIntercourse) {
       const d = new Date(lastIntercourse.date);
       const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
       context += `- Last Logged Intercourse: ${dateStr} ${lastIntercourse.protection_used ? '(Protected)' : '(Unprotected)'}\n`;
    } else {
       context += `- Last Logged Intercourse: None found in history.\n`;
    }
  }
  
  return context;
};

/**
 * Build context for a PARTNER user based on the Primary User's data
 */
const buildPartnerContext = async (partnerUserId: string) => {
  const supabase = getSupabaseClient();
  
  // Find the connected Primary User
  let pairing;
  try {
    const pairings = await getActivePairingsForUser(partnerUserId);
    // If multiple, maybe we should pick one? For now, pick the first one.
    // In a multi-partner scenario, the chatbot context is tricky if a partner has multiple primary users.
    // Ideally, the partner should specify WHICH primary user they are asking about.
    // For now, defaulting to the first one is the safest migration step.
    pairing = pairings[0];
  } catch (err) {
    return `User Context: User is a partner but has no active pairing.`;
  }

  if (!pairing) {
    return `User Context: User is a partner but has no active pairing.`;
  }

  // Determine Primary User ID
  // getActivePairingForUser returns { primary_user_id, partner_user_id }
  // Context: Who is the SUBJECT of the questions? The Primary User.
  // The Partner (caller) is asking about the Primary User.
  
  // Wait, getActivePairingForUser implementation:
  // It returns data. If caller is Partner, they are in partner_user_id. primary is in primary_user_id.
  const primaryUserId = pairing.primary_user_id;

  if (!primaryUserId) {
    return `User Context: No connected partner found.`;
  }

  // Get Primary User Profile & Cycle & History
  const { data: primaryAuth } = await supabase.auth.admin.getUserById(primaryUserId);
  const primaryProfile = await getUserWithProfile(primaryUserId, primaryAuth.user?.email ?? '');
  const currentCycle = await getCurrentCycle(primaryUserId);
  const latestSymptom = await getLatestSymptomEntry(primaryUserId);
  const historyFull = await getSymptomHistory(primaryUserId, 3650); 

  // Get Partner Profile (Caller) - to address them by name
  const { data: partnerAuth } = await supabase.auth.admin.getUserById(partnerUserId);
  const partnerProfile = await getUserWithProfile(partnerUserId, partnerAuth.user?.email ?? '');

  let context = `Context:\n`;
  const partnerName = partnerProfile.name?.split(' ')[0] || 'there';
  const primaryName = primaryProfile.name?.split(' ')[0] || 'Partner';

  context += `- User (Caller) Name: ${partnerName}. Address them as ${partnerName}.\n`;
  context += `- Partner (Subject) Name: ${primaryName}. The user is asking about ${primaryName}.\n`;

  if (currentCycle) {
    context += `- ${primaryName}'s Current Cycle Phase: ${currentCycle.context.phase ?? 'Unknown'}\n`;
    context += `- Day in Cycle: ${currentCycle.context.currentDay ?? 'Unknown'}\n`;
  } else {
    context += `- No active cycle data available for ${primaryName}\n`;
  }
  
  if (latestSymptom) {
    context += `- ${primaryName}'s Recent Mood: ${latestSymptom.mood ?? 'Not reported'}\n`;
    context += `- ${primaryName}'s Recent Energy: ${latestSymptom.energy ?? 'Not reported'}\n`;
    context += `- ${primaryName}'s Recent Pain Level: ${latestSymptom.pain !== null ? `${latestSymptom.pain}/10` : 'Not reported'}\n`;
    if (latestSymptom.cravings) {
      context += `- ${primaryName}'s Recent Cravings: ${latestSymptom.cravings}\n`;
    }
    
    // Look back for last intercourse (Partner View)
    const lastIntercourse = historyFull.find(log => log.intercourse);
    if (lastIntercourse) {
       const d = new Date(lastIntercourse.date);
       const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
       context += `- Last Logged Intercourse: ${dateStr} ${lastIntercourse.protection_used ? '(Protected)' : '(Unprotected)'}\n`;
    }
  }

  return context;
};

/**
 * Generate a title for the session using Gemini
 */
const generateSessionTitle = async (firstMessage: string) => {
  const model = createModel();
  // We use a lighter prompt or even a different model if available for speed/cost, but Flash is fine.
  const prompt = `Generate a very short title (3-5 words max) for a chat that starts with this message: "${firstMessage}". 
  Do not use quotes. Just the text. E.g. "Ovulation Symptoms", "Period Pain Relief", "Cycle Tracking Help".`;

  try {
    const result = await model.generateContent(prompt);
    const title = result.response.text().trim();
    // Fallback if empty or too long
    if (!title || title.length > 50) return 'New Conversation';
    return title.replace(/^["']|["']$/g, ''); // Remove quotes if any
  } catch (error) {
    console.error('Title generation failed:', error);
    return 'New Conversation';
  }
};

/**
 * Create a new chat session
 */
export const createSession = async (userId: string) => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('chatbot_sessions')
    .insert({
      user_id: userId,
      title: 'New Chat',
    })
    .select()
    .single();

  if (error) {
    throw new HttpError(400, 'Failed to create chat session', error);
  }

  return data;
};

/**
 * Get user sessions (active only for users, all for admins)
 */
export const getUserSessions = async (userId: string, isAdmin: boolean = false) => {
  const supabase = getSupabaseClient();
  
  let query = supabase
    .from('chatbot_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (!isAdmin) {
    query = query.eq('is_deleted', false);
  }

  const { data, error } = await query;
  
  if (error) {
    throw new HttpError(400, 'Failed to fetch sessions', error);
  }

  return data ?? [];
};

/**
 * Soft delete a session
 */
export const deleteSession = async (userId: string, sessionId: string) => {
  const supabase = getSupabaseClient();
  
  // Verify ownership
  const { error } = await supabase
    .from('chatbot_sessions')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) {
    throw new HttpError(400, 'Failed to delete session', error);
  }

  return { success: true };
};

/**
 * Send a message to the chatbot and get AI response
 */
export const sendChatMessage = async (userId: string, message: string, sessionId?: string) => {
  const supabase = getSupabaseClient();
  const model = createModel();

  // Ensure session exists or create one if not provided
  let activeSessionId = sessionId;
  if (!activeSessionId) {
    const newSession = await createSession(userId);
    activeSessionId = newSession.id;
  }

  // Determine if user is PARTNER or PRIMARY
  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  const userProfile = await getUserWithProfile(userId, userData.user?.email ?? '');
  const role = userProfile.role || 'PRIMARY'; 

  let systemPrompt: string;
  let userContext: string;
  let contextType = 'EXPLAINER';

  if (role === 'PARTNER') {
    systemPrompt = buildPartnerChatbotSystemPrompt();
    userContext = await buildPartnerContext(userId);
    contextType = 'GUIDANCE';
  } else {
    systemPrompt = buildChatbotSystemPrompt();
    userContext = await buildUserContext(userId);
  }
  
  // Get recent chat history for context (last 10 messages from THIS session)
  const { data: recentMessages } = await supabase
    .from('chatbot_messages')
    .select('role, message')
    .eq('user_id', userId)
    .eq('session_id', activeSessionId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(10);
  
  // Check if this is the first message (or close to it) to generate title
  // Only generate if title is "New Chat"
  const { data: sessionData } = await supabase
    .from('chatbot_sessions')
    .select('title')
    .eq('id', activeSessionId)
    .single();
    
  let needsTitle = false;
  if (sessionData && sessionData.title === 'New Chat') {
    needsTitle = true;
  }
  
  // Always update updated_at
  await supabase
    .from('chatbot_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', activeSessionId);

  // Build conversation history
  const conversationHistory = (recentMessages ?? [])
    .reverse()
    .map(msg => `${msg.role}: ${msg.message}`)
    .join('\n');
  
  // Build full prompt
  let fullPrompt = `${systemPrompt}\n\n${userContext}\n\nRecent Conversation:\n${conversationHistory}\n\nUser: ${message}`;
  
  if (needsTitle) {
    fullPrompt += `\n\nIMPORTANT INSTRUCTION: Since this is the first message of a new conversation, please also generate a short title (3-5 words) for this chat. 
    Format your response EXACTLY like this:
    TITLE: [The Title]
    [Your actual helpful response to the user...]
    
    Example:
    TITLE: Cycle Tracking Help
    Hi there! I can certainly help with that...`;
  }
  
  // Store user message
  const { error: userMsgError } = await supabase
    .from('chatbot_messages')
    .insert({
      user_id: userId,
      session_id: activeSessionId,
      role: 'USER',
      message,
      context_type: contextType,
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
    
    const rawText = result.response.text();
    
    // Parse out the title if requested
    if (needsTitle) {
        const titleMatch = rawText.match(/^TITLE:\s*(.+?)(\n|$)/i);
        if (titleMatch) {
            const newTitle = titleMatch[1].trim().replace(/^["']|["']$/g, ''); // Clean quotes
            aiResponse = rawText.replace(titleMatch[0], '').trim(); // Remove title line from response
            
            // Update session title (fire and forget)
            if (newTitle && newTitle.length < 60) {
                 supabase
                .from('chatbot_sessions')
                .update({ title: newTitle })
                .eq('id', activeSessionId)
                .then();
            }
        } else {
            // Fallback if AI ignored instruction
             aiResponse = rawText;
        }
    } else {
        aiResponse = rawText;
    }
    
  } catch (error: any) {
    console.error('AI generation error:', error);
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota exceeded')) {
        aiResponse = "I've reached my thinking(API) limit for now! 🧠💨 Please give me a minute to recharge and try asking again shortly.";
    } else if (error.status === 503 || error.message?.includes('503') || error.message?.includes('overloaded')) {
        aiResponse = "My brain is a bit overloaded right now (Server Busy). 😵 Please try again in a few seconds!";
    } else {
        aiResponse = "I'm having trouble responding right now. Please try again in a moment. 💕";
    }
  }
  
  // Store AI response
  const { error: aiMsgError } = await supabase
    .from('chatbot_messages')
    .insert({
      user_id: userId,
      session_id: activeSessionId,
      role: 'ASSISTANT',
      message: aiResponse,
      context_type: contextType,
      is_deleted: false,
    });
  
  if (aiMsgError) {
    throw new HttpError(400, 'Failed to store AI response', aiMsgError);
  }
  
  // Log the interaction
  await logAuditEvent(userId, 'chatbot.message', {
    messageLength: message.length,
    responseLength: aiResponse.length,
    role,
    sessionId: activeSessionId,
  });
  
  return {
    message: aiResponse,
    sessionId: activeSessionId,
    disclaimer: 'This is educational information, not medical advice.',
  };
};

/**
 * Get chat history for a user/session
 */
export const getChatHistory = async (
  userId: string,
  sessionId?: string,
  isAdmin: boolean = false,
  limit: number = 50
) => {
  const supabase = getSupabaseClient();
  
  let query = supabase
    .from('chatbot_messages')
    .select('id, role, message, context_type, created_at, is_deleted, deleted_at, session_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);
  
  if (sessionId) {
    query = query.eq('session_id', sessionId);
  } else {
    // If no session provided, we might want to return the MOST RECENT session's messages
    // or just empty to force user to select a session.
    // For now, let's look for the most recent active session
    if (!isAdmin) {
      const { data: latestSession } = await supabase
        .from('chatbot_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
        
      if (latestSession) {
        query = query.eq('session_id', latestSession.id);
      }
    }
  }

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
  
  // Start by deleting all sessions
  await supabase
    .from('chatbot_sessions')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('is_deleted', false);

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
