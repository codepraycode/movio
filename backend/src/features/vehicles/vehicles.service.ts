import * as vehiclesModel from './vehicles.model';
import { BadRequestError, NotFoundError } from '../../shared/errors';
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
