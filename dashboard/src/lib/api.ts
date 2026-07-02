import { getToken, clearToken } from './auth'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// The backend mounts /health at the app root, not under /api/v1 - strip the
// versioned suffix so health checks hit the real, reachable path.
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '')

interface ApiFetchOptions extends RequestInit {
    skipAuth?: boolean
}

// Wraps fetch with the JWT Authorization header and a shared 401 handler -
// clears a stale/expired token and returns to /login so a dead session can't
// keep making authenticated calls.
export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
    const { skipAuth, headers, ...rest } = options
    const token = getToken()

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...rest,
        headers: {
            'Content-Type': 'application/json',
            ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
    })

    if (response.status === 401 && !skipAuth) {
        clearToken()
        window.location.href = '/login'
    }

    return response
}

interface ApiSuccessBody<T> {
    success: true
    message: string
    data: T
}

interface ApiErrorBody {
    success: false
    message: string
}

// Every endpoint below is admin-JWT-protected and returns the backend's
// standard {success,message,data} envelope - unwrap it here once instead of
// repeating the check in every screen component.
async function apiGet<T>(path: string): Promise<T> {
    const response = await apiFetch(path)
    const body = (await response.json()) as ApiSuccessBody<T> | ApiErrorBody
    if (!response.ok || !body.success) {
        throw new Error(body.message ?? 'Request failed')
    }
    return body.data
}

export interface ActiveTrip {
    trip_id: string
    status: string
    start_time: string
    plate_number: string
    vehicle_type: string
    route_name: string | null
    latitude: number | null
    longitude: number | null
    last_location_at: string | null
}

export function getActiveTrips(): Promise<ActiveTrip[]> {
    return apiGet<ActiveTrip[]>('/tracking/active')
}

export type ComplaintStatus = 'open' | 'under_review' | 'resolved'

export interface Complaint {
    complaint_id: string
    student_id: string
    trip_id: string | null
    description: string
    status: ComplaintStatus
    created_at: string
    first_name: string
    last_name: string
}

export function getComplaints(status?: ComplaintStatus): Promise<Complaint[]> {
    const query = status ? `?status=${status}` : ''
    return apiGet<Complaint[]>(`/admin/complaints${query}`)
}

export async function updateComplaintStatus(
    complaintId: string,
    status: ComplaintStatus
): Promise<Complaint> {
    const response = await apiFetch(`/admin/complaints/${complaintId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    })
    const body = (await response.json()) as ApiSuccessBody<Complaint> | ApiErrorBody
    if (!response.ok || !body.success) {
        throw new Error(body.message ?? 'Request failed')
    }
    return body.data
}

export type RidershipGroupBy = 'route' | 'vehicle' | 'day'

export interface RidershipRow {
    route_name?: string
    plate_number?: string
    day?: string
    boarding_count: number
}

export function getRidershipReport(groupBy: RidershipGroupBy): Promise<RidershipRow[]> {
    return apiGet<RidershipRow[]>(`/admin/reports/ridership?groupBy=${groupBy}`)
}
