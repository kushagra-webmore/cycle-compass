import { z } from 'zod';

export const createJournalSchema = z.object({
  date: z.string().regex(/\d{4}-\d{2}-\d{2}/, 'Invalid date format (YYYY-MM-DD)'),
  encryptedText: z.string().min(1),
  aiSummary: z.string().optional(),
  generateSummary: z.boolean().optional(),
});

export type CreateJournalInput = z.infer<typeof createJournalSchema>;
