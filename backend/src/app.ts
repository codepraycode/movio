import express from 'express';
import { logger } from './shared/utils/logger';
import { coreMiddlewares } from './shared/middlewares/core.middleware';
import errorHandler from './shared/middlewares/error.middleware';
import { getHealthStatus } from './shared/utils/health';
import authRoutes from './features/auth/auth.routes';
import boardingRoutes from './features/boarding/boarding.routes';
import trackingRoutes from './features/tracking/tracking.routes';
import walletRoutes from './features/wallet/wallet.routes';
import complaintsRoutes, { adminComplaintsRouter } from './features/complaints/complaints.routes';
import tripsRoutes, { adminTripsRouter } from './features/trips/trips.routes';
import { adminReportsRouter } from './features/reports/reports.routes';
import { adminVehiclesRouter } from './features/vehicles/vehicles.routes';
import { adminUsersRouter } from './features/users/users.routes';
import { adminRoutesRouter } from './features/routes/routes.routes';

const app = express();

logger.debug('Initializing Express application');
app.use(coreMiddlewares);
logger.debug('Core middlewares loaded');

app.get('/health', async (_req, res) => {
    const { statusCode, body } = await getHealthStatus();
    res.status(statusCode).json(body);
});
logger.debug('Health check endpoint mounted');

// Public API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/boarding', boardingRoutes);
app.use('/api/v1/tracking', trackingRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/complaints', complaintsRoutes);
logger.debug('Public routes mounted');

// Admin API routes
app.use('/api/v1/admin/complaints', adminComplaintsRouter);
app.use('/api/v1/admin/reports', adminReportsRouter);
app.use('/api/v1/admin/vehicles', adminVehiclesRouter);
app.use('/api/v1/admin/users', adminUsersRouter);
app.use('/api/v1/admin/routes', adminRoutesRouter);
app.use('/api/v1/admin/trips', adminTripsRouter);
app.use('/api/v1/trips', tripsRoutes);
logger.debug('Admin routes mounted');

app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
});
app.use(errorHandler);
logger.debug('Error handler middleware registered');

export default app;
