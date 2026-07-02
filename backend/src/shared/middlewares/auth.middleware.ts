import type { RequestHandler } from 'express';
import { verifyToken } from '../utils/jwt';

/**
 * Requires a valid JWT in the Authorization: Bearer <token> header.
 * Attaches the decoded payload to req.user.
 */
export const requireAuth: RequestHandler = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or malformed Authorization header' });
        return;
    }

    const token = header.split(' ')[1];
    try {
        req.user = verifyToken(token); // { user_id, role, iat, exp }
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

/**
 * Use after requireAuth. Restricts a route to specific roles.
 * Example: router.get('/admin/x', requireAuth, requireRole('admin'), handler)
 */
export function requireRole(...allowedRoles: string[]): RequestHandler {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            res.status(403).json({ error: 'Forbidden - insufficient role' });
            return;
        }
        next();
    };
}
