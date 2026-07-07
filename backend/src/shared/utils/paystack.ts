/**
 * Thin Paystack wrapper — no new dependency, just Node's built-in global
 * `fetch` (matches the codebase's "no ORM, everything visible" philosophy; we
 * don't add axios for two calls). Test-mode keys during development.
 *
 * SECURITY (Paystack's own docs are explicit about this): never credit a wallet
 * based on the frontend's "payment succeeded" callback alone. Always call
 * verifyTransaction server-side and check data.status === 'success' before
 * touching the DB. The frontend callback is only a hint to *ask the server to
 * check* — it proves nothing by itself.
 */
import { env } from '../../config/env.config';
import { InternalServerError } from '../errors';

const PAYSTACK_BASE = 'https://api.paystack.co';

function requireSecretKey(): string {
    if (!env.PAYSTACK_SECRET_KEY) {
        throw new InternalServerError(
            'Paystack is not configured on the server (PAYSTACK_SECRET_KEY missing).'
        );
    }
    return env.PAYSTACK_SECRET_KEY;
}

export interface InitializeTransactionResult {
    authorization_url: string;
    access_code: string;
    reference: string;
}

export async function initializeTransaction(params: {
    email: string;
    amountKobo: number;
    reference: string;
    metadata?: Record<string, unknown>;
}): Promise<InitializeTransactionResult> {
    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${requireSecretKey()}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: params.email,
            amount: params.amountKobo, // Paystack wants the LOWEST currency unit - kobo, not naira
            reference: params.reference,
            metadata: params.metadata,
        }),
    });
    const json = (await res.json()) as { status?: boolean; message?: string; data?: InitializeTransactionResult };
    if (!res.ok || !json.status || !json.data) {
        throw new InternalServerError(json.message ?? 'Paystack initialize failed');
    }
    return json.data;
}

export interface VerifyTransactionResult {
    status: string; // 'success' | 'failed' | 'abandoned' | ...
    amount: number; // kobo, as actually charged - the source of truth, not what we initialized with
    reference: string;
    // The metadata we attached at initialize time comes back here - we use
    // metadata.user_id to know whose wallet to credit.
    metadata?: { user_id?: string; credits?: number } | null;
}

export async function verifyTransaction(reference: string): Promise<VerifyTransactionResult> {
    const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${requireSecretKey()}` },
    });
    const json = (await res.json()) as { status?: boolean; message?: string; data?: VerifyTransactionResult };
    if (!res.ok || !json.status || !json.data) {
        throw new InternalServerError(json.message ?? 'Paystack verify failed');
    }
    return json.data;
}
