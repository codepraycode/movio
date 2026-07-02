import { useCallback, useEffect, useState } from 'react'
import {
    CheckCircle2,
    CircleDashed,
    Clock,
    TriangleAlert,
    XCircle,
    type LucideIcon,
} from 'lucide-react'
import { API_ORIGIN } from '../../lib/api'

interface HealthBody {
    service: string
    status: 'ok' | 'degraded'
    uptime_seconds: number
    timestamp: string
    checks: { database: { status: 'ok' | 'down'; latency_ms: number } }
}

type WidgetState = 'checking' | 'ok' | 'degraded' | 'slow' | 'down'

const POLL_INTERVAL_MS = 15_000
const TIMEOUT_MS = 10_000

// This dashboard is used by transport-office admin staff, not engineers - the
// visible label always stays in plain language. Technical detail (which check
// failed, latency in ms) is still available via the row's title tooltip for
// whoever actually needs it, but it's never the primary message.
// Colors stay inside the brief's 4-token functional palette (docs/admin_design_brief.md) -
// sustain-green is reserved exclusively for the Sustainability panel, so "ok"
// uses the brand blue rather than a second green accent. State is never
// color-only: every row pairs a distinct icon with its label.
const STATUS_META: Record<WidgetState, { className: string; icon: LucideIcon; label: string }> = {
    checking: { className: 'text-ink/40', icon: CircleDashed, label: 'Checking system status…' },
    ok: { className: 'text-brand', icon: CheckCircle2, label: 'All systems normal' },
    degraded: {
        className: 'text-signal',
        icon: TriangleAlert,
        label: 'Some features may be slower than usual',
    },
    slow: { className: 'text-signal', icon: Clock, label: 'Taking longer than usual to respond' },
    down: { className: 'text-alert', icon: XCircle, label: 'System temporarily unavailable' },
}

function buildDetail(state: WidgetState, health: HealthBody | null): string {
    if (state === 'checking') return 'Waiting for the first check.'
    if (state === 'slow') return 'No response within 10s - the server may be starting back up.'
    if (state === 'down') return 'Could not reach the server.'
    if (health)
        return `Database: ${health.checks.database.status} (${health.checks.database.latency_ms}ms) · uptime ${health.uptime_seconds}s`
    return ''
}

export function StatusFooter() {
    const [state, setState] = useState<WidgetState>('checking')
    const [health, setHealth] = useState<HealthBody | null>(null)
    const [lastChecked, setLastChecked] = useState<Date | null>(null)
    const [isChecking, setIsChecking] = useState(false)

    const check = useCallback(async () => {
        setIsChecking(true)
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

        try {
            const response = await fetch(`${API_ORIGIN}/health`, { signal: controller.signal })
            const body = (await response.json()) as HealthBody
            setHealth(body)
            setState(body.status === 'ok' ? 'ok' : 'degraded')
        } catch (err) {
            setHealth(null)
            // AbortError means our own timeout fired with no response yet (likely
            // a cold start) - anything else is a real connection failure.
            setState((err as Error).name === 'AbortError' ? 'slow' : 'down')
        } finally {
            clearTimeout(timeout)
            setLastChecked(new Date())
            setIsChecking(false)
        }
    }, [])

    useEffect(() => {
        // setTimeout(…, 0) defers the initial poll off the effect's synchronous
        // call stack - calling an async setState-triggering function directly
        // in an effect body risks cascading renders (react-hooks/set-state-in-effect).
        const initial = setTimeout(check, 0)
        const interval = setInterval(check, POLL_INTERVAL_MS)
        return () => {
            clearTimeout(initial)
            clearInterval(interval)
        }
    }, [check])

    const meta = STATUS_META[state]
    const Icon = meta.icon

    return (
        <footer className="h-10 shrink-0 flex items-center justify-between gap-4 px-6 border-t border-line bg-surface text-xs">
            <div
                role="status"
                aria-live="polite"
                title={buildDetail(state, health)}
                className="flex items-center gap-2 min-w-0"
            >
                <Icon className={`h-4 w-4 shrink-0 ${meta.className}`} aria-hidden="true" />
                <span className="font-medium text-ink truncate">{meta.label}</span>
            </div>

            <div className="flex items-center gap-3 shrink-0 text-ink/40 font-mono">
                {lastChecked && (
                    <span>
                        Updated{' '}
                        {lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
                <button
                    onClick={check}
                    disabled={isChecking}
                    className="font-sans font-medium text-brand hover:text-brand/80 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-brand/40 outline-none rounded px-1"
                >
                    {isChecking ? 'Checking…' : 'Refresh'}
                </button>
            </div>
        </footer>
    )
}
