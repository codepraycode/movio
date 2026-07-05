import type { Request, Response, NextFunction } from 'express';
import * as tripsService from './trips.service';
import { emitTripStarted, emitTripEnded } from './trips.socket';
import { findActiveTripRowById } from '../tracking/tracking.model';
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

        // Broadcast the new trip in the same shape GET /tracking/active returns,
        // so live map clients can show it without waiting for their next poll.
        const row = await findActiveTripRowById(trip.trip_id);
        if (row) emitTripStarted(req.app.get('io'), row);

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
        emitTripEnded(req.app.get('io'), trip.trip_id);
        sendSuccess(res, trip, 'Trip ended');
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/v1/admin/trips
 * Admin JWT required. Active + recently completed trips with passenger counts.
 */
export async function listTrips(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const trips = await tripsService.listTrips();
        sendSuccess(res, trips, 'Trips retrieved');
    } catch (err) {
        next(err);
    }
}
