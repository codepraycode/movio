import type { RequestHandler } from 'express';
import { verifyToken } from '../utils/jwt';
import { ForbiddenError, UnauthorizedError } from '../errors';

/**
 * Requires a valid JWT in the Authorization: Bearer <token> header.
 * Attaches the decoded payload to req.user.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        next(new UnauthorizedError('Missing or malformed Authorization header'));
        return;
    }

    const token = header.split(' ')[1];
    try {
        req.user = verifyToken(token); // { user_id, role, iat, exp }
        next();
    } catch {
        next(new UnauthorizedError('Invalid or expired token'));
    }
};

/**
 * Use after requireAuth. Restricts a route to specific roles.
 * Example: router.get('/admin/x', requireAuth, requireRole('admin'), handler)
 */
export function requireRole(...allowedRoles: string[]): RequestHandler {
    return (req, _res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            next(new ForbiddenError('Forbidden - insufficient role'));
            return;
        }
        next();
    };
}
