import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiFetch } from '../lib/api'

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

            login(result.data.token)
            navigate('/', { replace: true })
        } catch {
            setError('Could not reach the server. Is the backend running?')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-brand">MovIO</h1>
                    <p className="text-sm text-slate-500 mt-1">Admin Dashboard</p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4"
                >
                    {error && (
                        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            {error}
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-slate-700 mb-1"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-brand text-white text-sm font-medium rounded-lg py-2.5 hover:bg-brand/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>
            </div>
        </div>
    )
}
