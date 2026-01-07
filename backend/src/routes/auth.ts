import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { signupSchema, loginSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema, updatePasswordSchema } from '../validators/auth.js';
import { validateBody } from '../middleware/validate.js';
import { signupWithEmail, signInWithEmail, refreshSession, signOutUser, updateUserPassword } from '../services/auth.service.js';
import { requestPasswordReset, resetPassword } from '../services/password-reset.service.js';
import { authenticate } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post(
  '/signup',
  validateBody(signupSchema),
  asyncHandler(async (req, res) => {
    const { email, password, role, name, dateOfBirth, phone, city, timezone } = req.body;
    const result = await signupWithEmail({ email, password, role, name, dateOfBirth, phone, city, timezone });
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

authRouter.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await requestPasswordReset(email);
    res.json(result);
  }),
);

authRouter.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    const result = await resetPassword(token, newPassword);
    res.json(result);
  }),
);

authRouter.post(
  '/update-password',
  authenticate,
  validateBody(updatePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!req.user) {
        throw new Error('User not authenticated');
    }
    await updateUserPassword(req.user.id, req.user.email, currentPassword, newPassword);
    res.json({ success: true, message: 'Password updated successfully' });
  }),
);
