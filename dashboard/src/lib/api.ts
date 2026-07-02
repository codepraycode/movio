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
