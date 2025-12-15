import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth';
import { asyncHandler } from '../utils/async-handler';
import { getPartnerSummary } from '../services/partner.service';
import { aiPartnerGuidanceSchema } from '../validators/ai';
import { validateBody } from '../middleware/validate';
import { generatePartnerGuidance } from '../services/ai.service';

export const partnerRouter = Router();

partnerRouter.use(authenticate, requireRoles('PARTNER'));

partnerRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const summary = await getPartnerSummary(req.authUser!.id);
    res.json(summary);
  }),
);

partnerRouter.post(
  '/guidance',
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

    res.json({ guidance, disclaimer: 'This guidance is informational and not medical advice.' });
  }),
);
