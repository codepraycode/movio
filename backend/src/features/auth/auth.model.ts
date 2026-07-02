import type { PoolClient } from 'pg';
import { query, pool } from '../../config/db';
import type { User, UserRole } from '../../types';

export { pool };

export async function findUserByEmail(email: string): Promise<User | undefined> {
    const result = await query<User>('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
}

export type NewUserInput = Pick<User, 'matric_no' | 'first_name' | 'last_name' | 'email' | 'phone'> & {
    role: UserRole;
    passwordHash: string;
};

export type InsertedUser = Omit<User, 'password_hash'>;

export async function insertUser(client: PoolClient, data: NewUserInput): Promise<InsertedUser> {
    const result = await client.query<InsertedUser>(
        `INSERT INTO users (matric_no, first_name, last_name, email, phone, role, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING user_id, matric_no, first_name, last_name, email, phone, role, created_at`,
        [data.matric_no, data.first_name, data.last_name, data.email, data.phone, data.role, data.passwordHash]
    );
    return result.rows[0];
}

export async function insertWallet(client: PoolClient, userId: string): Promise<void> {
    // Every student gets a wallet at zero balance on registration
    await client.query(
        `INSERT INTO transit_wallets (user_id, balance_credits) VALUES ($1, 0)`,
        [userId]
    );
}
