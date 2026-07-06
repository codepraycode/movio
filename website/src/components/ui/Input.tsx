import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => (
        <input
            ref={ref}
            className={cn(
                'h-11 w-full rounded-lg border border-neutral-300 bg-white px-3.5 text-sm',
                'placeholder:text-neutral-400',
                'focus:border-brand-500 focus:ring-brand-500/30 focus:ring-2 focus:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-60',
                className,
            )}
            {...props}
        />
    ),
)

Input.displayName = 'Input'
