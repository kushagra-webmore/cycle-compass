import { NextFunction, Request, Response } from 'express';
import { getUserByAccessToken } from '../services/auth.service';
import { HttpError } from '../utils/http-error';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new HttpError(401, 'Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new HttpError(401, 'Invalid authorization token');
    }

    const user = await getUserByAccessToken(token);
    req.authUser = user;
    req.accessToken = token;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRoles = (...roles: Array<'PRIMARY' | 'PARTNER' | 'ADMIN'>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return next(new HttpError(401, 'Unauthorized'));
    }

    if (!roles.includes(req.authUser.role)) {
      return next(new HttpError(403, 'Forbidden'));
    }

    return next();
  };
