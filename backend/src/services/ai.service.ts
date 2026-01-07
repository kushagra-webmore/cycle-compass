import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import {
  cycleExplainerSystemPrompt,
  partnerGuidanceSystemPrompt,
  journalSummarySystemPrompt,
  buildCycleExplainerUserPrompt,
  buildPartnerGuidanceUserPrompt,
  buildJournalSummaryUserPrompt,
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
  await logAIInteraction(userId, 'GUIDANCE', params, text);
  return text;
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
