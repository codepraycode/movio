import { query } from '../../config/db';
import type { Complaint, ComplaintCategory, ComplaintStatus } from '../../types';
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

/**
 * Website (no login) submission — student_id is null; traceability is the
 * contact email/phone. Also used by the account-deletion page (category).
 */
export async function insertGuestComplaint(
    description: string,
    tripId: string | null,
    contactEmail: string | null,
    contactPhone: string | null,
    category: ComplaintCategory
): Promise<Complaint> {
    const result = await query<Complaint>(
        `INSERT INTO complaints (student_id, trip_id, description, contact_email, contact_phone, category)
         VALUES (NULL, $1, $2, $3, $4, $5)
         RETURNING *`,
        [tripId, description, contactEmail, contactPhone, category]
    );
    return result.rows[0];
}

export async function findComplaints(status?: ComplaintStatus): Promise<ComplaintWithStudent[]> {
    // LEFT JOIN, not INNER: guest complaints have student_id = NULL and would
    // otherwise silently drop out of the admin list.
    const result = await query<ComplaintWithStudent>(
        `SELECT c.*, u.first_name, u.last_name
         FROM complaints c
         LEFT JOIN users u ON u.user_id = c.student_id
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
