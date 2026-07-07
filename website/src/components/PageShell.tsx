import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Seo } from '@/components/Seo'
import { cn } from '@/lib/utils'

interface PageShellProps {
    /** Small uppercase eyebrow above the title (e.g. "Transit Credit"). */
    eyebrow: string
    icon?: ReactNode
    title: ReactNode
    subtitle?: ReactNode
    /** SEO */
    seoTitle: string
    seoDescription: string
    path: string
    /** Optional "back to …" link shown under the header. */
    back?: { to: string; label: string }
    children: ReactNode
    /** Extra classes for the content container (default max-w-xl). */
    contentClassName?: string
}

/**
 * Shared shell for the interactive public pages (top-up, complaint, delete
 * account). Gives them the same immersive header treatment as the landing
 * hero — aurora glow + engineering grid — so they feel like one product, not
 * bolted-on forms. Reuses Navbar/Footer/Seo.
 */
export function PageShell({
    eyebrow,
    icon,
    title,
    subtitle,
    seoTitle,
    seoDescription,
    path,
    back,
    children,
    contentClassName,
}: PageShellProps) {
    return (
        <div className="flex min-h-screen flex-col bg-white">
            <Seo title={seoTitle} description={seoDescription} path={path} />
            <Navbar />

            {/* Header band */}
            <div className="bg-aurora relative overflow-hidden border-b border-neutral-100">
                <div className="bg-grid absolute inset-0 opacity-60" aria-hidden />
                <div className="relative mx-auto w-full max-w-3xl px-4 pt-14 pb-10 text-center sm:pt-20">
                    {icon && (
                        <div className="animate-fade-up mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 text-brand-600 shadow-card ring-1 ring-brand-100 backdrop-blur">
                            {icon}
                        </div>
                    )}
                    <p className="animate-fade-up text-brand-700 text-xs font-semibold tracking-[0.14em] uppercase">
                        {eyebrow}
                    </p>
                    <h1
                        className="animate-fade-up mx-auto mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl"
                        style={{ animationDelay: '80ms' }}
                    >
                        {title}
                    </h1>
                    {subtitle && (
                        <p
                            className="animate-fade-up mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-neutral-600 sm:text-base"
                            style={{ animationDelay: '160ms' }}
                        >
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            <main className={cn('mx-auto w-full max-w-xl flex-1 px-4 py-10 sm:py-14', contentClassName)}>
                {back && (
                    <Link
                        to={back.to}
                        className="text-brand-700 hover:text-brand-800 mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {back.label}
                    </Link>
                )}
                {children}
            </main>

            <Footer />
        </div>
    )
}
