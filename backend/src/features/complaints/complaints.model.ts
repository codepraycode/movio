import { query } from '../../config/db';
import type { Complaint, ComplaintStatus } from '../../types';
import type { ComplaintWithStudent } from './complaints.types';

export async function insertComplaint(
    studentId: string,
    description: string,
    tripId: string | null
): Promise<Complaint> {
    const result = await query<Complaint>(
        `INSERT INTO complaints (student_id, trip_id, description)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [studentId, tripId, description]
    );
    return result.rows[0];
}

export async function findComplaints(status?: ComplaintStatus): Promise<ComplaintWithStudent[]> {
    const result = await query<ComplaintWithStudent>(
        `SELECT c.*, u.first_name, u.last_name
         FROM complaints c
         JOIN users u ON u.user_id = c.student_id
         ${status ? 'WHERE c.status = $1' : ''}
         ORDER BY c.created_at DESC`,
        status ? [status] : []
    );
    return result.rows;
}

export async function updateComplaintStatus(
    complaintId: string,
    status: ComplaintStatus
): Promise<Complaint | undefined> {
    const result = await query<Complaint>(
        `UPDATE complaints SET status = $1 WHERE complaint_id = $2 RETURNING *`,
        [status, complaintId]
    );
    return result.rows[0];
}
