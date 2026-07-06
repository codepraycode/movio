import { Progress } from '@/components/ui/Progress'

interface ProgressBarProps {
    current: number
    total: number
    /** Noun for the count, e.g. "Question" → "Question 2 of 4". */
    label?: string
    /** Optional context shown on the right instead of the percentage. */
    context?: string
}

/** Progress indicator: "<label> X of N" + a filled progress track. */
export function ProgressBar({ current, total, label = 'Step', context }: ProgressBarProps) {
    const value = (current / total) * 100
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
                <span>
                    {label} {current} of {total}
                </span>
                <span>{context ?? `${Math.round(value)}%`}</span>
            </div>
            <Progress value={value} />
        </div>
    )
}
