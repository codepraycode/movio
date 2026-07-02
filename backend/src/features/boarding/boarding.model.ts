import type { PoolClient } from 'pg';
import { query, pool } from '../../config/db';
import type { BoardingEvent, NfcCredential, TransitWallet, User } from '../../types';

export { pool };

export type ActiveCredential = Pick<NfcCredential, 'credential_id' | 'user_id' | 'is_active'> &
    Pick<User, 'first_name' | 'last_name'>;

export async function findActiveCredentialByUid(uid: string): Promise<ActiveCredential | undefined> {
    const result = await query<ActiveCredential>(
        `SELECT c.credential_id, c.user_id, c.is_active, u.first_name, u.last_name
         FROM nfc_credentials c
         JOIN users u ON u.user_id = c.user_id
         WHERE c.nfc_uid = $1`,
        [uid]
    );
    return result.rows[0];
}

export type WalletBalance = Pick<TransitWallet, 'wallet_id' | 'balance_credits'>;

export async function findWalletByUserId(userId: string): Promise<WalletBalance | undefined> {
    const result = await query<WalletBalance>(
        `SELECT wallet_id, balance_credits FROM transit_wallets WHERE user_id = $1`,
        [userId]
    );
    return result.rows[0];
}

export async function deductWalletCredit(client: PoolClient, walletId: string): Promise<void> {
    await client.query(
        `UPDATE transit_wallets SET balance_credits = balance_credits - 1, last_updated = now()
         WHERE wallet_id = $1`,
        [walletId]
    );
}

export async function insertCreditTransaction(
    client: PoolClient,
    walletId: string,
    tripId: string
): Promise<void> {
    await client.query(
        `INSERT INTO credit_transactions (wallet_id, amount, type, reference)
         VALUES ($1, -1, 'boarding_deduction', $2)`,
        [walletId, tripId]
    );
}

export type NewBoardingEvent = Pick<BoardingEvent, 'event_id' | 'boarded_at'>;

export async function insertBoardingEvent(
    client: PoolClient,
    tripId: string,
    userId: string,
    credentialId: string,
    latitude: number | null,
    longitude: number | null
): Promise<NewBoardingEvent> {
    const result = await client.query<NewBoardingEvent>(
        `INSERT INTO boarding_events (trip_id, student_id, credential_id, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING event_id, boarded_at`,
        [tripId, userId, credentialId, latitude, longitude]
    );
    return result.rows[0];
}
