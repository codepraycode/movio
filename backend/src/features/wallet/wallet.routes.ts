import { Router } from 'express';
import {
    topupCash,
    getMyWallet,
    getMyTransactions,
    initiateAppTopupController,
    verifyAppTopupController,
} from './wallet.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { validateDto } from '../../shared/middlewares/validate.middleware';
import { InitiateAppTopupDto, TopupCashDto, VerifyAppTopupDto } from './wallet.types';

const router = Router();

// The logged-in student's own balance (any authenticated user).
router.get('/', requireAuth, getMyWallet);

// The logged-in user's own credit transaction history.
router.get('/transactions', requireAuth, getMyTransactions);

router.post('/topup-cash', requireAuth, requireRole('transport_personnel'), validateDto(TopupCashDto), topupCash);

// Website (no login) Paystack top-up — deposit-only by design. Looking up by
// matric/email has no verification step; the worst case is a *misdirected*
// top-up (a deposit into the wrong wallet), not any data exposure — the lookup
// only ever returns a first name. See website plan §D and backend/README.md.
router.post('/topup-app/initiate', validateDto(InitiateAppTopupDto), initiateAppTopupController);
router.post('/topup-app/verify', validateDto(VerifyAppTopupDto), verifyAppTopupController);

export default router;
