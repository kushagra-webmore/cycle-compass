import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { HttpError } from '../utils/http-error';

export const validateBody = (schema: AnyZodObject) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new HttpError(400, 'Invalid request body', error.flatten()));
        return;
      }
      next(error);
    }
  };
