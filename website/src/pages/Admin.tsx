import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
    Lock,
    LogOut,
    RefreshCw,
    Download,
    Users,
    ClipboardList,
    Gauge,
    UserMinus,
    AlertCircle,
    DoorOpen,
    DoorClosed,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import { DEFAULT_SURVEY_OPEN, setSurveyOpen } from '@/lib/settings'
import { surveySteps } from '@/lib/survey'
import type { Question } from '@/lib/survey'
import {
    isUnlocked,
    unlock,
    lock,
    distributionFor,
    tallyMultiSelect,
    averageRating,
    textResponses,
    gatedOutCount,
    surveyResponsesCsv,
    waitlistCsv,
    downloadFile,
    exportStamp,
    type SurveyResponseRow,
    type WaitlistRow,
    type Bucket,
} from '@/lib/admin'

// ---------------------------------------------------------------------------
// Access gate
// ---------------------------------------------------------------------------

const LoginGate = ({ onUnlock }: { onUnlock: () => void }) => {
    const [token, setToken] = useState('')
    const [error, setError] = useState(false)

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (unlock(token)) {
            onUnlock()
        } else {
            setError(true)
            setToken('')
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
            <Card className="w-full max-w-sm">
                <CardContent className="space-y-5">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <span className="bg-brand-50 text-brand-600 flex h-12 w-12 items-center justify-center rounded-full">
                            <Lock className="h-6 w-6" />
                        </span>
                        <div>
                            <h1 className="text-lg font-semibold text-neutral-900">Admin access</h1>
                            <p className="mt-1 text-sm text-neutral-500">
                                Enter your 6-character access code to view survey insights.
                            </p>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input
                            autoFocus
                            value={token}
                            onChange={(e) => {
                                setToken(e.target.value)
                                setError(false)
                            }}
                            maxLength={6}
                            placeholder="••••••"
                            aria-label="Access code"
                            className="focus-visible:ring-brand-500/60 h-12 w-full rounded-lg border border-neutral-300 bg-white text-center text-lg font-semibold tracking-[0.4em] text-neutral-900 uppercase outline-none focus-visible:ring-2"
                        />
                        {error && (
                            <p className="flex items-center justify-center gap-1.5 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" /> Incorrect code — try again.
                            </p>
                        )}
                        <Button type="submit" size="lg" className="w-full">
                            Unlock dashboard
                        </Button>
                    </form>
                    <Link
                        to="/"
                        className="block text-center text-xs text-neutral-400 transition-colors hover:text-neutral-600"
                    >
                        ← Back to site
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Presentational pieces
// ---------------------------------------------------------------------------

const StatCard = ({
    icon: Icon,
    label,
    value,
    sub,
}: {
    icon: typeof Users
    label: string
    value: string
    sub?: string
}) => (
    <Card>
        <CardContent className="flex items-start gap-3 p-5">
            <span className="bg-brand-50 text-brand-600 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
                <p className="text-2xl font-bold text-neutral-900">{value}</p>
                <p className="text-sm font-medium text-neutral-600">{label}</p>
                {sub && <p className="mt-0.5 text-xs text-neutral-400">{sub}</p>}
            </div>
        </CardContent>
    </Card>
)

const BarRow = ({ bucket, max }: { bucket: Bucket; max: number }) => (
    <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-neutral-700">{bucket.label}</span>
            <span className="shrink-0 tabular-nums text-neutral-500">
                {bucket.count}
                <span className="ml-1 text-neutral-400">({Math.round(bucket.pct)}%)</span>
            </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
                className="bg-brand-500 h-full rounded-full transition-all"
                style={{ width: `${max === 0 ? 0 : (bucket.count / max) * 100}%` }}
            />
        </div>
    </div>
)

const ChartCard = ({
    number,
    title,
    buckets,
}: {
    number: string
    title: string
    buckets: Bucket[]
}) => {
    const max = Math.max(0, ...buckets.map((b) => b.count))
    return (
        <Card>
            <CardContent className="space-y-4">
                <div>
                    <span className="text-brand-600 text-xs font-semibold">{number}</span>
                    <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
                </div>
                <div className="space-y-3">
                    {buckets.map((b) => (
                        <BarRow key={b.label} bucket={b} max={max} />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

const RatingBadge = ({ label, avg, n }: { label: string; avg: number | null; n: number }) => (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <p className="text-sm font-medium text-neutral-600">{label}</p>
        <p className="mt-1 text-2xl font-bold text-neutral-900">
            {avg === null ? '—' : avg.toFixed(1)}
            <span className="ml-1 text-sm font-normal text-neutral-400">/ 5</span>
        </p>
        <p className="text-xs text-neutral-400">{n} rated</p>
    </div>
)

const TextList = ({
    title,
    items,
}: {
    title: string
    items: { text: string; date: string }[]
}) => (
    <Card>
        <CardContent className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900">
                {title}
                <span className="ml-2 text-xs font-normal text-neutral-400">{items.length}</span>
            </h3>
            {items.length === 0 ? (
                <p className="text-sm text-neutral-400">No responses yet.</p>
            ) : (
                <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
                    {items.map((item, i) => (
                        <li
                            key={i}
                            className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm text-neutral-700"
                        >
                            <p>“{item.text}”</p>
                            <p className="mt-1 text-xs text-neutral-400">
                                {new Date(item.date).toLocaleDateString()}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </CardContent>
    </Card>
)

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

/** Every single-choice question, flattened with its display number + label. */
const SINGLE_CHOICE: Question[] = surveySteps
    .flatMap((step) => step.questions)
    .filter((q) => q.type === 'radio' || q.type === 'scale')

const Dashboard = ({ onLock }: { onLock: () => void }) => {
    const { toast } = useToast()
    const [responses, setResponses] = useState<SurveyResponseRow[]>([])
    const [waitlist, setWaitlist] = useState<WaitlistRow[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    // Survey open/closed flag (null until first load). Toggled below.
    const [surveyOpen, setSurveyOpenState] = useState<boolean | null>(null)
    const [savingStatus, setSavingStatus] = useState(false)

    // All setState happens after the first `await`, so this is safe to call
    // straight from the mount effect (no synchronous render cascade). The
    // spinner-on is handled by the refresh handler / initial `loading` state.
    const load = useCallback(async () => {
        try {
            const [resResult, waitResult, settingsResult] = await Promise.all([
                supabase
                    .from('survey_responses')
                    .select('*')
                    .order('created_at', { ascending: false }),
                supabase.from('waitlist').select('*').order('created_at', { ascending: false }),
                supabase.from('app_settings').select('survey_open').eq('id', 1).maybeSingle(),
            ])

            if (resResult.error) throw resResult.error
            // Waitlist read may be blocked by RLS even when responses succeed —
            // treat it as non-fatal so the dashboard still renders.
            setResponses((resResult.data ?? []) as SurveyResponseRow[])
            setWaitlist((waitResult.data ?? []) as WaitlistRow[])
            // Settings read is non-fatal too — fall back to the default flag.
            setSurveyOpenState(settingsResult.data?.survey_open ?? DEFAULT_SURVEY_OPEN)
            setLoadError(null)
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Could not load data. Check the Supabase SELECT policy (supabase/schema.sql).'
            setLoadError(message)
        } finally {
            setLoading(false)
        }
    }, [])

    const refresh = useCallback(() => {
        setLoading(true)
        setLoadError(null)
        void load()
    }, [load])

    useEffect(() => {
        // Fetch-on-mount. Every setState inside `load` runs after the first
        // `await`, so there's no synchronous render cascade — the lint rule
        // just can't see through the useCallback/await boundary.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load()
    }, [load])

    const stats = useMemo(() => {
        const total = responses.length
        const gatedOut = gatedOutCount(responses)
        const overall = averageRating(responses, 'satisfaction_score')
        return {
            total,
            gatedOut,
            completed: total - gatedOut,
            overall,
        }
    }, [responses])

    const ratings = useMemo(
        () => ({
            shuttle: averageRating(responses, 'shuttle_rating'),
            keke: averageRating(responses, 'keke_rating'),
            cab: averageRating(responses, 'cab_rating'),
        }),
        [responses],
    )

    const modeTally = useMemo(() => tallyMultiSelect(responses, 'transport_modes'), [responses])
    const featureTally = useMemo(() => tallyMultiSelect(responses, 'desired_features'), [responses])
    const problems = useMemo(() => textResponses(responses, 'biggest_problem'), [responses])
    const comments = useMemo(() => textResponses(responses, 'additional_comments'), [responses])

    const handleLogout = () => {
        lock()
        onLock()
    }

    const handleToggleSurvey = async () => {
        if (surveyOpen === null || savingStatus) return
        const next = !surveyOpen
        setSavingStatus(true)
        const { error } = await setSurveyOpen(next)
        setSavingStatus(false)
        if (error) {
            toast({
                variant: 'error',
                title: 'Couldn’t update survey status',
                description: error,
            })
            return
        }
        setSurveyOpenState(next)
        toast({
            variant: 'success',
            title: next ? 'Survey reopened' : 'Survey closed',
            description: next
                ? 'Students can now submit responses again.'
                : 'The survey page now shows the “survey has ended” screen.',
        })
    }

    const exportSurveyCsv = () => {
        if (responses.length === 0) {
            toast({ title: 'Nothing to export yet', variant: 'info' })
            return
        }
        downloadFile(
            `movio-survey-${exportStamp()}.csv`,
            surveyResponsesCsv(responses),
            'text/csv;charset=utf-8',
        )
        toast({ title: `Exported ${responses.length} responses`, variant: 'success' })
    }

    const exportSurveyJson = () => {
        if (responses.length === 0) {
            toast({ title: 'Nothing to export yet', variant: 'info' })
            return
        }
        downloadFile(
            `movio-survey-${exportStamp()}.json`,
            JSON.stringify(responses, null, 2),
            'application/json',
        )
        toast({ title: `Exported ${responses.length} responses`, variant: 'success' })
    }

    const exportWaitlistCsv = () => {
        if (waitlist.length === 0) {
            toast({ title: 'Waitlist is empty', variant: 'info' })
            return
        }
        downloadFile(
            `movio-waitlist-${exportStamp()}.csv`,
            waitlistCsv(waitlist),
            'text/csv;charset=utf-8',
        )
        toast({ title: `Exported ${waitlist.length} signups`, variant: 'success' })
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="transition-transform hover:scale-[1.03]">
                            <Logo />
                        </Link>
                        <span className="bg-brand-50 text-brand-700 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                            Admin
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={refresh} loading={loading}>
                            <RefreshCw className="h-4 w-4" /> Refresh
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleLogout}>
                            <LogOut className="h-4 w-4" /> Lock
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
                {loadError && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="flex items-start gap-3 p-5">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                            <div className="text-sm text-red-700">
                                <p className="font-medium">Couldn’t load responses.</p>
                                <p className="mt-1">{loadError}</p>
                                <p className="mt-2 text-red-600/80">
                                    Reads are blocked unless a Supabase RLS{' '}
                                    <code className="rounded bg-red-100 px-1">SELECT</code> policy is
                                    enabled. Run the updated <code>supabase/schema.sql</code> in your
                                    project’s SQL editor.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Export bar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-neutral-900">Survey insights</h1>
                        <p className="text-sm text-neutral-500">
                            FUTA campus transport — live from Supabase.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="primary" size="sm" onClick={exportSurveyCsv}>
                            <Download className="h-4 w-4" /> Responses CSV
                        </Button>
                        <Button variant="secondary" size="sm" onClick={exportSurveyJson}>
                            <Download className="h-4 w-4" /> JSON
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportWaitlistCsv}>
                            <Download className="h-4 w-4" /> Waitlist CSV
                        </Button>
                    </div>
                </div>

                {/* Survey open/closed switch */}
                {surveyOpen !== null && (
                    <Card
                        className={
                            surveyOpen
                                ? 'border-brand-200 bg-brand-50/50'
                                : 'border-amber-200 bg-amber-50/60'
                        }
                    >
                        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                <span
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                        surveyOpen
                                            ? 'bg-brand-100 text-brand-700'
                                            : 'bg-amber-100 text-amber-700'
                                    }`}
                                >
                                    {surveyOpen ? (
                                        <DoorOpen className="h-5 w-5" />
                                    ) : (
                                        <DoorClosed className="h-5 w-5" />
                                    )}
                                </span>
                                <div>
                                    <p className="font-semibold text-neutral-900">
                                        Survey is {surveyOpen ? 'open' : 'closed'}
                                    </p>
                                    <p className="text-sm text-neutral-500">
                                        {surveyOpen
                                            ? 'Students can fill out and submit the survey.'
                                            : 'The /survey page shows the “survey has ended” screen — no new responses.'}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant={surveyOpen ? 'outline' : 'primary'}
                                size="sm"
                                loading={savingStatus}
                                onClick={() => void handleToggleSurvey()}
                            >
                                {surveyOpen ? (
                                    <>
                                        <DoorClosed className="h-4 w-4" /> Close survey
                                    </>
                                ) : (
                                    <>
                                        <DoorOpen className="h-4 w-4" /> Reopen survey
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Top-line stats */}
                <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard
                        icon={ClipboardList}
                        label="Total responses"
                        value={String(stats.total)}
                    />
                    <StatCard
                        icon={Gauge}
                        label="Avg. satisfaction"
                        value={stats.overall.avg === null ? '—' : `${stats.overall.avg.toFixed(1)}`}
                        sub="out of 5"
                    />
                    <StatCard
                        icon={Users}
                        label="Waitlist signups"
                        value={String(waitlist.length)}
                    />
                    <StatCard
                        icon={UserMinus}
                        label="Gated out at Q2"
                        value={String(stats.gatedOut)}
                        sub="don’t use campus transport"
                    />
                </section>

                {/* Per-mode satisfaction */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
                        Satisfaction by mode
                    </h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <RatingBadge label="Shuttle" avg={ratings.shuttle.avg} n={ratings.shuttle.n} />
                        <RatingBadge label="Keke" avg={ratings.keke.avg} n={ratings.keke.n} />
                        <RatingBadge label="Cab" avg={ratings.cab.avg} n={ratings.cab.n} />
                        <RatingBadge
                            label="Overall"
                            avg={stats.overall.avg}
                            n={stats.overall.n}
                        />
                    </div>
                </section>

                {/* Multi-selects */}
                <section className="grid gap-4 md:grid-cols-2">
                    <ChartCard
                        number="Q3"
                        title="Modes used (select all)"
                        buckets={modeTally}
                    />
                    <ChartCard
                        number="Q16"
                        title="Most-wanted features (up to 3)"
                        buckets={featureTally}
                    />
                </section>

                {/* Single-choice distributions */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
                        Question breakdown
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {SINGLE_CHOICE.map((q) => (
                            <ChartCard
                                key={q.key}
                                number={q.number}
                                title={q.label}
                                buckets={distributionFor(q, responses)}
                            />
                        ))}
                    </div>
                </section>

                {/* Free text */}
                <section className="grid gap-4 md:grid-cols-2">
                    <TextList title="Biggest problems (Q12)" items={problems} />
                    <TextList title="Additional comments (Q18)" items={comments} />
                </section>

                <p className="pt-4 text-center text-xs text-neutral-400">
                    {stats.total} responses · {waitlist.length} waitlist signups · refreshed{' '}
                    {new Date().toLocaleTimeString()}
                </p>
            </main>
        </div>
    )
}

// ---------------------------------------------------------------------------

export const Admin = () => {
    const [unlocked, setUnlocked] = useState(isUnlocked)

    if (!unlocked) return <LoginGate onUnlock={() => setUnlocked(true)} />
    return <Dashboard onLock={() => setUnlocked(false)} />
}
