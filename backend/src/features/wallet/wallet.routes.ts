import { Router } from 'express';
import { topupCash, getMyWallet, getMyTransactions } from './wallet.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { validateDto } from '../../shared/middlewares/validate.middleware';
import { TopupCashDto } from './wallet.types';

const router = Router();

// The logged-in student's own balance (any authenticated user).
router.get('/', requireAuth, getMyWallet);

// The logged-in user's own credit transaction history.
router.get('/transactions', requireAuth, getMyTransactions);

router.post('/topup-cash', requireAuth, requireRole('transport_personnel'), validateDto(TopupCashDto), topupCash);

export default router;
