import { useCallback, useEffect, useState } from 'react'
import { API_ORIGIN } from '../lib/api'

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

// Status colors are the fixed, pre-validated good/warning/serious/critical set
// (see the dataviz skill's palette.md) - never reused for anything else, and
// always paired with a text label since warning/serious fall under 3:1 contrast
// on a light surface and can't carry meaning through color alone.
const STATUS_META: Record<WidgetState, { color: string; label: string; detail: string }> = {
    checking: {
        color: '#94a3b8',
        label: 'Checking…',
        detail: 'Contacting the backend for the first time.',
    },
    ok: {
        color: '#0ca30c',
        label: 'Operational',
        detail: 'Backend and database are both responding normally.',
    },
    degraded: {
        color: '#fab219',
        label: 'Degraded',
        detail: 'Backend is reachable but the database is not.',
    },
    slow: {
        color: '#ec835a',
        label: 'Slow to respond',
        detail: 'No response within 10s - possibly waking up from an idle sleep (Render free-tier cold start).',
    },
    down: {
        color: '#d03b3b',
        label: 'Unreachable',
        detail: 'The backend is not responding. Confirm it is running.',
    },
}

function formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
}

export function SystemStatusCard() {
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

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-slate-900">System status</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        {lastChecked
                            ? `Last checked ${lastChecked.toLocaleTimeString()}`
                            : 'Not checked yet'}
                    </p>
                </div>
                <button
                    onClick={check}
                    disabled={isChecking}
                    className="text-xs font-medium text-brand hover:text-brand/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isChecking ? 'Checking…' : 'Refresh'}
                </button>
            </div>

            <div role="status" aria-live="polite" className="mt-4 flex items-center gap-2">
                <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: meta.color }}
                    aria-hidden="true"
                />
                <span className="text-sm font-semibold text-slate-900">{meta.label}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{meta.detail}</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] text-slate-400">Database latency</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                        {health ? `${health.checks.database.latency_ms} ms` : '—'}
                    </p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] text-slate-400">Backend uptime</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                        {health ? formatUptime(health.uptime_seconds) : '—'}
                    </p>
                </div>
            </div>
        </div>
    )
}
