import type { Request, Response, NextFunction } from 'express';
import * as complaintsService from './complaints.service';
import { sendSuccess } from '../../shared/utils/ApiResponse';
import type { CreateComplaintDto, UpdateComplaintStatusDto } from './complaints.types';

/**
 * POST /api/v1/complaints
 * req.body is a validated CreateComplaintDto - see complaints.routes.ts's
 * validateDto(CreateComplaintDto) middleware. Student JWT required.
 */
export async function createComplaint(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { description, trip_id } = req.body as CreateComplaintDto;

    try {
        const complaint = await complaintsService.createComplaint(req.user!.user_id, description, trip_id);
        sendSuccess(res, complaint, 'Complaint submitted', 201);
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/v1/admin/complaints?status=open
 * Admin JWT required.
 */
export async function listComplaints(req: Request, res: Response, next: NextFunction): Promise<void> {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;

    try {
        const complaints = await complaintsService.listComplaints(status);
        sendSuccess(res, complaints, 'Complaints retrieved');
    } catch (err) {
        next(err);
    }
}

/**
 * PATCH /api/v1/admin/complaints/:id
 * req.body is a validated UpdateComplaintStatusDto. Admin JWT required.
 */
export async function updateComplaintStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { status } = req.body as UpdateComplaintStatusDto;

    try {
        const complaint = await complaintsService.changeComplaintStatus(req.params.id, status);
        sendSuccess(res, complaint, 'Complaint status updated');
    } catch (err) {
        next(err);
    }
}
