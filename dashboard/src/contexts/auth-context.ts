import { createContext } from 'react'
import type { StoredUser, UserRole } from '../lib/auth'

export interface AuthContextValue {
    isAuthenticated: boolean
    role: UserRole | null
    user: StoredUser | null
    login: (token: string, user: StoredUser) => void
    logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
