import { query } from '../../config/db';
import type { RidershipByDay, RidershipByRoute, RidershipByVehicle } from './reports.types';

export async function ridershipByRoute(): Promise<RidershipByRoute[]> {
    const result = await query<RidershipByRoute>(`
        SELECT COALESCE(r.route_name, 'Unassigned') AS route_name, COUNT(*)::int AS boarding_count
        FROM boarding_events be
        JOIN trips t ON t.trip_id = be.trip_id
        LEFT JOIN routes r ON r.route_id = t.route_id
        GROUP BY r.route_name
        ORDER BY boarding_count DESC
    `);
    return result.rows;
}

export async function ridershipByVehicle(): Promise<RidershipByVehicle[]> {
    const result = await query<RidershipByVehicle>(`
        SELECT v.plate_number, COUNT(*)::int AS boarding_count
        FROM boarding_events be
        JOIN trips t ON t.trip_id = be.trip_id
        JOIN vehicles v ON v.vehicle_id = t.vehicle_id
        GROUP BY v.plate_number
        ORDER BY boarding_count DESC
    `);
    return result.rows;
}

export async function ridershipByDay(): Promise<RidershipByDay[]> {
    const result = await query<RidershipByDay>(`
        SELECT TO_CHAR(be.boarded_at, 'YYYY-MM-DD') AS day, COUNT(*)::int AS boarding_count
        FROM boarding_events be
        GROUP BY day
        ORDER BY day
    `);
    return result.rows;
}
