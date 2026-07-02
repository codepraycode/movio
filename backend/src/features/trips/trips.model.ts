import { query } from '../../config/db';
import type { Trip } from '../../types';
import type { TripMonitorRow } from './trips.types';

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

/**
 * Active + recently completed trips with a live passenger count (boarding_events
 * per trip). Backs the Trip Monitoring dashboard view (PSD-99/FE-8).
 */
export async function listTripsWithPassengerCounts(): Promise<TripMonitorRow[]> {
    const result = await query<TripMonitorRow>(`
        SELECT
            t.trip_id, t.status, t.start_time, t.end_time,
            v.plate_number, v.vehicle_type,
            r.route_name,
            u.first_name AS driver_first_name, u.last_name AS driver_last_name,
            COUNT(be.event_id)::int AS passenger_count
        FROM trips t
        JOIN vehicles v ON v.vehicle_id = t.vehicle_id
        JOIN users u ON u.user_id = t.driver_id
        LEFT JOIN routes r ON r.route_id = t.route_id
        LEFT JOIN boarding_events be ON be.trip_id = t.trip_id
        GROUP BY t.trip_id, v.plate_number, v.vehicle_type, r.route_name, u.first_name, u.last_name
        ORDER BY t.start_time DESC
        LIMIT 50
    `);
    return result.rows;
}
