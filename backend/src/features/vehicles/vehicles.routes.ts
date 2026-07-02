import { Router } from 'express';
import { listVehicles, assignDriver } from './vehicles.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { validateDto } from '../../shared/middlewares/validate.middleware';
import { AssignDriverDto } from './vehicles.types';

// Admin-only, mounted at /api/v1/admin/vehicles in app.ts
export const adminVehiclesRouter = Router();
adminVehiclesRouter.get('/', requireAuth, requireRole('admin'), listVehicles);
adminVehiclesRouter.patch(
    '/:id/assign-driver',
    requireAuth,
    requireRole('admin'),
    validateDto(AssignDriverDto),
    assignDriver
);
