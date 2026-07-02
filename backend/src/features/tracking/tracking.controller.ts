import type { Request, Response, NextFunction } from 'express';
import { recordLocationUpdate, getActiveTripsWithLocation } from './tracking.service';
import { emitLocationUpdate } from './tracking.socket';
import type { LocationUpdateBody } from './tracking.types';

/**
 * POST /api/v1/tracking/update
 * Called by the TapTrace device (or the simulator) every ~5 seconds during an
 * active trip. Stores the reading and broadcasts it to connected clients.
 */
export async function updateLocation(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const { trip_id, latitude, longitude } = req.body as Partial<LocationUpdateBody>;
    if (!trip_id || latitude === undefined || longitude === undefined) {
        res.status(400).json({ error: 'trip_id, latitude and longitude are required' });
        return;
    }

    try {
        const update = await recordLocationUpdate(trip_id, latitude, longitude);
        emitLocationUpdate(req.app.get('io'), update);

        res.status(201).json(update);
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
        res.json(trips);
    } catch (err) {
        next(err);
    }
}
