import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import {
  cycleExplainerSystemPrompt,
  partnerGuidanceSystemPrompt,
  journalSummarySystemPrompt,
  dailyInsightsSystemPrompt,
  buildCycleExplainerUserPrompt,
  buildPartnerGuidanceUserPrompt,
  buildJournalSummaryUserPrompt,
  buildDailyInsightsUserPrompt,
} from '../config/prompts.js';
import { logAIInteraction } from './audit.service.js';
import { getUserWithProfile } from './user.service.js';
import { getCurrentCycle } from './cycle.service.js';
import { getLatestSymptomEntry } from './cycle.service.js';

const client = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const createModel = () => client.getGenerativeModel({ model: 'gemini-2.5-flash' });

export const generateCycleExplainer = async (
  userId: string,
  params: {
    phase: string;
    day: number;
    symptoms: string;
    mood: string;
    energy: string;
    history: string;
  },
) => {
  const model = createModel();
  const prompt = buildCycleExplainerUserPrompt(params);
  try {
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: `${cycleExplainerSystemPrompt}\n\n${prompt}` }],
      }],
    });
    const text = result.response.text();
    await logAIInteraction(userId, 'EXPLAINER', params, text);
    return text;
  } catch (error: any) {
    if (error.status === 429 || error.message?.includes('429')) {
       return "I'm a bit overwhelmed right now! 🧠💨 Please check back in a minute.";
    }
    if (error.status === 503 || error.message?.includes('503') || error.message?.includes('overloaded')) {
       return "Service momentarily overloaded. Please try again shortly!";
    }
    throw error;
  }
};

export const generatePartnerGuidance = async (
  userId: string,
  params: {
    phase: string;
    energySummary: string;
    moodSummary: string;
  },
) => {
  const model = createModel();
  const prompt = buildPartnerGuidanceUserPrompt(params);
  
  let text = '';
  try {
    const result = await model.generateContent({
        contents: [{
        role: 'user',
        parts: [{ text: `${partnerGuidanceSystemPrompt}\n\n${prompt}` }],
        }],
    });
    text = result.response.text();
  } catch (error: any) {
     if (error.status === 429 || error.message?.includes('429')) {
        return {
            explanation: "I'm taking a short break. Please try again soon.",
            actions: ["Be patient", "Try again in a minute"],
            foodRecommendation: "N/A",
            activityRecommendation: "N/A"
        };
     }
     if (error.status === 503 || error.message?.includes('503') || error.message?.includes('overloaded')) {
        return {
            explanation: "Server is busy right now. Please try again in a moment.",
            actions: ["Wait a moment"],
            foodRecommendation: "N/A",
            activityRecommendation: "N/A"
        };
     }
     // For other errors, we might let it fall through to the mock JSON below or throw.
     // Let's let it fall through but log it.
     console.error("Partner guidance error", error);
  }

  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();

  let json = {
    explanation: "Support your partner by listening and being present.",
    actions: ["Ask how they are feeling", "Offer a warm drink", "Be patient"],
    foodRecommendation: "Comfort food",
    activityRecommendation: "Relaxing evening"
  };

  try {
    json = JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse Partner Guidance JSON', text);
  }

  await logAIInteraction(userId, 'GUIDANCE', params, text);
  return json;
};

export const generateJournalSummary = async (userId: string, entries: string[]) => {
  const model = createModel();

  const userProfile = await getUserWithProfile(userId, '');
  const currentCycle = await getCurrentCycle(userId);
  const latestSymptom = await getLatestSymptomEntry(userId);

  const prompt = buildJournalSummaryUserPrompt({
    entries: entries.join('\n\n'),
    userName: userProfile.name ?? userProfile.email,
    timezone: userProfile.timezone,
    phase: currentCycle?.context.phase ?? null,
    cycleDay: currentCycle?.context.currentDay ?? null,
    latestMood: latestSymptom?.mood ?? null,
    latestEnergy: latestSymptom?.energy ?? null,
    latestPain: typeof latestSymptom?.pain === 'number' ? latestSymptom.pain : null,
  });

  let attempt = 0;
  let lastError: unknown;

  while (attempt < 3) {
    try {
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: `${journalSummarySystemPrompt}\n\n${prompt}` }],
        }],
      });

      const text = result.response.text();
      await logAIInteraction(userId, 'JOURNAL', { entries, attempt: attempt + 1 }, text);
      return text;
    } catch (error: any) {
      if (error.status === 429 || error.message?.includes('429')) {
         return "Summary temporarily unavailable due to high usage. Please try again later.";
      }
      if (error.status === 503 || error.message?.includes('503') || error.message?.includes('overloaded')) {
         return "Service temporarily busy. Please retry in a moment.";
      }
      lastError = error;
      attempt += 1;
      if (attempt >= 3) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error('Failed to generate journal summary');
};

import { getSupabaseClient } from '../lib/supabase.js';

export const generateDailyInsights = async (
  userId: string,
  params: {
    phase: string;
    day: number;
    symptoms?: string;
    goal?: 'TRACKING' | 'CONCEIVE';
  },
) => {
  // Check cache first
  const supabase = getSupabaseClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: cachedAuth } = await supabase
    .from('ai_interactions')
    .select('llm_response, context_type')
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString())
    .order('created_at', { ascending: false });

  // Iterate to find a valid daily insight
  if (cachedAuth && cachedAuth.length > 0) {
     for (const entry of cachedAuth) {
        // Filter in memory to be safe
        const type = entry.context_type as string;
        if (type !== 'DAILY_INSIGHTS' && type !== 'GUIDANCE') {
            continue;
        }

        try {
           const cleanedCached = entry.llm_response.replace(/```json/g, '').replace(/```/g, '').trim();
           const cachedJson = JSON.parse(cleanedCached);
           // Check if it has the keys specific to Daily Insights
           if (cachedJson.food || cachedJson.activity || cachedJson.wisdom) {
              return cachedJson;
           }
        } catch (e) {
           // Continue
        }
     }
  }

  const model = createModel();
  const prompt = buildDailyInsightsUserPrompt(params);
  
  let text = '';
  try {
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: `${dailyInsightsSystemPrompt}\n\n${prompt}` }],
      }],
    });
    text = result.response.text();
  } catch (error: any) {
    console.error('AI generation error:', error);
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota exceeded')) {
        // Return a special fallback that indicates limit reached but doesn't crash UI
        return {
           food: "Brain freeze! 🧠💨 I'm thinking too hard.",
           activity: "API limit reached. Please try again in a minute.",
           wisdom: "Patience is a virtue (and a necessity right now)! 💕"
        };
    }
    if (error.status === 503 || error.message?.includes('503') || error.message?.includes('overloaded')) {
        return {
           food: "Service overloaded.",
           activity: "Server is busy. Please try again shortly.",
           wisdom: "Even AI needs a deep breath sometimes! 🌬️"
        };
    }
    // Re-throw other errors to be handled by the caller or allow fallback below
  }

  // Attempt to clean markdown code blocks if present
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  let json;
  try {
    json = JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse AI daily insights JSON or empty response', text);
    // Fallback
    json = {
      food: "Hydrate well today.",
      activity: "Listen to your body.",
      wisdom: "You are doing great."
    };
  }

  if (text) {
     await logAIInteraction(userId, 'DAILY_INSIGHTS', params, text);
  }
  return json;
};
