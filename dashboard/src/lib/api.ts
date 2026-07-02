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

async function apiMutate<T>(path: string, method: 'POST' | 'PATCH', body: unknown): Promise<T> {
    const response = await apiFetch(path, { method, body: JSON.stringify(body) })
    const responseBody = (await response.json()) as ApiSuccessBody<T> | ApiErrorBody
    if (!response.ok || !responseBody.success) {
        throw new Error(responseBody.message ?? 'Request failed')
    }
    return responseBody.data
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

export type VehicleType = 'bus' | 'cab' | 'tricycle'

export interface Vehicle {
    vehicle_id: string
    plate_number: string
    vehicle_type: VehicleType
    capacity: number
    is_active: boolean
    assigned_driver_id: string | null
    driver_first_name: string | null
    driver_last_name: string | null
}

export function getVehicles(): Promise<Vehicle[]> {
    return apiGet<Vehicle[]>('/admin/vehicles')
}

export function assignDriver(vehicleId: string, driverId: string | null): Promise<Vehicle> {
    return apiMutate<Vehicle>(`/admin/vehicles/${vehicleId}/assign-driver`, 'PATCH', {
        driver_id: driverId,
    })
}

export interface DriverUser {
    user_id: string
    first_name: string
    last_name: string
    email: string
    role: string
}

export function getDrivers(): Promise<DriverUser[]> {
    return apiGet<DriverUser[]>('/admin/users?role=driver')
}

export interface RouteStop {
    name: string
    lat: number
    lng: number
}

export interface RouteRecord {
    route_id: string
    route_name: string
    stops: RouteStop[]
    is_active: boolean
}

export function getRoutes(): Promise<RouteRecord[]> {
    return apiGet<RouteRecord[]>('/admin/routes')
}

export function createRoute(routeName: string, stops: RouteStop[]): Promise<RouteRecord> {
    return apiMutate<RouteRecord>('/admin/routes', 'POST', { route_name: routeName, stops })
}

export interface RoutePatch {
    route_name?: string
    stops?: RouteStop[]
    is_active?: boolean
}

export function updateRoute(routeId: string, patch: RoutePatch): Promise<RouteRecord> {
    return apiMutate<RouteRecord>(`/admin/routes/${routeId}`, 'PATCH', patch)
}

export type TripMonitorStatus = 'active' | 'completed' | 'cancelled'

export interface TripMonitorRow {
    trip_id: string
    status: TripMonitorStatus
    start_time: string
    end_time: string | null
    plate_number: string
    vehicle_type: VehicleType
    route_name: string | null
    driver_first_name: string
    driver_last_name: string
    passenger_count: number
}

export function getTripsMonitor(): Promise<TripMonitorRow[]> {
    return apiGet<TripMonitorRow[]>('/admin/trips')
}
