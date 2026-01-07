import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { chatMessageSchema, chatHistorySchema } from '../validators/chatbot.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  sendChatMessage,
  getChatHistory,
  softDeleteChatHistory,
} from '../services/chatbot.service.js';

export const chatbotRouter = Router();

// All chatbot endpoints require authentication and PRIMARY role
chatbotRouter.use(authenticate, requireRoles('PRIMARY'));

/**
 * POST /chatbot/message
 * Send a message to the chatbot and get AI response
 */
chatbotRouter.post(
  '/message',
  validateBody(chatMessageSchema),
  asyncHandler(async (req, res) => {
    const userId = req.authUser!.id;
    const { message } = req.body;
    
    const response = await sendChatMessage(userId, message);
    
    res.json(response);
  }),
);

/**
 * GET /chatbot/history
 * Get chat history (non-deleted messages only for regular users)
 */
chatbotRouter.get(
  '/history',
  asyncHandler(async (req, res) => {
    const userId = req.authUser!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    
    const history = await getChatHistory(userId, false, limit);
    
    res.json({ history });
  }),
);

/**
 * POST /chatbot/clear
 * Soft delete chat history (marks as deleted, doesn't remove from DB)
 */
chatbotRouter.post(
  '/clear',
  asyncHandler(async (req, res) => {
    const userId = req.authUser!.id;
    
    const result = await softDeleteChatHistory(userId);
    
    res.json(result);
  }),
);
