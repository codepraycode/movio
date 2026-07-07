/**
 * Shared access to the MovIO **backend** (Express REST) for the write-capable
 * public pages (top-up, complaints, account deletion). This is the same backend
 * the live map reads from — the survey/waitlist pages talk to Supabase directly
 * instead, but these actions need the app tables, which are RLS-locked to the
 * backend's postgres role. Point VITE_API_BASE_URL at the backend (see track-api).
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '')

export const BACKEND_API_BASE = API_BASE

interface ApiEnvelope<T> {
    success: boolean
    message: string
    data?: T
    errors?: { field: string; constraints: string[] }[]
}

/** A backend error with a human-friendly message already resolved. */
export class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
        super(message)
        this.name = 'ApiError'
        this.status = status
    }
}

/**
 * POST JSON to `/api/v1<path>` and unwrap the `{ success, message, data }`
 * envelope. Throws an ApiError carrying a message that's safe to show a user:
 * the first field-level validation constraint if present, else the envelope
 * message, else a generic fallback. Network failures surface a friendly line
 * rather than a raw TypeError.
 */
export async function postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
    let res: Response
    try {
        res = await fetch(`${API_BASE}/api/v1${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal,
        })
    } catch {
        throw new ApiError(
            'We couldn’t reach Movio. Check your connection and try again — the server may also be waking up.',
            0,
        )
    }

    let json: ApiEnvelope<T>
    try {
        json = (await res.json()) as ApiEnvelope<T>
    } catch {
        throw new ApiError(`Unexpected response from the server (${res.status}).`, res.status)
    }

    if (!res.ok || !json.success) {
        const fieldMsg = json.errors?.[0]?.constraints?.[0]
        throw new ApiError(fieldMsg || json.message || `Request failed (${res.status}).`, res.status)
    }

    return json.data as T
}
