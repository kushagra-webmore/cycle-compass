import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { signupSchema, loginSchema, refreshSchema } from '../validators/auth';
import { validateBody } from '../middleware/validate';
import { signupWithEmail, signInWithEmail, refreshSession, signOutUser } from '../services/auth.service';
import { authenticate } from '../middleware/auth';

export const authRouter = Router();

authRouter.post(
  '/signup',
  validateBody(signupSchema),
  asyncHandler(async (req, res) => {
    const { email, password, role, name, timezone } = req.body;
    const result = await signupWithEmail(email, password, role, name, timezone);
    res.status(201).json(result);
  }),
);

authRouter.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await signInWithEmail(email, password);
    res.json(result);
  }),
);

authRouter.post(
  '/refresh',
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await refreshSession(refreshToken);
    res.json(result);
  }),
);

authRouter.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.accessToken) {
      return res.status(400).json({ message: 'Session token missing' });
    }
    await signOutUser(req.accessToken);
    res.json({ success: true });
  }),
);
