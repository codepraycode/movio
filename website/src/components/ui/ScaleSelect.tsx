import { cn } from '@/lib/utils'

interface Option {
    value: string
    label: string
}

interface ScaleSelectProps {
    name: string
    options: Option[]
    value: string
    onChange: (value: string) => void
}

/** Emoji cue per 1–5 rating, dissatisfied → satisfied. */
const faces = ['😣', '🙁', '😐', '🙂', '😄']

/**
 * A segmented 1–5 satisfaction selector. Reads far faster than a stack of
 * radio rows and gives the survey a tactile, product-grade moment.
 */
export function ScaleSelect({ name, options, value, onChange }: ScaleSelectProps) {
    const selected = options.find((o) => o.value === value)
    // Labels arrive as "3 — Neutral"; show just the descriptor below the scale.
    const descriptor = selected?.label.split('—').pop()?.trim()

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2">
                {options.map((opt, i) => {
                    const checked = value === opt.value
                    return (
                        <label
                            key={opt.value}
                            className={cn(
                                'flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 px-1 py-3 transition-all',
                                checked
                                    ? 'border-brand-500 bg-brand-50 shadow-card'
                                    : 'hover:border-brand-300 hover:shadow-card border-neutral-200 bg-white hover:-translate-y-px',
                            )}
                        >
                            <input
                                type="radio"
                                name={name}
                                value={opt.value}
                                checked={checked}
                                onChange={() => onChange(opt.value)}
                                className="sr-only"
                            />
                            <span
                                className={cn(
                                    'text-2xl transition-transform',
                                    checked
                                        ? 'animate-pop scale-110'
                                        : 'opacity-70 grayscale-[0.4]',
                                )}
                                aria-hidden
                            >
                                {faces[i] ?? '•'}
                            </span>
                            <span
                                className={cn(
                                    'text-sm font-bold',
                                    checked ? 'text-brand-700' : 'text-neutral-500',
                                )}
                            >
                                {i + 1}
                            </span>
                        </label>
                    )
                })}
            </div>
            <p className="text-brand-700 h-5 text-center text-sm font-medium">
                {descriptor ? `You picked: ${descriptor}` : ' '}
            </p>
        </div>
    )
}
