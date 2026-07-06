import { Router } from 'express';
import { authenticateBoarding, getMyTrips } from './boarding.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { validateDto } from '../../shared/middlewares/validate.middleware';
import { BoardingDto } from './boarding.types';

const router = Router();

// See boarding.controller.ts for the note on device-level auth being a TODO
router.post('/authenticate', validateDto(BoardingDto), authenticateBoarding);

// A student's own boarding/trip history (mobile "My trips" screen).
router.get('/my-trips', requireAuth, requireRole('student'), getMyTrips);

export default router;
