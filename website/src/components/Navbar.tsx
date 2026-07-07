import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, Radio, X } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { cn } from '@/lib/utils'

const links = [
    { to: '/', label: 'Home', end: true },
    { to: '/live', label: 'Live map' },
    { to: '/topup', label: 'Top up' },
    { to: '/survey', label: 'Survey' },
]

export function Navbar() {
    const [open, setOpen] = useState(false)

    return (
        <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                <Link
                    to="/"
                    onClick={() => setOpen(false)}
                    className="transition-transform hover:scale-[1.03]"
                >
                    <Logo animated />
                </Link>

                {/* Desktop nav */}
                <nav className="hidden items-center gap-1 md:flex">
                    {links.map((l) => (
                        <NavLink
                            key={l.to}
                            to={l.to}
                            end={l.end}
                            className={({ isActive }) =>
                                cn(
                                    'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'text-brand-700 bg-brand-50'
                                        : 'text-neutral-600 hover:text-neutral-900',
                                )
                            }
                        >
                            {l.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="flex items-center gap-2">
                    <Link
                        to="/live"
                        className="group border-brand-200 text-brand-700 hover:bg-brand-50 hidden items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors sm:inline-flex"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="bg-brand-400 absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" />
                            <span className="bg-brand-500 relative inline-flex h-2 w-2 rounded-full" />
                        </span>
                        Live
                    </Link>
                    <Link
                        to="/survey"
                        className="group bg-brand-600 hover:bg-brand-700 hidden items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md sm:inline-flex"
                    >
                        Take the survey
                        <span className="transition-transform group-hover:translate-x-0.5">→</span>
                    </Link>

                    {/* Mobile menu button */}
                    <button
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        aria-expanded={open}
                        onClick={() => setOpen((o) => !o)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 md:hidden"
                    >
                        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu panel */}
            {open && (
                <div className="border-t border-neutral-200 bg-white md:hidden">
                    <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
                        {links.map((l) => (
                            <NavLink
                                key={l.to}
                                to={l.to}
                                end={l.end}
                                onClick={() => setOpen(false)}
                                className={({ isActive }) =>
                                    cn(
                                        'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'text-brand-700 bg-brand-50'
                                            : 'text-neutral-700 hover:bg-neutral-50',
                                    )
                                }
                            >
                                {l.label}
                            </NavLink>
                        ))}
                        <Link
                            to="/live"
                            onClick={() => setOpen(false)}
                            className="text-brand-700 mt-1 inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold"
                        >
                            <Radio className="h-4 w-4" /> Watch the live map
                        </Link>
                        <Link
                            to="/survey"
                            onClick={() => setOpen(false)}
                            className="bg-brand-600 mt-1 rounded-lg px-3 py-2.5 text-center text-sm font-semibold text-white"
                        >
                            Take the survey →
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    )
}
