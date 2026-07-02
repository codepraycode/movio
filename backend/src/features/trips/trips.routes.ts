import { Router } from 'express';
import { startTrip, endTrip, listTrips } from './trips.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { validateDto } from '../../shared/middlewares/validate.middleware';
import { TripStartDto } from './trips.types';

// Driver-facing router, mounted at /api/v1/trips in app.ts
const router = Router();

router.post('/start', requireAuth, requireRole('driver'), validateDto(TripStartDto), startTrip);
router.post('/:id/end', requireAuth, requireRole('driver'), endTrip);

export default router;

// Admin-facing router, mounted at /api/v1/admin/trips in app.ts.
// Kept in this feature module rather than a separate `admin` feature folder,
// same pattern as adminComplaintsRouter/adminReportsRouter.
export const adminTripsRouter = Router();
adminTripsRouter.get('/', requireAuth, requireRole('admin'), listTrips);
