import type { Request, Response, NextFunction } from 'express';
import {
    recordLocationUpdate,
    getActiveTripsWithLocation,
    getPublicActiveTrips,
} from './tracking.service';
import { emitLocationUpdate } from './tracking.socket';
import { sendSuccess } from '../../shared/utils/ApiResponse';
import type { LocationUpdateDto } from './tracking.types';

/**
 * POST /api/v1/tracking/update
 * Called by the TapTrace device (or the simulator) every ~5 seconds during an
 * active trip. Stores the reading and broadcasts it to connected clients.
 * req.body is a validated LocationUpdateDto by the time it gets here - see
 * tracking.routes.ts's validateDto(LocationUpdateDto) middleware.
 */
export async function updateLocation(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const { trip_id, latitude, longitude } = req.body as LocationUpdateDto;

    try {
        const update = await recordLocationUpdate(trip_id, latitude, longitude);
        emitLocationUpdate(req.app.get('io'), update);

        sendSuccess(res, update, 'Location recorded', 201);
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/v1/tracking/active
 * Returns all currently active trips with their most recent location.
 */
export async function getActiveTrips(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const trips = await getActiveTripsWithLocation();
        sendSuccess(res, trips, 'Active trips retrieved');
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/v1/tracking/public/active
 * Unauthenticated variant for the public website live map. Same active trips,
 * but with the driver's name removed (see findPublicActiveTrips). No auth here
 * by design - the campus live map is public-facing on the website.
 */
export async function getPublicActiveTripsController(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const trips = await getPublicActiveTrips();
        sendSuccess(res, trips, 'Active trips retrieved');
    } catch (err) {
        next(err);
    }
}
