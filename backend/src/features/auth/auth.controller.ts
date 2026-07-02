import type { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser } from './auth.service';
import type { RegisterRequestBody, LoginRequestBody } from './auth.types';

/**
 * POST /api/v1/auth/register
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
    const body = req.body as Partial<RegisterRequestBody>;
    if (!body.first_name || !body.last_name || !body.email || !body.password) {
        res.status(400).json({ error: 'first_name, last_name, email and password are required' });
        return;
    }

    try {
        const result = await registerUser(body as RegisterRequestBody);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/v1/auth/login
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const body = req.body as Partial<LoginRequestBody>;
    if (!body.email || !body.password) {
        res.status(400).json({ error: 'email and password are required' });
        return;
    }

    try {
        const result = await loginUser(body as LoginRequestBody);
        res.json(result);
    } catch (err) {
        next(err);
    }
}
