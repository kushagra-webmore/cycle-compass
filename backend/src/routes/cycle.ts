import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils/async-handler';
import { createCycleSchema, logSymptomSchema, LogSymptomInput } from '../validators/cycle';
import { createCycle, getCurrentCycle, getSymptomHistory, logSymptom } from '../services/cycle.service';

export const cycleRouter = Router();
export const symptomRouter = Router();

cycleRouter.use(authenticate, requireRoles('PRIMARY'));
symptomRouter.use(authenticate, requireRoles('PRIMARY'));

cycleRouter.post(
  '/',
  validateBody(createCycleSchema),
  asyncHandler(async (req, res) => {
    const cycle = await createCycle(req.authUser!.id, req.body);
    res.status(201).json(cycle);
  }),
);

cycleRouter.get(
  '/current',
  asyncHandler(async (req, res) => {
    const cycle = await getCurrentCycle(req.authUser!.id);
    res.json(cycle);
  }),
);

symptomRouter.post(
  '/log',
  validateBody(logSymptomSchema),
  asyncHandler(async (req, res) => {
    const { cycleId, ...symptom } = req.body as LogSymptomInput;
    let targetCycleId = cycleId;

    if (!targetCycleId) {
      const currentCycle = await getCurrentCycle(req.authUser!.id);
      if (!currentCycle) {
        return res.status(400).json({ message: 'No active cycle found. Please create a cycle first.' });
      }
      targetCycleId = currentCycle.id;
    }

    const result = await logSymptom(req.authUser!.id, targetCycleId, symptom);
    res.status(201).json(result);
  }),
);

symptomRouter.get(
  '/history',
  asyncHandler(async (req, res) => {
    const daysParam = req.query.days ? Number(req.query.days) : undefined;
    const history = await getSymptomHistory(req.authUser!.id, daysParam);
    res.json(history);
  }),
);
