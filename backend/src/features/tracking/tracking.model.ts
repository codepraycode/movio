import { query } from '../../config/db';
import type { LocationUpdateRow, ActiveTripRow } from './tracking.types';

export async function insertLocationUpdate(
    tripId: string,
    latitude: number,
    longitude: number
): Promise<LocationUpdateRow> {
    const result = await query<LocationUpdateRow>(
        `INSERT INTO location_updates (trip_id, latitude, longitude)
         VALUES ($1, $2, $3)
         RETURNING update_id, trip_id, latitude, longitude, recorded_at`,
        [tripId, latitude, longitude]
    );
    return result.rows[0];
}

export async function findActiveTripsWithLastLocation(): Promise<ActiveTripRow[]> {
    const result = await query<ActiveTripRow>(`
        SELECT
            t.trip_id, t.status, t.start_time,
            v.plate_number, v.vehicle_type,
            r.route_name,
            lu.latitude, lu.longitude, lu.recorded_at AS last_location_at
        FROM trips t
        JOIN vehicles v ON v.vehicle_id = t.vehicle_id
        LEFT JOIN routes r ON r.route_id = t.route_id
        LEFT JOIN LATERAL (
            SELECT latitude, longitude, recorded_at
            FROM location_updates
            WHERE trip_id = t.trip_id
            ORDER BY recorded_at DESC
            LIMIT 1
        ) lu ON true
        WHERE t.status = 'active'
        ORDER BY t.start_time DESC
    `);
    return result.rows;
}
