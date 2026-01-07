import { NextFunction, Request, Response } from 'express';
import { getUserByAccessToken } from '../services/auth.service.js';
import { HttpError } from '../utils/http-error.js';
import { AuthUser } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
      accessToken?: string;
      user?: AuthUser;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
  authUser: AuthUser;
  accessToken: string;
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Auth Middleware: Missing or invalid auth header');
      throw new HttpError(401, 'Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Auth Middleware: Empty token');
      throw new HttpError(401, 'Invalid authorization token');
    }

    // console.log('Auth Middleware: Verifying token:', token.substring(0, 10) + '...');
    const user = await getUserByAccessToken(token);
    req.authUser = user;
    req.user = user;
    req.accessToken = token;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
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
