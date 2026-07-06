import type { Request, Response, NextFunction } from 'express';
import { topupCash as runTopupCash, getWalletBalance, getTransactionHistory } from './wallet.service';
import { sendSuccess } from '../../shared/utils/ApiResponse';
import type { TopupCashDto } from './wallet.types';

/**
 * GET /api/v1/wallet/transactions
 * The authenticated user's own credit transaction history (top-ups in,
 * boarding deductions out) — the mobile credit-history screen.
 */
export async function getMyTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const transactions = await getTransactionHistory(req.user!.user_id);
        sendSuccess(res, transactions, 'Transaction history retrieved');
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/v1/wallet
 * The authenticated student's own wallet balance. `req.user` is set by
 * requireAuth (see wallet.routes.ts).
 */
export async function getMyWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const wallet = await getWalletBalance(req.user!.user_id);
        sendSuccess(res, wallet, 'Wallet balance retrieved');
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/v1/wallet/topup-cash
 * req.body is a validated TopupCashDto by the time it gets here - see
 * wallet.routes.ts's validateDto(TopupCashDto) middleware. requireRole
 * ensures only transport_personnel can reach this handler.
 */
export async function topupCash(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { user_id, amount } = req.body as TopupCashDto;

    try {
        const result = await runTopupCash(user_id, amount, req.user!.user_id);
        sendSuccess(res, result, 'Wallet topped up');
    } catch (err) {
        next(err);
    }
}
