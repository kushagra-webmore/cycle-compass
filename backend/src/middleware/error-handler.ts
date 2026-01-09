import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

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
  /* 
    If err.status is undefined, default to 500. 
    (err.status || 500) might work but if status is 0 it could be an issue, though HTTP status 0 is invalid.
    Safe check:
  */
  const status = ('status' in err && typeof err.status === 'number' ? err.status : undefined) ?? StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Something went wrong';

  if (err instanceof ZodError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Validation error',
      errors: err.errors,
    });
  }

  if (status >= 500) {
    // Winston logger usually expects message first, then meta
    // Or logger.error(message, meta)
    // The previous call was logger.error({ err }, 'message')
    // Winston's default is logger.log(level, message, meta) logic.
    // Try: logger.error('Internal server error', { err })
    logger.error('Internal server error', { err });
  }

  const details = 'details' in err ? err.details : undefined;

  return res.status(status).json({ message, details });
};
