import express from 'express';
import { coreMiddlewares } from './shared/middlewares/core.middleware';
import errorHandler from './shared/middlewares/error.middleware';
import authRoutes from './features/auth/auth.routes';
import boardingRoutes from './features/boarding/boarding.routes';
import trackingRoutes from './features/tracking/tracking.routes';

const app = express();

app.use(coreMiddlewares);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'movio-backend' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/boarding', boardingRoutes);
app.use('/api/v1/tracking', trackingRoutes);

app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});
app.use(errorHandler);

export default app;
