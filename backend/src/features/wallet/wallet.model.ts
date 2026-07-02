import type { PoolClient } from 'pg';
import { query, pool } from '../../config/db';
import type { TransitWallet } from '../../types';

export { pool };

export type WalletBalance = Pick<TransitWallet, 'wallet_id' | 'user_id' | 'balance_credits'>;

export async function findWalletByUserId(userId: string): Promise<WalletBalance | undefined> {
    const result = await query<WalletBalance>(
        `SELECT wallet_id, user_id, balance_credits FROM transit_wallets WHERE user_id = $1`,
        [userId]
    );
    return result.rows[0];
}

export async function creditWallet(client: PoolClient, walletId: string, amount: number): Promise<number> {
    const result = await client.query<Pick<TransitWallet, 'balance_credits'>>(
        `UPDATE transit_wallets SET balance_credits = balance_credits + $1, last_updated = now()
         WHERE wallet_id = $2
         RETURNING balance_credits`,
        [amount, walletId]
    );
    return result.rows[0].balance_credits;
}

export type NewTopupTransaction = { transaction_id: string; created_at: Date };

export async function insertTopupTransaction(
    client: PoolClient,
    walletId: string,
    amount: number,
    performedBy: string
): Promise<NewTopupTransaction> {
    const result = await client.query<NewTopupTransaction>(
        `INSERT INTO credit_transactions (wallet_id, amount, type, reference)
         VALUES ($1, $2, 'topup_cash', $3)
         RETURNING transaction_id, created_at`,
        [walletId, amount, performedBy]
    );
    return result.rows[0];
}
