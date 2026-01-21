import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { getAllUserDetails, getUserActivityLog, getChatbotHistoryForUser, getUserCycleData, } from '../services/admin-data.service.js';
import { impersonateUser } from '../services/admin.service.js';
export const adminDataRouter = Router();
// All routes require admin authentication
adminDataRouter.use(authenticate, requireRoles('ADMIN'));
// Get comprehensive user details (profile + cycles + symptoms + journals)
adminDataRouter.get('/users/:userId/details', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const details = await getAllUserDetails(userId);
    res.json(details);
}));
// Get user activity log (audit logs + last login)
adminDataRouter.get('/users/:userId/activity', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const activity = await getUserActivityLog(userId);
    res.json(activity);
}));
// Get chatbot history (including soft-deleted messages)
adminDataRouter.get('/users/:userId/chatbot', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const history = await getChatbotHistoryForUser(userId);
    res.json({ history });
}));
// Get user cycle data
adminDataRouter.get('/users/:userId/cycles', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const cycles = await getUserCycleData(userId);
    res.json({ cycles });
}));
// Impersonate user
adminDataRouter.post('/users/:userId/impersonate', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const result = await impersonateUser(req.authUser.id, userId);
    res.json(result);
}));
//# sourceMappingURL=admin-data.js.map