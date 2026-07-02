import * as routesModel from './routes.model';
import { NotFoundError } from '../../shared/errors';
import type { Route, RouteStop } from '../../types';
import type { RoutePatch } from './routes.model';

export async function createRoute(routeName: string, stops: RouteStop[]): Promise<Route> {
    return routesModel.insertRoute(routeName, stops);
}

export async function listRoutes(): Promise<Route[]> {
    return routesModel.listRoutes();
}

export async function updateRoute(routeId: string, patch: RoutePatch): Promise<Route> {
    const updated = await routesModel.updateRoute(routeId, patch);
    if (!updated) {
        throw new NotFoundError('Route not found');
    }
    return updated;
}
