import { useCallback, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from './auth-context'
import {
    clearToken,
    decodeToken,
    isTokenValid,
    setToken as persistToken,
    getToken,
} from '../lib/auth'

function readAuthState(): Pick<AuthContextValue, 'isAuthenticated' | 'role'> {
    const token = getToken()
    if (!isTokenValid(token)) {
        return { isAuthenticated: false, role: null }
    }
    return { isAuthenticated: true, role: decodeToken(token as string)?.role ?? null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    // Initialized synchronously from localStorage so the first render already
    // knows whether the session is valid - no flash of protected content.
    const [state, setState] = useState(readAuthState)

    const login = useCallback((token: string) => {
        persistToken(token)
        setState(readAuthState())
    }, [])

    const logout = useCallback(() => {
        clearToken()
        setState({ isAuthenticated: false, role: null })
    }, [])

    return (
        <AuthContext.Provider value={{ ...state, login, logout }}>{children}</AuthContext.Provider>
    )
}
