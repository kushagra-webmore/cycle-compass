import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { updateUserProfile } from '../services/user.service.js';
import { validateBody } from '../middleware/validate.js';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  timezone: z.string().optional(),
  onboardingCompleted: z.boolean().optional(),
  lastPeriodDate: z.string().optional().nullable(),
  cycleLength: z.number().int().positive().optional().nullable(),
});

export const userRouter = Router();

// Update current user's profile
userRouter.patch(
  '/me',
  authenticate,
  validateBody(updateProfileSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as unknown as AuthenticatedRequest;
    const { onboardingCompleted, lastPeriodDate, cycleLength, ...rest } = req.body;
    
    // Map frontend field names to backend field names
    const updates = {
      ...rest,
      onboarding_completed: onboardingCompleted,
      last_period_date: lastPeriodDate,
      cycle_length: cycleLength,
    };

    console.log('Processing user update with data:', updates);
    
    const updatedUser = await updateUserProfile(authReq.authUser.id, updates);
    res.json(updatedUser);
  })
);
