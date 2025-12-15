import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  aiExplainSchema,
  aiJournalSummarySchema,
  aiPartnerGuidanceSchema,
} from '../validators/ai';
import { asyncHandler } from '../utils/async-handler';
import {
  generateCycleExplainer,
  generateJournalSummary,
  generatePartnerGuidance,
} from '../services/ai.service';
import {
  getCurrentCycle,
  getCycleById,
  getLatestSymptomEntry,
} from '../services/cycle.service';
import { getPartnerSummary } from '../services/partner.service';

export const aiRouter = Router();

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
