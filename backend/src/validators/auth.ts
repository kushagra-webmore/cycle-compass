import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
  role: z.enum(['PRIMARY', 'PARTNER', 'ADMIN']).default('PRIMARY'),
  name: z
    .string({ required_error: 'Name is required.' })
    .min(1, { message: 'Name is required.' })
    .max(120, { message: 'Name must be 120 characters or less.' }),
  dateOfBirth: z
    .string({ required_error: 'Date of birth is required.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date of birth must be in YYYY-MM-DD format.' }),
  phone: z
    .string({ required_error: 'Phone number is required.' })
    .regex(/^[0-9+\-()\s]{7,20}$/, { message: 'Please enter a valid phone number.' }),
  city: z
    .string({ required_error: 'City is required.' })
    .min(2, { message: 'City name must be at least 2 characters.' })
    .max(120, { message: 'City name must be 120 characters or less.' }),
  periodLength: z.number().min(2).max(15).optional(),
  timezone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Schema for password reset
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// Schema for updating password (authenticated)
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});
