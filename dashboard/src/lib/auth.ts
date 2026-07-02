export type UserRole = 'student' | 'driver' | 'transport_personnel' | 'admin'

export interface JwtPayload {
    user_id: string
    role: UserRole
    iat: number
    exp: number
}

const TOKEN_KEY = 'movio_token'

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY)
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
