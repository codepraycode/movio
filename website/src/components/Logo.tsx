import { useId } from 'react'
import { cn } from '@/lib/utils'

interface LogoMarkProps {
    className?: string
    /** Animate the GPS node with a pulsing ring. */
    animated?: boolean
}

/**
 * Movio logomark — an "M" drawn as a route/road with a live GPS node at its
 * centre. Reads as movement + real-time tracking, the heart of Movio.
 */
export function LogoMark({ className, animated = false }: LogoMarkProps) {
    const id = useId()
    return (
        <svg viewBox="0 0 40 40" className={className} role="img" aria-label="Movio" fill="none">
            <defs>
                <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#22c55e" />
                    <stop offset="1" stopColor="#0f7a52" />
                </linearGradient>
            </defs>

            <rect width="40" height="40" rx="11" fill={`url(#${id}-bg)`} />

            {/* The route, shaped like an M */}
            <path
                d="M10 29 V14 L20 24 L30 14 V29"
                stroke="white"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.95"
            />

            {/* Live GPS node at the junction */}
            {animated && (
                <circle cx="20" cy="24" r="3" fill="white" opacity="0.5">
                    <animate attributeName="r" values="3;7;3" dur="2.2s" repeatCount="indefinite" />
                    <animate
                        attributeName="opacity"
                        values="0.5;0;0.5"
                        dur="2.2s"
                        repeatCount="indefinite"
                    />
                </circle>
            )}
            <circle cx="20" cy="24" r="3.4" fill="white" />
            <circle cx="20" cy="24" r="1.7" fill="#0f7a52" />
        </svg>
    )
}

interface LogoProps {
    className?: string
    markClassName?: string
    animated?: boolean
}

/** Full Movio lockup: mark + wordmark. */
export function Logo({ className, markClassName, animated }: LogoProps) {
    return (
        <span className={cn('inline-flex items-center gap-2', className)}>
            <LogoMark className={cn('h-8 w-8', markClassName)} animated={animated} />
            <span className="text-xl font-extrabold tracking-tight text-neutral-900">
                Mov<span className="text-brand-600">io</span>
            </span>
        </span>
    )
}
