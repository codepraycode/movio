import type { Request, Response, NextFunction } from 'express';
import { authenticateBoarding as runBoardingAuth } from './boarding.service';
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
        sendSuccess(res, result, 'Boarding attempt processed');
    } catch (err) {
        next(err);
    }
}
