import type { PoolClient } from 'pg';
import { query, pool } from '../../config/db';
import type { CreditTransaction, TransitWallet, User } from '../../types';

export { pool };

export type WalletTransaction = Pick<
    CreditTransaction,
    'transaction_id' | 'amount' | 'type' | 'reference' | 'created_at'
>;

/**
 * A user's credit transaction history, newest first (mobile "credit history"
 * screen). Joined through the wallet so a user can only ever read their own
 * rows; a user with no wallet simply gets an empty list.
 */
export async function findTransactionsByUserId(userId: string, limit = 100): Promise<WalletTransaction[]> {
    const result = await query<WalletTransaction>(
        `SELECT ct.transaction_id, ct.amount, ct.type, ct.reference, ct.created_at
         FROM credit_transactions ct
         JOIN transit_wallets w ON w.wallet_id = ct.wallet_id
         WHERE w.user_id = $1
         ORDER BY ct.created_at DESC
         LIMIT $2`,
        [userId, limit]
    );
    return result.rows;
}

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

// -- Website (no-login) Paystack top-up -------------------------------------

export type IdentifiedUser = Pick<User, 'user_id' | 'first_name' | 'email'>;

/**
 * Look up an account by matric number OR email (whichever the visitor typed).
 * Returns ONLY user_id / first_name / email — never balance, matric number, or
 * anything else, since this is reachable with no auth (the first name is shown
 * back purely to confirm "you're topping up the right person").
 */
export async function findUserByIdentifier(identifier: string): Promise<IdentifiedUser | undefined> {
    const result = await query<IdentifiedUser>(
        `SELECT user_id, first_name, email FROM users WHERE matric_no = $1 OR email = $1`,
        [identifier]
    );
    return result.rows[0];
}

/** Confirmation-name lookup by user_id (used after Paystack verify echoes back the account). */
export async function findUserBasicById(userId: string): Promise<Pick<User, 'user_id' | 'first_name'> | undefined> {
    const result = await query<Pick<User, 'user_id' | 'first_name'>>(
        `SELECT user_id, first_name FROM users WHERE user_id = $1`,
        [userId]
    );
    return result.rows[0];
}

/** Idempotency guard (belt-and-braces alongside the DB partial unique index). */
export async function findTopupByReference(reference: string): Promise<{ transaction_id: string } | undefined> {
    const result = await query<{ transaction_id: string }>(
        `SELECT transaction_id FROM credit_transactions WHERE type = 'topup_app' AND reference = $1`,
        [reference]
    );
    return result.rows[0];
}

/** Same shape as insertTopupTransaction but type = 'topup_app', reference = the Paystack reference. */
export async function insertAppTopupTransaction(
    client: PoolClient,
    walletId: string,
    credits: number,
    reference: string
): Promise<NewTopupTransaction> {
    const result = await client.query<NewTopupTransaction>(
        `INSERT INTO credit_transactions (wallet_id, amount, type, reference)
         VALUES ($1, $2, 'topup_app', $3)
         RETURNING transaction_id, created_at`,
        [walletId, credits, reference]
    );
    return result.rows[0];
}
