import { Link } from 'react-router-dom'
import { MapPinOff } from 'lucide-react'
import { Logo } from '@/components/Logo'

/** Rendered by the catch-all route for any unknown URL. */
export const NotFound = () => (
    <div className="flex min-h-screen flex-col bg-neutral-50">
        <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-5xl items-center px-4">
                <Link to="/" className="transition-transform hover:scale-[1.03]">
                    <Logo animated />
                </Link>
            </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-16">
            <div className="max-w-md text-center">
                <span className="bg-brand-50 text-brand-600 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                    <MapPinOff className="h-8 w-8" />
                </span>
                <p className="text-brand-600 mt-6 text-sm font-semibold tracking-wide uppercase">
                    404 — Off the route
                </p>
                <h1 className="mt-2 text-3xl font-bold text-neutral-900">
                    This stop doesn’t exist
                </h1>
                <p className="mt-3 text-neutral-600">
                    The page you’re looking for isn’t on the map. It may have moved, or the link
                    might be wrong.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link
                        to="/"
                        className="bg-brand-600 hover:bg-brand-700 inline-flex h-12 items-center justify-center rounded-lg px-6 text-base font-medium text-white shadow-sm transition-colors"
                    >
                        Back to home
                    </Link>
                    <Link
                        to="/survey"
                        className="inline-flex h-12 items-center justify-center rounded-lg border border-neutral-300 bg-white px-6 text-base font-medium text-neutral-800 transition-colors hover:bg-neutral-50"
                    >
                        Take the survey
                    </Link>
                </div>
            </div>
        </main>
    </div>
)
