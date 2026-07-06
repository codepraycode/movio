import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Textarea = forwardRef<
    HTMLTextAreaElement,
    TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
    <textarea
        ref={ref}
        className={cn(
            'min-h-24 w-full resize-y rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm',
            'placeholder:text-neutral-400',
            'focus:border-brand-500 focus:ring-brand-500/30 focus:ring-2 focus:outline-none',
            className,
        )}
        {...props}
    />
))

Textarea.displayName = 'Textarea'
