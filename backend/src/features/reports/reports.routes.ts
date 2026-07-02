import { Router } from 'express';
import { getRidershipReport } from './reports.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';

// Admin-only, mounted at /api/v1/admin/reports in app.ts
export const adminReportsRouter = Router();
adminReportsRouter.get('/ridership', requireAuth, requireRole('admin'), getRidershipReport);
