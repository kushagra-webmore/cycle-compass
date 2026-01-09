import { z } from 'zod';
export const adminUpdateUserSchema = z.object({
    userId: z.string().uuid(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
    role: z.enum(['PRIMARY', 'PARTNER', 'ADMIN']).optional(),
});
export const adminForceUnpairSchema = z.object({
    pairingId: z.string().uuid(),
});
export const adminMythArticleSchema = z.object({
    id: z.string().uuid().optional(),
    title: z.string().min(3),
    content: z.string().min(10),
    tags: z.array(z.string()).optional(),
    isPublished: z.boolean().optional(),
});
//# sourceMappingURL=admin.js.map