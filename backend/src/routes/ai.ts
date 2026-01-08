import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  aiExplainSchema,
  aiJournalSummarySchema,
  aiPartnerGuidanceSchema,
} from '../validators/ai.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  generateCycleExplainer,
  generateJournalSummary,
  generatePartnerGuidance,
  generateDailyInsights,
} from '../services/ai.service.js';
import {
  getCurrentCycle,
  getCycleById,
  getLatestSymptomEntry,
} from '../services/cycle.service.js';
import { getPartnerSummary } from '../services/partner.service.js';

export const aiRouter = Router();

aiRouter.post(
  '/daily-insights',
  authenticate,
  requireRoles('PRIMARY'),
  asyncHandler(async (req, res) => {
    const userId = req.authUser!.id;
    // No specific body validation needed for now, getting params from backend state
    const cycle = await getCurrentCycle(userId);
    
    if (!cycle) {
       return res.status(400).json({ message: 'No cycle data found.' });
    }

    const latestSymptom = await getLatestSymptomEntry(userId);
    
    const insights = await generateDailyInsights(userId, {
      phase: cycle.context.phase,
      day: cycle.context.currentDay,
      symptoms: latestSymptom ? `${latestSymptom.mood ?? ''} ${latestSymptom.pain ? `Pain: ${latestSymptom.pain}` : ''}` : undefined,
      goal: 'TRACKING' // Defaults, could be from user profile
    });

    res.json({
      insights,
      disclaimer: 'This is not medical advice.'
    });
  })
);

aiRouter.post(
  '/explain',
  authenticate,
  requireRoles('PRIMARY'),
  validateBody(aiExplainSchema),
  asyncHandler(async (req, res) => {
    const userId = req.authUser!.id;
    const { cycleId, symptoms = [], mood, energy, history } = req.body;

    const cycle = cycleId
      ? await getCycleById(userId, cycleId)
      : await getCurrentCycle(userId);

    if (!cycle) {
      return res.status(400).json({ message: 'No cycle data found. Please create a cycle first.' });
    }

    const latestSymptom = await getLatestSymptomEntry(userId);

    const phase = cycle.context.phase ?? 'Unknown';
    const day = cycle.context.currentDay ?? 1;
    const symptomText = symptoms.length ? symptoms.join(', ') : latestSymptom?.cravings ?? 'Not reported';
    const moodText = mood ?? latestSymptom?.mood ?? 'Not reported';
    const energyText = energy ?? latestSymptom?.energy ?? 'Not reported';
    const historyText = history ?? 'No history provided.';

    const response = await generateCycleExplainer(userId, {
      phase,
      day,
      symptoms: symptomText,
      mood: moodText,
      energy: energyText,
      history: historyText,
    });

    res.json({
      explainer: response,
      disclaimer: 'This information is educational and not a substitute for medical advice.',
    });
  }),
);

aiRouter.post(
  '/journal-summary',
  authenticate,
  requireRoles('PRIMARY'),
  validateBody(aiJournalSummarySchema),
  asyncHandler(async (req, res) => {
    const userId = req.authUser!.id;
    const { entries } = req.body;

    const summary = await generateJournalSummary(userId, entries);

    res.json({
      summary,
      disclaimer: 'This reflection is informational only and not therapeutic advice.',
    });
  }),
);

aiRouter.post(
  '/partner-guidance',
  authenticate,
  requireRoles('PARTNER'),
  validateBody(aiPartnerGuidanceSchema),
  asyncHandler(async (req, res) => {
    const summary = await getPartnerSummary(req.authUser!.id);

    if (!summary) {
      return res.status(400).json({ message: 'No active pairing found.' });
    }

    const consent = summary.consent;

    if (!consent?.share_phase) {
      return res.status(403).json({ message: 'Phase sharing is disabled.' });
    }

    const phase = summary.cycle?.context.phase ?? 'Unknown';
    const energySummary = consent.share_energy_summary ? summary.summaries.energySummary ?? 'Not shared' : 'Not shared';
    const moodSummary = consent.share_mood_summary ? summary.summaries.moodSummary ?? 'Not shared' : 'Not shared';

    const guidance = await generatePartnerGuidance(req.authUser!.id, {
      phase,
      energySummary,
      moodSummary,
    });

    res.json({
      guidance,
      disclaimer: 'This guidance is informational and not medical advice.',
    });
  }),
);
