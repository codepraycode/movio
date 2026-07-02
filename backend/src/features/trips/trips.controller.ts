import type { Request, Response, NextFunction } from 'express';
import * as tripsService from './trips.service';
import { sendSuccess } from '../../shared/utils/ApiResponse';
import type { TripStartDto } from './trips.types';

/**
 * POST /api/v1/trips/start
 * req.body is a validated TripStartDto - see trips.routes.ts's
 * validateDto(TripStartDto) middleware. Driver JWT required.
 */
export async function startTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { vehicle_id, route_id, device_id } = req.body as TripStartDto;

    try {
        const trip = await tripsService.startTrip(req.user!.user_id, vehicle_id, route_id, device_id);
        sendSuccess(res, trip, 'Trip started', 201);
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/v1/trips/:id/end
 * Driver JWT required - only the driver who started the trip can end it.
 */
export async function endTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const trip = await tripsService.endTrip(req.params.id, req.user!.user_id);
        sendSuccess(res, trip, 'Trip ended');
    } catch (err) {
        next(err);
    }
}
