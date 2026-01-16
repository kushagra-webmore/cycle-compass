import { z } from 'zod';
export const createPairingSchema = z.object({
    method: z.enum(['LINK', 'QR', 'CODE', 'ALL']).default('ALL'),
});
export const acceptPairingSchema = z.object({
    token: z.string().min(10).optional(),
    pairCode: z.string().length(6).optional(),
}).refine((data) => data.token || data.pairCode, {
    message: 'Provide either a token or a pairing code',
    path: ['token'],
});
export const revokePairingSchema = z.object({
    pairingId: z.string().uuid(),
});
export const updateConsentSchema = z.object({
    pairingId: z.string().uuid(),
    sharePhase: z.boolean().optional(),
    shareMoodSummary: z.boolean().optional(),
    shareEnergySummary: z.boolean().optional(),
    shareSymptoms: z.boolean().optional(),
    shareJournals: z.boolean().optional(),
    shareMyCycle: z.boolean().optional(),
});
//# sourceMappingURL=pairing.js.map