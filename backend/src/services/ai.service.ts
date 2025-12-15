import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import {
  cycleExplainerSystemPrompt,
  partnerGuidanceSystemPrompt,
  journalSummarySystemPrompt,
  buildCycleExplainerUserPrompt,
  buildPartnerGuidanceUserPrompt,
  buildJournalSummaryUserPrompt,
} from '../config/prompts';
import { logAIInteraction } from './audit.service';

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
  const prompt = buildJournalSummaryUserPrompt(entries.join('\n\n'));
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [{ text: `${journalSummarySystemPrompt}\n\n${prompt}` }],
    }],
  });

  const text = result.response.text();
  await logAIInteraction(userId, 'JOURNAL', { entries }, text);
  return text;
};
