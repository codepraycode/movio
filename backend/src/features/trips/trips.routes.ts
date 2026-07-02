import { Router } from 'express';
import { startTrip, endTrip } from './trips.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { validateDto } from '../../shared/middlewares/validate.middleware';
import { TripStartDto } from './trips.types';

const router = Router();

router.post('/start', requireAuth, requireRole('driver'), validateDto(TripStartDto), startTrip);
router.post('/:id/end', requireAuth, requireRole('driver'), endTrip);

export default router;
