import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { updateUserProfile, uploadUserAvatar } from '../services/user.service.js';
import { validateBody } from '../middleware/validate.js';
import { z } from 'zod';
import multer from 'multer';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  timezone: z.string().optional(),
  dateOfBirth: z.string().optional(), // ISO date string
  onboardingCompleted: z.boolean().optional(),
  lastPeriodDate: z.string().optional().nullable(),
  cycleLength: z.number().int().positive().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
});

export const userRouter = Router();

// Update current user's profile
userRouter.patch(
  '/me',
  authenticate,
  validateBody(updateProfileSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as unknown as AuthenticatedRequest;
    const { onboardingCompleted, lastPeriodDate, cycleLength, dateOfBirth, avatarUrl, ...rest } = req.body;
    
    // Map frontend field names to backend field names
    const updates = {
      ...rest,
      onboarding_completed: onboardingCompleted,
      last_period_date: lastPeriodDate,
      cycle_length: cycleLength,
      date_of_birth: dateOfBirth,
      avatar_url: avatarUrl,
    };

    console.log('Processing user update with data:', updates);
    
    const updatedUser = await updateUserProfile(authReq.authUser.id, updates);
    res.json(updatedUser);
  })
);

// Upload avatar
userRouter.post(
  '/avatar',
  authenticate,
  upload.single('avatar'),
  asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as unknown as AuthenticatedRequest;
    
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const avatarUrl = await uploadUserAvatar({
      userId: authReq.authUser.id,
      fileBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
    });

    res.json({ avatarUrl });
  })
);
