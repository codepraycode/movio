import { Router } from 'express';
import { authenticateBoarding } from './boarding.controller';
import { validateDto } from '../../shared/middlewares/validate.middleware';
import { BoardingDto } from './boarding.types';

const router = Router();

// See boarding.controller.ts for the note on device-level auth being a TODO
router.post('/authenticate', validateDto(BoardingDto), authenticateBoarding);

export default router;
