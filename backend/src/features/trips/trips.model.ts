import { query } from '../../config/db';
import type { Trip } from '../../types';

export async function findActiveTripByVehicle(vehicleId: string): Promise<Trip | undefined> {
    const result = await query<Trip>(`SELECT * FROM trips WHERE vehicle_id = $1 AND status = 'active'`, [
        vehicleId,
    ]);
    return result.rows[0];
}

export async function insertTrip(
    driverId: string,
    vehicleId: string,
    routeId: string | null,
    deviceId: string | null
): Promise<Trip> {
    const result = await query<Trip>(
        `INSERT INTO trips (vehicle_id, driver_id, route_id, device_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [vehicleId, driverId, routeId, deviceId]
    );
    return result.rows[0];
}

export async function findTripById(tripId: string): Promise<Trip | undefined> {
    const result = await query<Trip>(`SELECT * FROM trips WHERE trip_id = $1`, [tripId]);
    return result.rows[0];
}

export async function endTrip(tripId: string): Promise<Trip> {
    const result = await query<Trip>(
        `UPDATE trips SET status = 'completed', end_time = now() WHERE trip_id = $1 RETURNING *`,
        [tripId]
    );
    return result.rows[0];
}
