import { query } from '../../config/db';
import type { UserRole } from '../../types';
import type { UserSummary } from './users.types';

export async function listUsersByRole(role?: UserRole): Promise<UserSummary[]> {
    const result = await query<UserSummary>(
        `SELECT user_id, first_name, last_name, email, role
         FROM users
         ${role ? 'WHERE role = $1' : ''}
         ORDER BY first_name, last_name`,
        role ? [role] : []
    );
    return result.rows;
}
