import * as boardingModel from './boarding.model';
import type { BoardingResult } from './boarding.types';

/**
 * This is the flow the physical TapTrace device (ESP32 + PN532 + GPS) drives
 * over MQTT->backend-bridge once HW-4 is built. Until then, it's what the
 * fake-payload simulator script calls so the dashboard/mobile app can be
 * built and tested against realistic data before hardware exists.
 */
export async function authenticateBoarding(
    uid: string,
    tripId: string,
    latitude?: number,
    longitude?: number
): Promise<BoardingResult> {
    // 1. Look up the credential
    const credential = await boardingModel.findActiveCredentialByUid(uid);
    if (!credential || !credential.is_active) {
        return { success: false, reason: 'unrecognized_or_inactive_card' };
    }

    const studentName = `${credential.first_name} ${credential.last_name}`;

    // 2. Check wallet balance
    const wallet = await boardingModel.findWalletByUserId(credential.user_id);
    if (!wallet || wallet.balance_credits <= 0) {
        return { success: false, reason: 'insufficient_credits', student_name: studentName };
    }

    // 3. Deduct one credit, log the transaction, record the boarding event - as one transaction
    const client = await boardingModel.pool.connect();
    try {
        await client.query('BEGIN');

        await boardingModel.deductWalletCredit(client, wallet.wallet_id);
        await boardingModel.insertCreditTransaction(client, wallet.wallet_id, tripId);
        const event = await boardingModel.insertBoardingEvent(
            client,
            tripId,
            credential.user_id,
            credential.credential_id,
            latitude ?? null,
            longitude ?? null
        );

        await client.query('COMMIT');

        return {
            success: true,
            student_name: studentName,
            event_id: event.event_id,
            boarded_at: event.boarded_at,
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}
