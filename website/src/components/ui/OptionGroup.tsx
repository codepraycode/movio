import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Option {
    value: string
    label: string
}

/** Shared row chrome for a selectable option (radio or checkbox). */
function optionRowClass(checked: boolean, disabled = false) {
    return cn(
        'group relative flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition-all',
        checked
            ? 'border-brand-500 bg-brand-50/70 text-brand-900 shadow-card'
            : 'border-neutral-200 bg-white',
        disabled
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:-translate-y-px hover:border-brand-300 hover:shadow-card active:translate-y-0 active:scale-[0.995]',
    )
}

/** Custom check indicator — round for radios, rounded-square for checkboxes. */
function Indicator({ checked, square }: { checked: boolean; square?: boolean }) {
    return (
        <span
            className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-colors',
                square ? 'rounded-md' : 'rounded-full',
                checked
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'group-hover:border-brand-400 border-neutral-300 bg-white text-transparent',
            )}
        >
            {checked &&
                (square ? (
                    <Check className="animate-pop h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                    <span className="animate-pop h-2 w-2 rounded-full bg-white" />
                ))}
        </span>
    )
}

interface RadioGroupProps {
    name: string
    options: Option[]
    value: string
    onChange: (value: string) => void
}

/** Single-select list rendered as tappable cards (mobile friendly). */
export function RadioGroup({ name, options, value, onChange }: RadioGroupProps) {
    return (
        <div className="flex flex-col gap-2.5">
            {options.map((opt) => {
                const checked = value === opt.value
                return (
                    <label key={opt.value} className={optionRowClass(checked)}>
                        <input
                            type="radio"
                            name={name}
                            value={opt.value}
                            checked={checked}
                            onChange={() => onChange(opt.value)}
                            className="sr-only"
                        />
                        <Indicator checked={checked} />
                        <span className="leading-snug">{opt.label}</span>
                    </label>
                )
            })}
        </div>
    )
}

interface CheckboxGroupProps {
    name: string
    options: Option[]
    values: string[]
    max?: number
    onChange: (values: string[]) => void
}

/** Multi-select list with an optional cap (disables unchecked rows at the cap). */
export function CheckboxGroup({ name, options, values, max, onChange }: CheckboxGroupProps) {
    const atCap = max !== undefined && values.length >= max

    const toggle = (value: string) => {
        if (values.includes(value)) {
            onChange(values.filter((v) => v !== value))
        } else if (!atCap) {
            onChange([...values, value])
        }
    }

    return (
        <div className="flex flex-col gap-2.5">
            {options.map((opt) => {
                const checked = values.includes(opt.value)
                const disabled = !checked && atCap
                return (
                    <label key={opt.value} className={optionRowClass(checked, disabled)}>
                        <input
                            type="checkbox"
                            name={name}
                            value={opt.value}
                            checked={checked}
                            disabled={disabled}
                            onChange={() => toggle(opt.value)}
                            className="sr-only"
                        />
                        <Indicator checked={checked} square />
                        <span className="leading-snug">{opt.label}</span>
                    </label>
                )
            })}
        </div>
    )
}
