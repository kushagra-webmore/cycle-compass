import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { chatMessageSchema, chatHistorySchema } from '../validators/chatbot.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  sendChatMessage,
  getChatHistory,
  softDeleteChatHistory,
  createSession,
  getUserSessions,
  deleteSession,
} from '../services/chatbot.service.js';

export const chatbotRouter = Router();

// All chatbot endpoints require authentication
chatbotRouter.use(authenticate);

/**
 * POST /chatbot/sessions
 * Create a new chat session
 */
chatbotRouter.post(
  '/sessions',
  asyncHandler(async (req, res) => {
    const userId = req.authUser!.id;
    const session = await createSession(userId);
    res.json(session);
  }),
);

/**
 * GET /chatbot/sessions
 * Get all chat sessions for the user
 */
chatbotRouter.get(
  '/sessions',
  asyncHandler(async (req, res) => {
    const userId = req.authUser!.id;
    const isAdmin = req.authUser!.role === 'ADMIN';
    const sessions = await getUserSessions(userId, isAdmin);
    res.json({ sessions });
  }),
);

/**
 * DELETE /chatbot/sessions/:id
 * Delete a chat session
 */
chatbotRouter.delete(
  '/sessions/:id',
  asyncHandler(async (req, res) => {
    const userId = req.authUser!.id;
    const sessionId = req.params.id;
    const result = await deleteSession(userId, sessionId);
    res.json(result);
  }),
);

/**
 * POST /chatbot/message
 * Send a message to the chatbot and get AI response
 */
chatbotRouter.post(
  '/message',
  validateBody(chatMessageSchema),
  asyncHandler(async (req, res) => {
    const userId = req.authUser!.id;
    const { message, sessionId } = req.body;
    
    // Pass sessionId if provided
    const response = await sendChatMessage(userId, message, sessionId);
    
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
    const sessionId = req.query.sessionId as string | undefined;
    
    const history = await getChatHistory(userId, sessionId, false, limit);
    
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
