import type { Request, Response, NextFunction } from 'express';
import { authenticateBoarding as runBoardingAuth } from './boarding.service';
import { countOnboard } from './boarding.model';
import { emitPassengerUpdate } from './boarding.socket';
import { sendSuccess } from '../../shared/utils/ApiResponse';
import type { BoardingDto } from './boarding.types';

/**
 * POST /api/v1/boarding/authenticate
 * req.body is a validated BoardingDto by the time it gets here - see
 * boarding.routes.ts's validateDto(BoardingDto) middleware.
 *
 * NOTE: this route is deliberately NOT behind requireAuth with a student JWT -
 * the student isn't logged into anything at the point of boarding, the reader
 * device is the caller. In production this should instead be authenticated with
 * a device-level API key/secret per TapTrace unit. That's a TODO - flag it in
 * Chapter 4 as a known security follow-up, don't silently ship it unauthenticated.
 */
export async function authenticateBoarding(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const { uid, trip_id, latitude, longitude } = req.body as BoardingDto;

    try {
        const result = await runBoardingAuth(uid, trip_id, latitude, longitude);

        // Successful tap-in/tap-out changes the trip's live occupancy - push the
        // fresh count to connected clients (mobile map info sheet, dashboard).
        if (result.success && result.action) {
            const passengerCount = await countOnboard(trip_id);
            emitPassengerUpdate(req.app.get('io'), {
                trip_id,
                passenger_count: passengerCount,
                action: result.action,
                student_name: result.student_name,
            });
        }

        sendSuccess(res, result, 'Boarding attempt processed');
    } catch (err) {
        next(err);
    }
}
