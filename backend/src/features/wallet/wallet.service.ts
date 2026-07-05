import * as walletModel from './wallet.model';
import { NotFoundError } from '../../shared/errors';
import type { WalletBalance } from './wallet.model';
import type { TopupCashResult } from './wallet.types';

/**
 * The logged-in student's own wallet balance (credits = number of trips they can
 * still board). Read-only; used by the mobile app's Transit Credit display.
 */
export async function getWalletBalance(userId: string): Promise<WalletBalance> {
    const wallet = await walletModel.findWalletByUserId(userId);
    if (!wallet) {
        throw new NotFoundError('Wallet not found for this user');
    }
    return wallet;
}

/**
 * Transport Personnel take physical cash from a student and credit their
 * wallet here. `performedBy` (the staff member's own user_id) is stored as
 * the transaction's `reference` - same idea as boarding storing `trip_id`
 * in `reference` for a deduction - so a top-up can always be traced to who processed it.
 */
export async function topupCash(userId: string, amount: number, performedBy: string): Promise<TopupCashResult> {
    const wallet = await walletModel.findWalletByUserId(userId);
    if (!wallet) {
        throw new NotFoundError('Wallet not found for this user');
    }

    const client = await walletModel.pool.connect();
    try {
        await client.query('BEGIN');

        const balance_credits = await walletModel.creditWallet(client, wallet.wallet_id, amount);
        const transaction = await walletModel.insertTopupTransaction(client, wallet.wallet_id, amount, performedBy);

        await client.query('COMMIT');

        return {
            wallet_id: wallet.wallet_id,
            user_id: userId,
            balance_credits,
            transaction_id: transaction.transaction_id,
            amount,
            created_at: transaction.created_at,
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}
