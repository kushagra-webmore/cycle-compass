import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import { createCycleSchema, bulkCycleSchema, logSymptomSchema, updateCycleSchema, LogSymptomInput } from '../validators/cycle.js';
import { createCycle, createCyclesBulk, getCurrentCycle, getSymptomHistory, logSymptom, getCyclesHistory, updateCycle, deleteCycle } from '../services/cycle.service.js';

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

cycleRouter.post(
  '/bulk',
  validateBody(bulkCycleSchema),
  asyncHandler(async (req, res) => {
    const result = await createCyclesBulk(req.authUser!.id, req.body.cycles);
    res.status(201).json({ cycles: result });
  }),
);

cycleRouter.get(
  '/history',
  asyncHandler(async (req, res) => {
    const cycles = await getCyclesHistory(req.authUser!.id);
    res.json(cycles);
  }),
);

cycleRouter.patch(
  '/:id',
  validateBody(updateCycleSchema),
  asyncHandler(async (req, res) => {
    const cycle = await updateCycle(req.authUser!.id, req.params.id, req.body);
    res.json(cycle);
  }),
);

cycleRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deleteCycle(req.authUser!.id, req.params.id);
    res.json({ success: true });
  }),
);

cycleRouter.get(
  '/current',
  asyncHandler(async (req, res) => {
    // Accept optional client date to avoid timezone issues
    const clientDate = req.query.date ? new Date(req.query.date as string) : undefined;
    const cycle = await getCurrentCycle(req.authUser!.id, clientDate);
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
