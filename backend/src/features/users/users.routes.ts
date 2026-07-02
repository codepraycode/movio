import { Router } from 'express';
import { listUsers } from './users.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';

// Admin-only, mounted at /api/v1/admin/users in app.ts
export const adminUsersRouter = Router();
adminUsersRouter.get('/', requireAuth, requireRole('admin'), listUsers);
