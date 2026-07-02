import { Router } from 'express';
import { listVehicles, assignDriver, createVehicle, updateVehicle } from './vehicles.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { validateDto } from '../../shared/middlewares/validate.middleware';
import { AssignDriverDto, CreateVehicleDto, UpdateVehicleDto } from './vehicles.types';

// Admin-only, mounted at /api/v1/admin/vehicles in app.ts
export const adminVehiclesRouter = Router();
adminVehiclesRouter.get('/', requireAuth, requireRole('admin'), listVehicles);
adminVehiclesRouter.post('/', requireAuth, requireRole('admin'), validateDto(CreateVehicleDto), createVehicle);
adminVehiclesRouter.patch('/:id', requireAuth, requireRole('admin'), validateDto(UpdateVehicleDto), updateVehicle);
adminVehiclesRouter.patch(
    '/:id/assign-driver',
    requireAuth,
    requireRole('admin'),
    validateDto(AssignDriverDto),
    assignDriver
);
