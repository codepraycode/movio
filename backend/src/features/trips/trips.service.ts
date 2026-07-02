import { DatabaseError } from 'pg';
import * as tripsModel from './trips.model';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors';
import type { Trip } from '../../types';
import type { TripMonitorRow } from './trips.types';

export async function startTrip(
    driverId: string,
    vehicleId: string,
    routeId?: string,
    deviceId?: string
): Promise<Trip> {
    const activeTrip = await tripsModel.findActiveTripByVehicle(vehicleId);
    if (activeTrip) {
        throw new ConflictError('This vehicle already has an active trip');
    }

    try {
        return await tripsModel.insertTrip(driverId, vehicleId, routeId ?? null, deviceId ?? null);
    } catch (err) {
        if (err instanceof DatabaseError && err.code === '23503') {
            // foreign_key_violation
            throw new BadRequestError('vehicle_id, route_id, or device_id does not reference an existing record');
        }
        throw err;
    }
}

export async function endTrip(tripId: string, driverId: string): Promise<Trip> {
    const trip = await tripsModel.findTripById(tripId);
    if (!trip) {
        throw new NotFoundError('Trip not found');
    }
    if (trip.driver_id !== driverId) {
        throw new ForbiddenError('You can only end a trip you started');
    }
    if (trip.status !== 'active') {
        throw new ConflictError('Trip is not active');
    }

    return tripsModel.endTrip(tripId);
}

export async function listTrips(): Promise<TripMonitorRow[]> {
    return tripsModel.listTripsWithPassengerCounts();
}
