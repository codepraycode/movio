import { createContext } from 'react'
import type { UserRole } from '../lib/auth'

export interface AuthContextValue {
    isAuthenticated: boolean
    role: UserRole | null
    login: (token: string) => void
    logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
