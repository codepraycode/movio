import type { Request, Response, NextFunction } from 'express';
import {
    topupCash as runTopupCash,
    getWalletBalance,
    getTransactionHistory,
    initiateAppTopup,
    verifyAppTopup,
} from './wallet.service';
import { sendSuccess } from '../../shared/utils/ApiResponse';
import type { InitiateAppTopupDto, TopupCashDto, VerifyAppTopupDto } from './wallet.types';

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

/**
 * POST /api/v1/wallet/topup-app/initiate  (public — no login)
 * Step 1 of the website top-up: identify the account by matric/email and get a
 * Paystack access_code back. req.body is a validated InitiateAppTopupDto.
 */
export async function initiateAppTopupController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const { identifier, amount_naira } = req.body as InitiateAppTopupDto;

    try {
        const result = await initiateAppTopup(identifier, amount_naira);
        sendSuccess(res, result, 'Top-up initiated');
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/v1/wallet/topup-app/verify  (public — no login)
 * Step 2: after the Paystack popup succeeds, re-verify server-side and credit
 * the wallet exactly once. req.body is a validated VerifyAppTopupDto.
 */
export async function verifyAppTopupController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const { reference } = req.body as VerifyAppTopupDto;

    try {
        const result = await verifyAppTopup(reference);
        sendSuccess(res, result, 'Top-up verified');
    } catch (err) {
        next(err);
    }
}
