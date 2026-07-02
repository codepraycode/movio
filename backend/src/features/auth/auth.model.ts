import type { PoolClient } from 'pg';
import { query, pool } from '../../config/db';

export { pool };

export async function findUserByEmail(email: string): Promise<Record<string, unknown> | undefined> {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
}

export async function insertUser(
    client: PoolClient,
    data: {
        matric_no: string | null;
        first_name: string;
        last_name: string;
        email: string;
        phone: string | null;
        role: string;
        passwordHash: string;
    }
): Promise<Record<string, unknown>> {
    const result = await client.query(
        `INSERT INTO users (matric_no, first_name, last_name, email, phone, role, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING user_id, matric_no, first_name, last_name, email, role, created_at`,
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
