import { NextFunction, Request, Response } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { HttpError } from '../utils/http-error.js';

export const validateBody = (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('Validation Error for path:', req.path);
        console.error('Request Body:', req.body);
        console.error('Zod Errors:', JSON.stringify(error.flatten(), null, 2));
        next(new HttpError(400, 'Invalid request body', error.flatten()));
        return;
      }
      next(error);
    }
  };
