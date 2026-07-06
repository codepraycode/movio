import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware';
import {
    updateLocation,
    getActiveTrips,
    getPublicActiveTripsController,
} from './tracking.controller';
import { validateDto } from '../../shared/middlewares/validate.middleware';
import { LocationUpdateDto } from './tracking.types';

const router = Router();

router.post('/update', validateDto(LocationUpdateDto), updateLocation); // called by TapTrace device / simulator
router.get('/public/active', getPublicActiveTripsController); // called by the public website live map (no auth, driver-anonymised)
router.get('/active', requireAuth, getActiveTrips); // called by student app / dashboard

export default router;
