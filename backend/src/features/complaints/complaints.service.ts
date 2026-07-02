import * as complaintsModel from './complaints.model';
import { COMPLAINT_STATUSES } from '../../types';
import type { Complaint, ComplaintStatus } from '../../types';
import { BadRequestError, NotFoundError } from '../../shared/errors';
import type { ComplaintWithStudent } from './complaints.types';

export async function createComplaint(
    studentId: string,
    description: string,
    tripId?: string
): Promise<Complaint> {
    return complaintsModel.insertComplaint(studentId, description, tripId ?? null);
}

export async function listComplaints(status?: string): Promise<ComplaintWithStudent[]> {
    if (status !== undefined && !COMPLAINT_STATUSES.includes(status as ComplaintStatus)) {
        throw new BadRequestError(`Invalid status filter. Must be one of: ${COMPLAINT_STATUSES.join(', ')}`);
    }
    return complaintsModel.findComplaints(status as ComplaintStatus | undefined);
}

export async function changeComplaintStatus(complaintId: string, status: ComplaintStatus): Promise<Complaint> {
    const updated = await complaintsModel.updateComplaintStatus(complaintId, status);
    if (!updated) {
        throw new NotFoundError('Complaint not found');
    }
    return updated;
}
