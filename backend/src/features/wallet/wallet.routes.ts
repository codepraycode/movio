import { Router } from 'express';
import { topupCash } from './wallet.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { validateDto } from '../../shared/middlewares/validate.middleware';
import { TopupCashDto } from './wallet.types';

const router = Router();

router.post('/topup-cash', requireAuth, requireRole('transport_personnel'), validateDto(TopupCashDto), topupCash);

export default router;
