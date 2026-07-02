import { query } from '../../config/db';
import type { Route, RouteStop } from '../../types';

export async function insertRoute(routeName: string, stops: RouteStop[]): Promise<Route> {
    const result = await query<Route>(
        `INSERT INTO routes (route_name, stops)
         VALUES ($1, $2::jsonb)
         RETURNING *`,
        [routeName, JSON.stringify(stops)]
    );
    return result.rows[0];
}

export async function listRoutes(): Promise<Route[]> {
    const result = await query<Route>(`SELECT * FROM routes ORDER BY route_name`);
    return result.rows;
}

export async function findRouteById(routeId: string): Promise<Route | undefined> {
    const result = await query<Route>(`SELECT * FROM routes WHERE route_id = $1`, [routeId]);
    return result.rows[0];
}

export interface RoutePatch {
    route_name?: string;
    stops?: RouteStop[];
    is_active?: boolean;
}

export async function updateRoute(routeId: string, patch: RoutePatch): Promise<Route | undefined> {
    const result = await query<Route>(
        `UPDATE routes SET
            route_name = COALESCE($1, route_name),
            stops = COALESCE($2::jsonb, stops),
            is_active = COALESCE($3, is_active)
         WHERE route_id = $4
         RETURNING *`,
        [patch.route_name ?? null, patch.stops ? JSON.stringify(patch.stops) : null, patch.is_active ?? null, routeId]
    );
    return result.rows[0];
}
