/**
 * Website Transit Credit top-up — talks to the backend's no-login Paystack
 * endpoints. Deposit-only by design: we identify the account by matric/email
 * and only ever get a first name back (never a balance or history).
 */
import { postJson } from './backend'

export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined

/** ₦ per Transit Credit. Mirrors the backend's FARE_NAIRA — used only for the
 *  preset amount chips / credit preview in the UI; the backend is the source of
 *  truth and recomputes credits from the amount actually charged. */
export const FARE_NAIRA = 200

export interface InitiateTopupResult {
    access_code: string
    reference: string
    first_name: string
    credits: number
}

export interface VerifyTopupResult {
    credits_added: number
    balance_credits: number
    first_name: string
}

export function initiateTopup(identifier: string, amountNaira: number): Promise<InitiateTopupResult> {
    return postJson<InitiateTopupResult>('/wallet/topup-app/initiate', {
        identifier: identifier.trim(),
        amount_naira: amountNaira,
    })
}

export function verifyTopup(reference: string): Promise<VerifyTopupResult> {
    return postJson<VerifyTopupResult>('/wallet/topup-app/verify', { reference })
}
