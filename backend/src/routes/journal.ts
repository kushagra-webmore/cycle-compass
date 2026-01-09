import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createJournalSchema } from '../validators/journal.js';
import { asyncHandler } from '../utils/async-handler.js';
import { createJournalEntry, listJournalEntries } from '../services/journal.service.js';

export const journalRouter = Router();

journalRouter.use(authenticate, requireRoles('PRIMARY'));

journalRouter.post(
  '/create',
  validateBody(createJournalSchema),
  asyncHandler(async (req, res) => {
    const entry = await createJournalEntry({
      userId: req.authUser!.id,
      date: req.body.date,
      encryptedText: req.body.encryptedText,
      aiSummary: req.body.aiSummary,
    });
    res.status(201).json(entry);
  }),
);

journalRouter.get(
  '/list',
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 30;
    const entries = await listJournalEntries(req.authUser!.id, limit);
    res.json(entries);
  }),
);
