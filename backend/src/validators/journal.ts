import { z } from 'zod';

export const createJournalSchema = z.object({
  date: z.string().datetime({ offset: true }).optional(),
  encryptedText: z.string().min(1),
  aiSummary: z.string().optional(),
  generateSummary: z.boolean().optional(),
});

export type CreateJournalInput = z.infer<typeof createJournalSchema>;
