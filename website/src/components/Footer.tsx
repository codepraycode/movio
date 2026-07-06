import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
    ArrowUpRight,
    Check,
    ClipboardList,
    Copy,
    GraduationCap,
    Link2,
    Radio,
    Send,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useToast } from '@/components/ui/toast'

/**
 * The Movio sign-off — styled like the live-tracking app's "control room":
 * a running survey that any FUTA student can join from anywhere, plus a real
 * author attribution. Remote participation is a first-class action here.
 */
export function Footer() {
    const { toast } = useToast()
    const [copied, setCopied] = useState(false)
    const year = new Date().getFullYear()
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://movio.app'

    async function copyLink() {
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            toast({ variant: 'success', title: 'Link copied — send it to a course mate 🙌🏽' })
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast({ variant: 'error', title: 'Could not copy the link' })
        }
    }

    return (
        <footer className="relative overflow-hidden border-t border-white/10 bg-neutral-950 text-neutral-300">
            {/* route texture + brand glow, echoing the live-map hero */}
            <div className="bg-route absolute inset-0 opacity-[0.05]" aria-hidden />
            <div
                className="bg-brand-500/15 absolute -top-24 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full blur-3xl"
                aria-hidden
            />

            <div className="relative mx-auto max-w-5xl px-4">
                {/* ── Live status rail ── */}
                <div className="flex items-center justify-center gap-2.5 border-b border-white/10 py-3.5 text-center text-xs font-medium text-neutral-400">
                    <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-pulse-ring bg-brand-400 absolute inline-flex h-full w-full rounded-full" />
                        <span className="bg-brand-400 relative inline-flex h-2 w-2 rounded-full" />
                    </span>
                    <span>
                        <span className="text-brand-300 font-semibold">Survey live</span> ·
                        collecting responses from FUTA students — on campus or anywhere
                    </span>
                </div>

                {/* ── Remote-participation CTA ── */}
                <div className="grid items-center gap-8 py-14 lg:grid-cols-[1.2fr_1fr]">
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-neutral-300">
                            <Radio className="text-brand-400 h-3.5 w-3.5" />
                            Final-year research · open to every FUTA student
                        </span>
                        <h2 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                            You don&rsquo;t have to be on campus to shape Movio.
                        </h2>
                        <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-400">
                            Wherever you&rsquo;re reading this — hostel, home, or between lectures —
                            your three minutes become real evidence in the research behind Movio.
                            Take it, then pass it to one course mate.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2.5 sm:max-w-sm lg:ml-auto lg:w-full">
                        <Link
                            to="/survey"
                            className="group bg-brand-500 shadow-brand-900/40 hover:bg-brand-400 inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5"
                        >
                            <ClipboardList className="h-4.5 w-4.5" />
                            Take the quick survey
                            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                        <button
                            onClick={copyLink}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 font-semibold text-neutral-200 transition-colors hover:bg-white/10"
                        >
                            {copied ? (
                                <Check className="text-brand-400 h-4.5 w-4.5" />
                            ) : (
                                <Link2 className="h-4.5 w-4.5" />
                            )}
                            {copied ? 'Link copied' : 'Copy link to share'}
                        </button>
                    </div>
                </div>

                {/* ── Link grid + attribution ── */}
                <div className="grid gap-10 border-t border-white/10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.3fr]">
                    {/* Brand + what it is */}
                    <div className="space-y-4">
                        <Logo className="[&>span:last-child]:text-white" />
                        <p className="max-w-xs text-sm leading-relaxed text-neutral-400">
                            A smart campus shuttle for FUTA — live GPS tracking and tap-to-board, so
                            you always know when your bus is coming.
                        </p>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-neutral-400">
                            <GraduationCap className="text-brand-400 h-3.5 w-3.5" />
                            School of Computing · FUTA, Akure
                        </span>
                    </div>

                    {/* Participate */}
                    <nav className="space-y-3 text-sm">
                        <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                            Participate
                        </p>
                        <FooterLink to="/survey" icon={ClipboardList}>
                            Take the survey
                        </FooterLink>
                        <FooterLink to="/#waitlist" icon={Send}>
                            Join the waitlist
                        </FooterLink>
                        <FooterButton onClick={copyLink} icon={copied ? Check : Copy}>
                            {copied ? 'Link copied' : 'Share with a friend'}
                        </FooterButton>
                    </nav>

                    {/* Author attribution */}
                    <div className="space-y-4">
                        <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                            Designed &amp; built by
                        </p>
                        <a
                            href="https://github.com/codepraycode"
                            target="_blank"
                            rel="noreferrer"
                            className="group hover:border-brand-400/40 flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-3.5 transition-colors hover:bg-white/10"
                        >
                            <span className="from-brand-400 to-brand-700 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-mono text-lg font-bold text-white">
                                &lt;/&gt;
                            </span>
                            <span className="min-w-0">
                                <span className="flex items-center gap-1.5 font-semibold text-white">
                                    codepraycode
                                    <GithubIcon className="group-hover:text-brand-300 h-3.5 w-3.5 text-neutral-400 transition-colors" />
                                </span>
                                <span className="block text-xs leading-snug text-neutral-400">
                                    Final-year Software Engineering — building Movio as my final
                                    year project.
                                </span>
                            </span>
                        </a>
                    </div>
                </div>

                {/* ── Bottom bar ── */}
                <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-neutral-500 sm:flex-row">
                    <p>© {year} Movio · A Software Engineering final year project · FUTA, Akure</p>
                    <p className="font-mono">
                        crafted by{' '}
                        <a
                            href="https://github.com/codepraycode"
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-brand-300 text-neutral-300 transition-colors"
                        >
                            codepraycode
                        </a>{' '}
                        · 2025/2026 session
                    </p>
                </div>
            </div>
        </footer>
    )
}

interface FooterLinkProps {
    to: string
    icon: React.ComponentType<{ className?: string }>
    children: React.ReactNode
}

function FooterLink({ to, icon: Icon, children }: FooterLinkProps) {
    return (
        <Link
            to={to}
            className="group flex items-center gap-2.5 text-neutral-400 transition-colors hover:text-white"
        >
            <Icon className="group-hover:text-brand-400 h-4 w-4 text-neutral-600 transition-colors" />
            <span>{children}</span>
        </Link>
    )
}

interface FooterButtonProps {
    onClick: () => void
    icon: React.ComponentType<{ className?: string }>
    children: React.ReactNode
}

function FooterButton({ onClick, icon: Icon, children }: FooterButtonProps) {
    return (
        <button
            onClick={onClick}
            className="group flex items-center gap-2.5 text-neutral-400 transition-colors hover:text-white"
        >
            <Icon className="group-hover:text-brand-400 h-4 w-4 text-neutral-600 transition-colors" />
            <span>{children}</span>
        </button>
    )
}

function GithubIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.12-.31-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.18.77.84 1.23 1.91 1.23 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.82 1.1.82 2.22 0 1.61-.02 2.9-.02 3.29 0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
        </svg>
    )
}
