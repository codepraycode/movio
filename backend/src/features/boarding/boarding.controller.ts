import type { Request, Response, NextFunction } from 'express';
import { authenticateBoarding as runBoardingAuth } from './boarding.service';
import type { BoardingRequestBody } from './boarding.types';

/**
 * POST /api/v1/boarding/authenticate
 *
 * Expected body: { uid, trip_id, latitude, longitude }
 * uid = the NFC UID read from the card/phone by the reader
 * trip_id = the active trip the TapTrace device is currently attached to
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
    const { uid, trip_id, latitude, longitude } = req.body as Partial<BoardingRequestBody>;
    if (!uid || !trip_id) {
        res.status(400).json({ error: 'uid and trip_id are required' });
        return;
    }

    try {
        const result = await runBoardingAuth(uid, trip_id, latitude, longitude);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}
