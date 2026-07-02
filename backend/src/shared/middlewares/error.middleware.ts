import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError';

// Centralized error handler. Any route can call next(err) and it lands here.
const errorHandler: ErrorRequestHandler = (err: Error, _req, res) => {
    console.error(err);
    const status = err instanceof AppError ? err.status : 500;
    res.status(status).json({
        error: err.message || 'Internal server error',
    });
};

export default errorHandler;
