import type { Request, Response, NextFunction } from 'express';
import * as routesService from './routes.service';
import { sendSuccess } from '../../shared/utils/ApiResponse';
import type { CreateRouteDto, UpdateRouteDto } from './routes.types';

/**
 * POST /api/v1/admin/routes
 * req.body is a validated CreateRouteDto - see routes.routes.ts's
 * validateDto(CreateRouteDto) middleware. Admin JWT required.
 */
export async function createRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { route_name, stops } = req.body as CreateRouteDto;

    try {
        const route = await routesService.createRoute(route_name, stops);
        sendSuccess(res, route, 'Route created', 201);
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/v1/admin/routes
 * Admin JWT required.
 */
export async function listRoutes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const routes = await routesService.listRoutes();
        sendSuccess(res, routes, 'Routes retrieved');
    } catch (err) {
        next(err);
    }
}

/**
 * PATCH /api/v1/admin/routes/:id
 * req.body is a validated UpdateRouteDto. Admin JWT required.
 */
export async function updateRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { route_name, stops, is_active } = req.body as UpdateRouteDto;

    try {
        const route = await routesService.updateRoute(req.params.id, { route_name, stops, is_active });
        sendSuccess(res, route, 'Route updated');
    } catch (err) {
        next(err);
    }
}
