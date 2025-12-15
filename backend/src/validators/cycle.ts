import { z } from 'zod';

export const createCycleSchema = z.object({
  startDate: z.string().regex(/\d{4}-\d{2}-\d{2}/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/\d{4}-\d{2}-\d{2}/, 'Invalid date format (YYYY-MM-DD)').optional(),
  cycleLength: z.number().min(15).max(60).optional(),
  isPredicted: z.boolean().optional(),
});

export const logSymptomSchema = z.object({
  cycleId: z.string().uuid().optional(),
  date: z.string().regex(/\d{4}-\d{2}-\d{2}/, 'Invalid date format (YYYY-MM-DD)'),
  pain: z.number().min(0).max(10),
  mood: z.enum(['LOW', 'NEUTRAL', 'HIGH']),
  energy: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  sleepHours: z.number().min(0).max(24).optional(),
  cravings: z.string().max(500).optional(),
  bloating: z.boolean().optional(),
});

export type CreateCycleInput = z.infer<typeof createCycleSchema>;
export type LogSymptomInput = z.infer<typeof logSymptomSchema>;
