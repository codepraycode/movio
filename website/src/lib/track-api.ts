/**
 * Live-map data access. Unlike the rest of the site (which talks to Supabase
 * directly), the live map reads active-trip data from the MovIO **backend**
 * (Express REST + Socket.io) — the app tables are RLS-locked to the backend's
 * postgres role, so the anon Supabase key can't read them. This hits the
 * public, driver-anonymised endpoint added for exactly this page.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '')

export const TRACKING_API_BASE = API_BASE
export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || API_BASE).replace(/\/$/, '')

/** One active vehicle on campus, as served by GET /tracking/public/active. */
export interface PublicTrip {
    trip_id: string
    status: string
    start_time: string
    plate_number: string
    /** Backend enum: 'bus' | 'cab' | 'tricycle'. */
    vehicle_type: string
    capacity: number
    route_name: string | null
    passenger_count: number
    latitude: number | null
    longitude: number | null
    last_location_at: string | null
}

/** Postgres numerics arrive as strings over JSON — coerce to a real number. */
function num(v: unknown): number | null {
    if (v === null || v === undefined) return null
    const n = typeof v === 'number' ? v : parseFloat(String(v))
    return Number.isFinite(n) ? n : null
}

/** Normalise a raw API/socket row into a typed PublicTrip with numeric coords. */
export function normalizeTrip(raw: Record<string, unknown>): PublicTrip {
    return {
        trip_id: String(raw.trip_id),
        status: String(raw.status ?? 'active'),
        start_time: String(raw.start_time ?? ''),
        plate_number: String(raw.plate_number ?? ''),
        vehicle_type: String(raw.vehicle_type ?? 'bus'),
        capacity: num(raw.capacity) ?? 0,
        route_name: raw.route_name == null ? null : String(raw.route_name),
        passenger_count: num(raw.passenger_count) ?? 0,
        latitude: num(raw.latitude),
        longitude: num(raw.longitude),
        last_location_at: raw.last_location_at == null ? null : String(raw.last_location_at),
    }
}

/**
 * Fetch the current roster of active trips. Throws on network failure or a
 * non-2xx response so the caller can show the "backend offline / waking up"
 * state (Render free-tier cold starts are expected — see .env.example).
 */
export async function fetchActiveTrips(signal?: AbortSignal): Promise<PublicTrip[]> {
    const res = await fetch(`${API_BASE}/api/v1/tracking/public/active`, { signal })
    if (!res.ok) throw new Error(`Tracking request failed (${res.status})`)
    const json = (await res.json()) as { data?: Record<string, unknown>[] }
    return (json.data ?? []).map(normalizeTrip)
}
