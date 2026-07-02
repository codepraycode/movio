import express from 'express';
import { corsMiddleware, helmetMiddleware } from '../../config/security.config';
import { morganMiddleware } from './morgan.middleware';

// Baseline middleware every request passes through, applied in app.ts before routes.
export const coreMiddlewares = [
    helmetMiddleware,
    corsMiddleware,
    express.json(),
    morganMiddleware,
];
