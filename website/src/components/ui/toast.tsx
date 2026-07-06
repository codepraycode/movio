import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'error' | 'info'

interface Toast {
    id: number
    title: string
    description?: string
    variant: ToastVariant
}

interface ToastContextValue {
    toast: (t: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
}

const accents: Record<ToastVariant, string> = {
    success: 'text-brand-600',
    error: 'text-red-600',
    info: 'text-neutral-600',
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])
    const idRef = useRef(0)

    const dismiss = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const toast = useCallback((t: Omit<Toast, 'id'>) => {
        const id = ++idRef.current
        setToasts((prev) => [...prev, { ...t, id }])
    }, [])

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const Icon = icons[toast.variant]

    useEffect(() => {
        const timer = setTimeout(onDismiss, 5000)
        return () => clearTimeout(timer)
    }, [onDismiss])

    return (
        <div
            className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-neutral-200',
                'bg-white p-4 shadow-lg',
            )}
            role="status"
        >
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', accents[toast.variant])} />
            <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">{toast.title}</p>
                {toast.description && (
                    <p className="mt-0.5 text-sm text-neutral-600">{toast.description}</p>
                )}
            </div>
            <button
                onClick={onDismiss}
                className="text-neutral-400 transition-colors hover:text-neutral-700"
                aria-label="Dismiss notification"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used within a ToastProvider')
    return ctx
}
