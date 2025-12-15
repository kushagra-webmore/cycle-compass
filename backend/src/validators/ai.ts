import { z } from 'zod';

export const aiExplainSchema = z.object({
  cycleId: z.string().uuid().optional(),
  symptoms: z.array(z.string()).optional(),
  mood: z.string().optional(),
  energy: z.string().optional(),
  history: z.string().optional(),
});

export const aiPartnerGuidanceSchema = z.object({
  pairingId: z.string().uuid().optional(),
});

export const aiJournalSummarySchema = z.object({
  entries: z.array(z.string()).min(1),
});

export type AIExplainInput = z.infer<typeof aiExplainSchema>;
export type AIPartnerGuidanceInput = z.infer<typeof aiPartnerGuidanceSchema>;
export type AIJournalSummaryInput = z.infer<typeof aiJournalSummarySchema>;
