import { cn } from '@/lib/utils'
import type { AnswerKey, SurveyAnswers } from '@/lib/survey'

interface Row {
    key: AnswerKey
    label: string
}

interface ModeRatingGridProps {
    rows: Row[]
    answers: SurveyAnswers
    onChange: (key: AnswerKey, value: number | null) => void
}

const SCORES = [1, 2, 3, 4, 5]

/**
 * Compact per-mode rating matrix: one row per transport mode, each rated 1–5.
 * Tapping the selected score again clears it (so a mode you don't use stays
 * blank). Gives comparable, per-mode data without repeating the whole section.
 */
export function ModeRatingGrid({ rows, answers, onChange }: ModeRatingGridProps) {
    return (
        <div className="flex flex-col gap-2.5">
            {rows.map((row) => {
                const value = answers[row.key] as number | null
                return (
                    <div
                        key={row.key}
                        className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5"
                    >
                        <span className="text-sm font-medium text-neutral-800">{row.label}</span>
                        <div className="flex gap-1.5" role="group" aria-label={`Rate ${row.label}`}>
                            {SCORES.map((n) => {
                                const active = value === n
                                return (
                                    <button
                                        key={n}
                                        type="button"
                                        aria-pressed={active}
                                        onClick={() => onChange(row.key, active ? null : n)}
                                        className={cn(
                                            'h-9 w-9 rounded-lg border text-sm font-semibold transition-all',
                                            active
                                                ? 'border-brand-500 bg-brand-500 animate-pop text-white shadow-sm'
                                                : 'hover:border-brand-300 hover:bg-brand-50 border-neutral-200 bg-white text-neutral-600',
                                        )}
                                    >
                                        {n}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
