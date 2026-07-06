import type { PoolClient } from 'pg';
import { query, pool } from '../../config/db';
import type { BoardingEvent, NfcCredential, TransitWallet, User } from '../../types';
import type { StudentTripRow } from './boarding.types';

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

export type OpenBoardingEvent = Pick<BoardingEvent, 'event_id' | 'boarded_at'>;

/** The student's un-closed boarding event on this trip, if they're currently aboard. */
export async function findOpenBoardingEvent(
    tripId: string,
    studentId: string
): Promise<OpenBoardingEvent | undefined> {
    const result = await query<OpenBoardingEvent>(
        `SELECT event_id, boarded_at
         FROM boarding_events
         WHERE trip_id = $1 AND student_id = $2 AND alighted_at IS NULL
         ORDER BY boarded_at DESC
         LIMIT 1`,
        [tripId, studentId]
    );
    return result.rows[0];
}

export type ClosedBoardingEvent = Pick<BoardingEvent, 'event_id' | 'alighted_at'>;

/** Tap-out: closes an open boarding event. No wallet involvement - fare is flat per boarding. */
export async function closeBoardingEvent(eventId: string): Promise<ClosedBoardingEvent> {
    const result = await query<ClosedBoardingEvent>(
        `UPDATE boarding_events SET alighted_at = now()
         WHERE event_id = $1
         RETURNING event_id, alighted_at`,
        [eventId]
    );
    return result.rows[0];
}

/** How many students are aboard right now (boarded, not yet alighted). */
export async function countOnboard(tripId: string): Promise<number> {
    const result = await query<{ count: number }>(
        `SELECT COUNT(*)::int AS count
         FROM boarding_events
         WHERE trip_id = $1 AND alighted_at IS NULL`,
        [tripId]
    );
    return result.rows[0].count;
}

/**
 * A student's own boarding history, newest first, with the trip context (vehicle,
 * driver, route) needed to account for each credit spent. LEFT JOIN on routes:
 * a trip can legitimately have no route assigned.
 */
export async function findTripHistoryByStudent(studentId: string, limit = 100): Promise<StudentTripRow[]> {
    const result = await query<StudentTripRow>(
        `SELECT be.event_id, be.trip_id, be.boarded_at, be.alighted_at,
                t.status AS trip_status,
                v.plate_number, v.vehicle_type,
                r.route_name,
                d.first_name AS driver_first_name, d.last_name AS driver_last_name
         FROM boarding_events be
         JOIN trips t ON t.trip_id = be.trip_id
         JOIN vehicles v ON v.vehicle_id = t.vehicle_id
         JOIN users d ON d.user_id = t.driver_id
         LEFT JOIN routes r ON r.route_id = t.route_id
         WHERE be.student_id = $1
         ORDER BY be.boarded_at DESC
         LIMIT $2`,
        [studentId, limit]
    );
    return result.rows;
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
