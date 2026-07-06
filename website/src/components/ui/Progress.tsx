import { cn } from '@/lib/utils'

interface ProgressProps {
    /** 0–100 */
    value: number
    className?: string
}

export function Progress({ value, className }: ProgressProps) {
    return (
        <div
            className={cn('h-2.5 w-full overflow-hidden rounded-full bg-neutral-200/80', className)}
            role="progressbar"
            aria-valuenow={Math.round(value)}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            <div
                className="from-brand-400 to-brand-600 relative h-full rounded-full bg-gradient-to-r shadow-[0_0_12px_rgba(34,197,94,0.45)] transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            >
                <span className="absolute top-1/2 right-0 h-3.5 w-1.5 -translate-y-1/2 rounded-full bg-white/80" />
            </div>
        </div>
    )
}
