import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  adminForceUnpairSchema,
  adminMythArticleSchema,
  adminUpdateUserSchema,
} from '../validators/admin';
import { asyncHandler } from '../utils/async-handler';
import {
  deleteMythArticle,
  forceUnpair,
  getAnalyticsOverview,
  listAIInteractions,
  listConsentAuditLogs,
  listMythArticles,
  listPairings,
  listUsers,
  updateUserAccount,
  upsertMythArticle,
} from '../services/admin.service';

export const adminRouter = Router();

adminRouter.use(authenticate, requireRoles('ADMIN'));

adminRouter.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const users = await listUsers();
    res.json(users);
  }),
);

adminRouter.post(
  '/users/update',
  validateBody(adminUpdateUserSchema),
  asyncHandler(async (req, res) => {
    const { userId, status, role } = req.body;
    const result = await updateUserAccount(req.authUser!.id, { userId, status, role });
    res.json(result);
  }),
);

adminRouter.get(
  '/pairings',
  asyncHandler(async (_req, res) => {
    const pairings = await listPairings();
    res.json(pairings);
  }),
);

adminRouter.post(
  '/pairings/force-unpair',
  validateBody(adminForceUnpairSchema),
  asyncHandler(async (req, res) => {
    await forceUnpair(req.authUser!.id, req.body.pairingId);
    res.json({ success: true });
  }),
);

adminRouter.get(
  '/consent/logs',
  asyncHandler(async (_req, res) => {
    const logs = await listConsentAuditLogs();
    res.json(logs);
  }),
);

adminRouter.get(
  '/analytics/overview',
  asyncHandler(async (_req, res) => {
    const overview = await getAnalyticsOverview();
    res.json(overview);
  }),
);

adminRouter.get(
  '/ai/interactions',
  asyncHandler(async (_req, res) => {
    const interactions = await listAIInteractions();
    res.json(interactions);
  }),
);

adminRouter.get(
  '/myths',
  asyncHandler(async (_req, res) => {
    const articles = await listMythArticles();
    res.json(articles);
  }),
);

adminRouter.post(
  '/myths/upsert',
  validateBody(adminMythArticleSchema),
  asyncHandler(async (req, res) => {
    const article = await upsertMythArticle(req.authUser!.id, req.body);
    res.json(article);
  }),
);

adminRouter.delete(
  '/myths/:id',
  asyncHandler(async (req, res) => {
    await deleteMythArticle(req.authUser!.id, req.params.id);
    res.json({ success: true });
  }),
);
