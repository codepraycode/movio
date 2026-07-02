import bcrypt from 'bcryptjs';
import { DatabaseError } from 'pg';
import * as authModel from './auth.model';
import { signToken } from '../../shared/utils/jwt';
import { AppError } from '../../shared/errors/AppError';
import type { RegisterRequestBody, LoginRequestBody, AuthResult } from './auth.types';

const SALT_ROUNDS = 10;

/**
 * Self-registration - primarily for students. Creates a user row and an
 * empty Transit Credit wallet in the same transaction.
 */
export async function registerUser(data: RegisterRequestBody): Promise<AuthResult> {
    const finalRole = data.role || 'student';
    if (finalRole === 'student' && !data.matric_no) {
        throw new AppError(400, 'matric_no is required for student registration');
    }

    const client = await authModel.pool.connect();
    try {
        await client.query('BEGIN');

        const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
        const user = await authModel.insertUser(client, {
            matric_no: data.matric_no || null,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone || null,
            role: finalRole,
            passwordHash,
        });

        if (finalRole === 'student') {
            await authModel.insertWallet(client, user.user_id as string);
        }

        await client.query('COMMIT');

        const token = signToken({ user_id: user.user_id as string, role: user.role as string });
        return { user, token };
    } catch (err) {
        await client.query('ROLLBACK');
        if (err instanceof DatabaseError && err.code === '23505') {
            // unique_violation - duplicate email or matric_no
            throw new AppError(409, 'A user with this email or matric number already exists');
        }
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Works for any role (student, driver, transport_personnel, admin).
 */
export async function loginUser({ email, password }: LoginRequestBody): Promise<AuthResult> {
    const user = await authModel.findUserByEmail(email);
    if (!user) {
        throw new AppError(401, 'Invalid email or password');
    }

    const match = await bcrypt.compare(password, user.password_hash as string);
    if (!match) {
        throw new AppError(401, 'Invalid email or password');
    }

    const token = signToken({ user_id: user.user_id as string, role: user.role as string });
    delete user.password_hash;
    return { user, token };
}
