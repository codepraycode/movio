import { Router } from 'express';
import { authenticateBoarding } from './boarding.controller';

const router = Router();

// See boarding.controller.ts for the note on device-level auth being a TODO
router.post('/authenticate', authenticateBoarding);

export default router;
