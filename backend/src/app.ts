import express from 'express';
import { coreMiddlewares } from './shared/middlewares/core.middleware';
import errorHandler from './shared/middlewares/error.middleware';
import { getHealthStatus } from './shared/utils/health';
import authRoutes from './features/auth/auth.routes';
import boardingRoutes from './features/boarding/boarding.routes';
import trackingRoutes from './features/tracking/tracking.routes';
import walletRoutes from './features/wallet/wallet.routes';
import complaintsRoutes, { adminComplaintsRouter } from './features/complaints/complaints.routes';
import tripsRoutes from './features/trips/trips.routes';
import { adminReportsRouter } from './features/reports/reports.routes';

const app = express();

app.use(coreMiddlewares);

app.get('/health', async (_req, res) => {
    const { statusCode, body } = await getHealthStatus();
    res.status(statusCode).json(body);
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/boarding', boardingRoutes);
app.use('/api/v1/tracking', trackingRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/complaints', complaintsRoutes);
app.use('/api/v1/admin/complaints', adminComplaintsRouter);
app.use('/api/v1/trips', tripsRoutes);
app.use('/api/v1/admin/reports', adminReportsRouter);

app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
});
app.use(errorHandler);

export default app;
