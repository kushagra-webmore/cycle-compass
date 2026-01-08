import { z } from 'zod';

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  sessionId: z.string().uuid('Invalid session ID').optional(),
});

export const chatHistorySchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(50),
});
