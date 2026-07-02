export type UserRole = 'student' | 'driver' | 'transport_personnel' | 'admin'

export interface JwtPayload {
    user_id: string
    role: UserRole
    iat: number
    exp: number
}

// The JWT payload only carries user_id/role - the admin's display name comes
// from the /auth/login response body instead and is cached here so the
// topbar can show it without an extra API call on every page load.
export interface StoredUser {
    first_name: string
    last_name: string
    email: string
}

const TOKEN_KEY = 'movio_token'
const USER_KEY = 'movio_user'

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY)
}

export function getStoredUser(): StoredUser | null {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
        return JSON.parse(raw) as StoredUser
    } catch {
        return null
    }
}

export function setStoredUser(user: StoredUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearStoredUser(): void {
    localStorage.removeItem(USER_KEY)
}

// Decodes a JWT's payload without verifying the signature - the backend is the
// only thing that verifies signatures. This is purely for reading `exp`/`role`
// to decide what the dashboard should render.
export function decodeToken(token: string): JwtPayload | null {
    try {
        const payload = token.split('.')[1]
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
        return JSON.parse(atob(normalized)) as JwtPayload
    } catch {
        return null
    }
}

export function isTokenValid(token: string | null): boolean {
    if (!token) return false
    const payload = decodeToken(token)
    if (!payload) return false
    return payload.exp * 1000 > Date.now()
}
