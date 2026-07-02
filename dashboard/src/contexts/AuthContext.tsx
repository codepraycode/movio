import { useCallback, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from './auth-context'
import {
    clearStoredUser,
    clearToken,
    decodeToken,
    getStoredUser,
    isTokenValid,
    setStoredUser,
    setToken as persistToken,
    getToken,
    type StoredUser,
} from '../lib/auth'

function readAuthState(): Pick<AuthContextValue, 'isAuthenticated' | 'role' | 'user'> {
    const token = getToken()
    if (!isTokenValid(token)) {
        return { isAuthenticated: false, role: null, user: null }
    }
    return {
        isAuthenticated: true,
        role: decodeToken(token as string)?.role ?? null,
        user: getStoredUser(),
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    // Initialized synchronously from localStorage so the first render already
    // knows whether the session is valid - no flash of protected content.
    const [state, setState] = useState(readAuthState)

    const login = useCallback((token: string, user: StoredUser) => {
        persistToken(token)
        setStoredUser(user)
        setState(readAuthState())
    }, [])

    const logout = useCallback(() => {
        clearToken()
        clearStoredUser()
        setState({ isAuthenticated: false, role: null, user: null })
    }, [])

    return (
        <AuthContext.Provider value={{ ...state, login, logout }}>{children}</AuthContext.Provider>
    )
}
