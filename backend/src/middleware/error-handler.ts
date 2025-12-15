import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

interface AppError {
  status?: number;
  message: string;
  details?: unknown;
}

export const errorHandler = (
  err: AppError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const status = 'status' in err ? err.status : StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Something went wrong';

  if (err instanceof ZodError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Validation error',
      errors: err.errors,
    });
  }

  if (status >= 500) {
    logger.error({ err }, 'Internal server error');
  }

  return res.status(status).json({ message });
};
