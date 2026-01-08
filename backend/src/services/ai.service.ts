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
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [{ text: `${cycleExplainerSystemPrompt}\n\n${prompt}` }],
    }],
  });

  const text = result.response.text();
  await logAIInteraction(userId, 'EXPLAINER', params, text);
  return text;
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
  
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [{ text: `${partnerGuidanceSystemPrompt}\n\n${prompt}` }],
    }],
  });

  const text = result.response.text();
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
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt >= 3) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error('Failed to generate journal summary');
};

export const generateDailyInsights = async (
  userId: string,
  params: {
    phase: string;
    day: number;
    symptoms?: string;
    goal?: 'TRACKING' | 'CONCEIVE';
  },
) => {
  const model = createModel();
  const prompt = buildDailyInsightsUserPrompt(params);
  
  // Enforce JSON format in the prompt (already done) but also can use generation config if available.
  // For now, reliance on prompt instruction.
  
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [{ text: `${dailyInsightsSystemPrompt}\n\n${prompt}` }],
    }],
  });

  const text = result.response.text();
  
  // Attempt to clean markdown code blocks if present
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  let json;
  try {
    json = JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse AI daily insights JSON', text);
    // Fallback or throw
    json = {
      food: "Hydrate well today.",
      activity: "Listen to your body.",
      wisdom: "You are doing great."
    };
  }

  await logAIInteraction(userId, 'GUIDANCE', params, text); // Reusing GUIDANCE or make new type if needed
  return json;
};
