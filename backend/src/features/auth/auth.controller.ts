import type { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser } from './auth.service';
import { sendSuccess } from '../../shared/utils/ApiResponse';
import type { RegisterDto, LoginDto } from './auth.types';

/**
 * POST /api/v1/auth/register
 * req.body is a validated RegisterDto by the time it gets here - see
 * auth.routes.ts's validateDto(RegisterDto) middleware.
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const result = await registerUser(req.body as RegisterDto);
        sendSuccess(res, result, 'User registered successfully', 201);
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/v1/auth/login
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const result = await loginUser(req.body as LoginDto);
        sendSuccess(res, result, 'Login successful');
    } catch (err) {
        next(err);
    }
}
