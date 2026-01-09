import { getUserByAccessToken } from '../services/auth.service.js';
import { HttpError } from '../utils/http-error.js';
export const authenticate = async (req, _res, next) => {
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
    }
    catch (error) {
        console.error('Auth Middleware Error:', error);
        next(error);
    }
};
export const requireRoles = (...roles) => (req, _res, next) => {
    if (!req.authUser) {
        return next(new HttpError(401, 'Unauthorized'));
    }
    if (!roles.includes(req.authUser.role)) {
        return next(new HttpError(403, 'Forbidden'));
    }
    return next();
};
//# sourceMappingURL=auth.js.map