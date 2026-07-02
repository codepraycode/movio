import { DatabaseError } from 'pg';
import * as vehiclesModel from './vehicles.model';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors';
import type { Vehicle, VehicleType } from '../../types';
import type { VehiclePatch } from './vehicles.model';
import type { VehicleWithDriver } from './vehicles.types';

export async function listVehicles(): Promise<VehicleWithDriver[]> {
    return vehiclesModel.listVehiclesWithDriver();
}

export async function assignDriverToVehicle(
    vehicleId: string,
    driverId: string | null
): Promise<VehicleWithDriver> {
    if (driverId) {
        const role = await vehiclesModel.findUserRole(driverId);
        if (!role) {
            throw new BadRequestError('driver_id does not reference an existing user');
        }
        if (role !== 'driver') {
            throw new BadRequestError('driver_id must reference a user with role=driver');
        }
    }

    const updated = await vehiclesModel.assignDriver(vehicleId, driverId);
    if (!updated) {
        throw new NotFoundError('Vehicle not found');
    }

    return (await vehiclesModel.findVehicleWithDriverById(vehicleId))!;
}

export async function createVehicle(
    plateNumber: string,
    vehicleType: VehicleType,
    capacity: number,
    isActive: boolean
): Promise<Vehicle> {
    try {
        return await vehiclesModel.insertVehicle(plateNumber, vehicleType, capacity, isActive);
    } catch (err) {
        if (err instanceof DatabaseError && err.code === '23505') {
            // unique_violation on plate_number
            throw new ConflictError('A vehicle with this plate number already exists');
        }
        throw err;
    }
}

export async function updateVehicle(vehicleId: string, patch: VehiclePatch): Promise<VehicleWithDriver> {
    try {
        const updated = await vehiclesModel.updateVehicle(vehicleId, patch);
        if (!updated) {
            throw new NotFoundError('Vehicle not found');
        }
    } catch (err) {
        if (err instanceof DatabaseError && err.code === '23505') {
            throw new ConflictError('A vehicle with this plate number already exists');
        }
        throw err;
    }

    return (await vehiclesModel.findVehicleWithDriverById(vehicleId))!;
}
