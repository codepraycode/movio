import type { Response } from 'express';

export interface ApiSuccessBody<T> {
    success: true;
    message: string;
    data: T;
}

export interface ApiErrorBody {
    success: false;
    message: string;
    errors?: unknown;
}

/** Every successful response in this API is shaped the same way. */
export function sendSuccess<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200
): Response<ApiSuccessBody<T>> {
    return res.status(statusCode).json({ success: true, message, data });
}
