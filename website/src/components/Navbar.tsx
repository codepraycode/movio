import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'

export function Navbar() {
    return (
        <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
                <Link to="/" className="transition-transform hover:scale-[1.03]">
                    <Logo animated />
                </Link>
                <Link
                    to="/survey"
                    className="group bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md"
                >
                    Take the survey
                    <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
            </div>
        </header>
    )
}
