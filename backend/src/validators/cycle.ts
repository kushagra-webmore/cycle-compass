import { z } from 'zod';

const baseCycleSchema = z.object({
  startDate: z.string().regex(/\d{4}-\d{2}-\d{2}/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/\d{4}-\d{2}-\d{2}/, 'Invalid date format (YYYY-MM-DD)').nullable().optional(),
  cycleLength: z.number().min(15).max(60).optional(),
  isPredicted: z.boolean().optional(),
});

export const createCycleSchema = baseCycleSchema;
export const updateCycleSchema = baseCycleSchema.partial();

export const bulkCycleSchema = z.object({
  cycles: z
    .array(baseCycleSchema)
    .min(2, 'Please provide at least the most recent two cycles.')
    .max(12, 'You can upload up to 12 cycles at once.'),
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
  intercourse: z.boolean().optional(),
  protection: z.boolean().optional(),
  flow: z.string().optional(),
  otherSymptoms: z.array(z.string()).optional(),
});

export type CreateCycleInput = z.infer<typeof createCycleSchema>;
export type BulkCycleInput = z.infer<typeof bulkCycleSchema>;
export type LogSymptomInput = z.infer<typeof logSymptomSchema>;
