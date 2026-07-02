import type { Request, Response, NextFunction } from 'express';
import * as vehiclesService from './vehicles.service';
import { sendSuccess } from '../../shared/utils/ApiResponse';
import type { AssignDriverDto, CreateVehicleDto, UpdateVehicleDto } from './vehicles.types';

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

/**
 * POST /api/v1/admin/vehicles
 * Admin JWT required.
 */
export async function createVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { plate_number, vehicle_type, capacity, is_active } = req.body as CreateVehicleDto;

    try {
        const vehicle = await vehiclesService.createVehicle(
            plate_number,
            vehicle_type,
            capacity,
            is_active ?? true
        );
        sendSuccess(res, vehicle, 'Vehicle created', 201);
    } catch (err) {
        next(err);
    }
}

/**
 * PATCH /api/v1/admin/vehicles/:id
 * Admin JWT required. Also how a vehicle is deactivated - PATCH { is_active: false }, not deleted.
 */
export async function updateVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { plate_number, vehicle_type, capacity, is_active } = req.body as UpdateVehicleDto;

    try {
        const vehicle = await vehiclesService.updateVehicle(req.params.id, {
            plate_number,
            vehicle_type,
            capacity,
            is_active,
        });
        sendSuccess(res, vehicle, 'Vehicle updated');
    } catch (err) {
        next(err);
    }
}
