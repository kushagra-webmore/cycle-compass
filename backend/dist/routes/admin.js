import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { adminForceUnpairSchema, adminMythArticleSchema, adminUpdateUserSchema, } from '../validators/admin.js';
import { asyncHandler } from '../utils/async-handler.js';
import { deleteMythArticle, forceUnpair, getAnalyticsOverview, listAIInteractions, listConsentAuditLogs, listMythArticles, listPairings, listUsers, updateUserAccount, deleteUserAccount, upsertMythArticle, } from '../services/admin.service.js';
import { getDashboardAnalytics } from '../services/analytics.service.js';
export const adminRouter = Router();
adminRouter.use(authenticate, requireRoles('ADMIN'));
adminRouter.get('/users', asyncHandler(async (_req, res) => {
    const users = await listUsers();
    res.json(users);
}));
adminRouter.post('/users/update', validateBody(adminUpdateUserSchema), asyncHandler(async (req, res) => {
    const { userId, status, role } = req.body;
    const result = await updateUserAccount(req.authUser.id, { userId, status, role });
    res.json(result);
}));
adminRouter.delete('/users/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    await deleteUserAccount(req.authUser.id, userId);
    res.json({ success: true });
}));
adminRouter.get('/pairings', asyncHandler(async (_req, res) => {
    const pairings = await listPairings();
    res.json(pairings);
}));
adminRouter.post('/pairings/unpair', validateBody(adminForceUnpairSchema), asyncHandler(async (req, res) => {
    const { pairingId } = req.body;
    await forceUnpair(req.authUser.id, pairingId);
    res.json({ success: true });
}));
adminRouter.get('/consent-logs', asyncHandler(async (_req, res) => {
    const logs = await listConsentAuditLogs();
    res.json(logs);
}));
adminRouter.get('/analytics/dashboard', asyncHandler(async (req, res) => {
    const days = req.query.days ? parseInt(req.query.days) : 30;
    const analytics = await getDashboardAnalytics(days);
    res.json(analytics);
}));
adminRouter.get('/analytics/overview', asyncHandler(async (_req, res) => {
    const analytics = await getAnalyticsOverview();
    res.json(analytics);
}));
adminRouter.get('/ai-interactions', asyncHandler(async (_req, res) => {
    const interactions = await listAIInteractions();
    res.json(interactions);
}));
adminRouter.get('/myths', asyncHandler(async (_req, res) => {
    const articles = await listMythArticles();
    res.json(articles);
}));
adminRouter.post('/myths/upsert', validateBody(adminMythArticleSchema), asyncHandler(async (req, res) => {
    const article = await upsertMythArticle(req.authUser.id, req.body);
    res.json(article);
}));
adminRouter.delete('/myths/:id', asyncHandler(async (req, res) => {
    await deleteMythArticle(req.authUser.id, req.params.id);
    res.json({ success: true });
}));
//# sourceMappingURL=admin.js.map