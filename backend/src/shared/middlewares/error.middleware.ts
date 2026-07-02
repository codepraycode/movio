import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError';
import { ValidationError } from '../errors/ValidationError';
import { logger } from '../utils/logger';
import type { ApiErrorBody } from '../utils/ApiResponse';

// Centralized error handler. Any route can call next(err) and it lands here.
// Express detects error middleware by function arity - it MUST declare all 4
// params (err, req, res, next), even though next is unused, or Express treats
// this as regular middleware, next(err) never reaches it, and every error
// falls through to Express's own default HTML error page instead of JSON.
const errorHandler: ErrorRequestHandler = (err: Error, _req, res, _next) => {
    const status = err instanceof AppError ? err.status : 500;

    if (status >= 500) {
        logger.error(err);
    } else {
        logger.warn(err.message);
    }

    const body: ApiErrorBody = {
        success: false,
        message: err.message || 'Internal server error',
        ...(err instanceof ValidationError ? { errors: err.details } : {}),
    };

    res.status(status).json(body);
};

export default errorHandler;
