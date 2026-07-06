import { Router } from 'express';
import { createRoute, listActiveRoutes, listRoutes, updateRoute } from './routes.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { validateDto } from '../../shared/middlewares/validate.middleware';
import { CreateRouteDto, UpdateRouteDto } from './routes.types';

// Admin-only, mounted at /api/v1/admin/routes in app.ts
export const adminRoutesRouter = Router();
adminRoutesRouter.get('/', requireAuth, requireRole('admin'), listRoutes);
adminRoutesRouter.post('/', requireAuth, requireRole('admin'), validateDto(CreateRouteDto), createRoute);
adminRoutesRouter.patch('/:id', requireAuth, requireRole('admin'), validateDto(UpdateRouteDto), updateRoute);

// Read-only route list for any authenticated user (mobile route/schedule
// screen, MOB-8/PSD-158). Mounted at /api/v1/routes in app.ts.
export const routesRouter = Router();
routesRouter.get('/', requireAuth, listActiveRoutes);
