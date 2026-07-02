import type { UserRole } from '../../types';

export interface UserSummary {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: UserRole;
}
