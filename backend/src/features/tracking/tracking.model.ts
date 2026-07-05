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

// passenger_count is live occupancy (boarded, not yet alighted), not total
// boardings - the ridership report is what counts total boardings.
const ACTIVE_TRIP_SELECT = `
    SELECT
        t.trip_id, t.status, t.start_time,
        v.plate_number, v.vehicle_type, v.capacity,
        r.route_name,
        u.first_name AS driver_first_name,
        u.last_name  AS driver_last_name,
        (
            SELECT COUNT(*)::int
            FROM boarding_events be
            WHERE be.trip_id = t.trip_id AND be.alighted_at IS NULL
        ) AS passenger_count,
        lu.latitude, lu.longitude, lu.recorded_at AS last_location_at
    FROM trips t
    JOIN vehicles v ON v.vehicle_id = t.vehicle_id
    JOIN users u ON u.user_id = t.driver_id
    LEFT JOIN routes r ON r.route_id = t.route_id
    LEFT JOIN LATERAL (
        SELECT latitude, longitude, recorded_at
        FROM location_updates
        WHERE trip_id = t.trip_id
        ORDER BY recorded_at DESC
        LIMIT 1
    ) lu ON true
    WHERE t.status = 'active'
`;

export async function findActiveTripsWithLastLocation(): Promise<ActiveTripRow[]> {
    const result = await query<ActiveTripRow>(`${ACTIVE_TRIP_SELECT} ORDER BY t.start_time DESC`);
    return result.rows;
}

/** One active trip in the same shape as the list - the `trip:started` broadcast payload. */
export async function findActiveTripRowById(tripId: string): Promise<ActiveTripRow | undefined> {
    const result = await query<ActiveTripRow>(`${ACTIVE_TRIP_SELECT} AND t.trip_id = $1`, [tripId]);
    return result.rows[0];
}
