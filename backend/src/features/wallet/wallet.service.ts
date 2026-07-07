import { randomUUID } from 'node:crypto';
import { DatabaseError } from 'pg';
import * as walletModel from './wallet.model';
import { BadRequestError, NotFoundError } from '../../shared/errors';
import { env } from '../../config/env.config';
import { initializeTransaction, verifyTransaction } from '../../shared/utils/paystack';
import type { WalletBalance, WalletTransaction } from './wallet.model';
import type { InitiateAppTopupResult, TopupCashResult, VerifyAppTopupResult } from './wallet.types';

/** A user's own credit transaction history, newest first. */
export async function getTransactionHistory(userId: string): Promise<WalletTransaction[]> {
    return walletModel.findTransactionsByUserId(userId);
}

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

/**
 * Website (no-login) Transit Credit top-up — step 1.
 * A visitor identifies an account by matric number OR email and pays via
 * Paystack. Nothing is written to the DB here — only Paystack knows about the
 * transaction until verifyAppTopup confirms it succeeded. We return only a
 * first name for confirmation, never balance or any other account detail.
 */
export async function initiateAppTopup(
    identifier: string,
    amountNaira: number
): Promise<InitiateAppTopupResult> {
    const user = await walletModel.findUserByIdentifier(identifier.trim());
    if (!user) {
        throw new NotFoundError('No account found for that matric number or email');
    }

    const credits = Math.floor(amountNaira / env.FARE_NAIRA);
    if (credits < 1) {
        throw new BadRequestError(
            `Amount too small — one Transit Credit costs ₦${env.FARE_NAIRA}, so the minimum top-up is ₦${env.FARE_NAIRA}.`
        );
    }

    const reference = `movio_topup_${randomUUID()}`;
    const { access_code } = await initializeTransaction({
        email: user.email,
        amountKobo: amountNaira * 100,
        reference,
        metadata: { user_id: user.user_id, credits },
    });

    return { access_code, reference, first_name: user.first_name, credits };
}

/**
 * Website (no-login) Transit Credit top-up — step 2.
 * Called after the Paystack popup reports success. We re-verify server-side
 * (never trust the frontend callback) and only credit on a real 'success',
 * exactly once (idempotent — a page refresh / retry won't double-credit).
 */
export async function verifyAppTopup(reference: string): Promise<VerifyAppTopupResult> {
    const payment = await verifyTransaction(reference);
    if (payment.status !== 'success') {
        throw new BadRequestError('Payment was not completed. No credits were added.');
    }

    // Recompute credits from the amount actually charged (kobo → naira →
    // credits) rather than trusting the client — the source of truth is what
    // Paystack says was paid, so a tampered client can't inflate the count.
    const amountNaira = payment.amount / 100;
    const credits = Math.floor(amountNaira / env.FARE_NAIRA);
    if (credits < 1) {
        throw new BadRequestError('Paid amount was too small to buy a Transit Credit.');
    }

    // Whose wallet to credit comes from the metadata we attached at initialize
    // time and Paystack echoed back on verify — not from anything the client sent.
    const userId = payment.metadata?.user_id;
    if (!userId) {
        throw new BadRequestError('Payment is missing account metadata and cannot be applied.');
    }

    const user = await walletModel.findUserBasicById(userId);
    if (!user) {
        throw new NotFoundError('Could not match this payment to an account');
    }

    const existing = await walletModel.findTopupByReference(reference);
    if (existing) {
        // Already credited (idempotency) — return the current balance, don't add again.
        const wallet = await walletModel.findWalletByUserId(user.user_id);
        return {
            credits_added: 0,
            balance_credits: wallet?.balance_credits ?? 0,
            first_name: user.first_name,
        };
    }

    const wallet = await walletModel.findWalletByUserId(user.user_id);
    if (!wallet) {
        throw new NotFoundError('Wallet not found for this account');
    }

    const client = await walletModel.pool.connect();
    try {
        await client.query('BEGIN');
        const balance_credits = await walletModel.creditWallet(client, wallet.wallet_id, credits);
        await walletModel.insertAppTopupTransaction(client, wallet.wallet_id, credits, reference);
        await client.query('COMMIT');
        return { credits_added: credits, balance_credits, first_name: user.first_name };
    } catch (err) {
        await client.query('ROLLBACK');
        // A concurrent duplicate verify can lose the race to the partial unique
        // index (23505). Treat that as "already credited", not an error.
        if (err instanceof DatabaseError && err.code === '23505') {
            const balance = await walletModel.findWalletByUserId(user.user_id);
            return {
                credits_added: 0,
                balance_credits: balance?.balance_credits ?? 0,
                first_name: user.first_name,
            };
        }
        throw err;
    } finally {
        client.release();
    }
}
