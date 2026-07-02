import type { Request, Response, NextFunction } from 'express';
import { getRidershipReport as runGetRidershipReport } from './reports.service';
import { sendSuccess } from '../../shared/utils/ApiResponse';

/**
 * GET /api/v1/admin/reports/ridership?groupBy=route|vehicle|day
 * Admin JWT required.
 */
export async function getRidershipReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    const groupBy = typeof req.query.groupBy === 'string' ? req.query.groupBy : undefined;

    try {
        const report = await runGetRidershipReport(groupBy);
        sendSuccess(res, report, 'Ridership report retrieved');
    } catch (err) {
        next(err);
    }
}
