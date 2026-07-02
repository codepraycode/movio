import type { Request, Response, NextFunction } from 'express';
import * as vehiclesService from './vehicles.service';
import { sendSuccess } from '../../shared/utils/ApiResponse';
import type { AssignDriverDto } from './vehicles.types';

/**
 * GET /api/v1/admin/vehicles
 * Admin JWT required.
 */
export async function listVehicles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const vehicles = await vehiclesService.listVehicles();
        sendSuccess(res, vehicles, 'Vehicles retrieved');
    } catch (err) {
        next(err);
    }
}

/**
 * PATCH /api/v1/admin/vehicles/:id/assign-driver
 * Admin JWT required. { driver_id: string } assigns, { driver_id: null } unassigns.
 */
export async function assignDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { driver_id } = req.body as AssignDriverDto;

    try {
        const vehicle = await vehiclesService.assignDriverToVehicle(req.params.id, driver_id ?? null);
        sendSuccess(res, vehicle, driver_id ? 'Driver assigned' : 'Driver unassigned');
    } catch (err) {
        next(err);
    }
}
