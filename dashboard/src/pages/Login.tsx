import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Lock, Mail, TriangleAlert } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { apiFetch } from '../lib/api'
import type { StoredUser } from '../lib/auth'

export default function Login() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        setError(null)
        setIsSubmitting(true)

        try {
            const response = await apiFetch('/auth/login', {
                method: 'POST',
                skipAuth: true,
                body: JSON.stringify({ email, password }),
            })
            const result = await response.json()

            if (!response.ok || !result.success) {
                setError(result.message ?? 'Login failed')
                return
            }

            if (result.data.user.role !== 'admin') {
                setError('This dashboard is for admin accounts only.')
                return
            }

            login(result.data.token, result.data.user as StoredUser)
            navigate('/', { replace: true })
        } catch {
            setError('Could not reach the server. Is the backend running?')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-paper px-4">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center mb-8">
                    <img src="/movio-logo.png" alt="MovIO" className="h-10 w-auto mb-3" />
                    <p className="text-sm text-ink/60">Admin Dashboard</p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-surface border border-line rounded-xl shadow-sm p-6 space-y-4"
                >
                    {error && (
                        <div className="flex items-start gap-2 text-sm text-alert bg-alert/10 border border-alert/20 rounded-lg px-3 py-2">
                            <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
                            Email
                        </label>
                        <div className="relative">
                            <Mail
                                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40"
                                aria-hidden="true"
                            />
                            <input
                                id="email"
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg border border-line bg-surface pl-9 pr-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:border-brand"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-ink mb-1"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <Lock
                                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40"
                                aria-hidden="true"
                            />
                            <input
                                id="password"
                                type="password"
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg border border-line bg-surface pl-9 pr-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:border-brand"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 bg-brand text-white text-sm font-medium rounded-lg py-2.5 hover:bg-brand/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2"
                    >
                        {isSubmitting && (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        )}
                        {isSubmitting ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>
            </div>
        </div>
    )
}
