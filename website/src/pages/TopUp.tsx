import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
    ArrowRight,
    BadgeCheck,
    CheckCircle2,
    CreditCard,
    Loader2,
    Lock,
    ShieldCheck,
    Ticket,
    Wallet,
} from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useToast } from '@/components/ui/toast'
import {
    FARE_NAIRA,
    initiateTopup,
    verifyTopup,
    type InitiateTopupResult,
} from '@/lib/wallet-api'
import { ApiError } from '@/lib/backend'
import { cn } from '@/lib/utils'

const PRESETS = [1, 3, 5, 10] // credits
const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`

type Step = 'identify' | 'confirm' | 'done'

const STEPS: { key: Step; label: string }[] = [
    { key: 'identify', label: 'Account & amount' },
    { key: 'confirm', label: 'Confirm & pay' },
    { key: 'done', label: 'Done' },
]

export function TopUp() {
    const { toast } = useToast()
    const [step, setStep] = useState<Step>('identify')

    // Step 1 inputs
    const [identifier, setIdentifier] = useState('')
    const [credits, setCredits] = useState(3)
    const [customNaira, setCustomNaira] = useState('')
    const [customMode, setCustomMode] = useState(false)

    // Flow state
    const [initiating, setInitiating] = useState(false)
    const [paying, setPaying] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [session, setSession] = useState<InitiateTopupResult | null>(null)
    const [receipt, setReceipt] = useState<{ first_name: string; credits_added: number } | null>(null)

    const amountNaira = useMemo(() => {
        if (customMode) {
            const n = parseInt(customNaira, 10)
            return Number.isFinite(n) ? n : 0
        }
        return credits * FARE_NAIRA
    }, [customMode, customNaira, credits])

    const previewCredits = Math.floor(amountNaira / FARE_NAIRA)
    const amountValid = amountNaira >= FARE_NAIRA

    async function handleIdentify(e: FormEvent) {
        e.preventDefault()
        if (initiating) return
        setError(null)

        if (!identifier.trim()) {
            setError('Enter your matric number or email.')
            return
        }
        if (!amountValid) {
            setError(`The minimum top-up is ${naira(FARE_NAIRA)} (one Transit Credit).`)
            return
        }

        setInitiating(true)
        try {
            const result = await initiateTopup(identifier, amountNaira)
            setSession(result)
            setStep('confirm')
        } catch (err) {
            const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.'
            setError(msg)
        } finally {
            setInitiating(false)
        }
    }

    async function handlePay() {
        if (!session || paying) return
        setError(null)
        setPaying(true)
        try {
            const { default: PaystackPop } = await import('@paystack/inline-js')
            const popup = new PaystackPop()
            popup.resumeTransaction(session.access_code, {
                onSuccess: async () => {
                    try {
                        const verified = await verifyTopup(session.reference)
                        setReceipt({
                            first_name: verified.first_name,
                            credits_added: verified.credits_added || session.credits,
                        })
                        setStep('done')
                    } catch (err) {
                        const msg =
                            err instanceof ApiError
                                ? err.message
                                : 'Payment went through but we could not confirm it. Please contact support before retrying.'
                        setError(msg)
                        toast({ variant: 'error', title: 'Could not confirm payment', description: msg })
                    } finally {
                        setPaying(false)
                    }
                },
                onCancel: () => {
                    setPaying(false)
                    toast({ variant: 'info', title: 'Payment cancelled' })
                },
                onError: (err: { message?: string }) => {
                    setPaying(false)
                    setError(err?.message ?? 'Payment failed. Please try again.')
                },
            })
        } catch {
            setPaying(false)
            setError('Could not open the payment window. Please refresh and try again.')
        }
    }

    function reset() {
        setStep('identify')
        setSession(null)
        setReceipt(null)
        setError(null)
        setPaying(false)
    }

    const activeIndex = STEPS.findIndex((s) => s.key === step)

    return (
        <PageShell
            eyebrow="Transit Credit"
            icon={<Wallet className="h-7 w-7" />}
            title="Top up your Transit Credit"
            subtitle="Add credits to a Movio wallet without logging in — just your matric number or email. One credit is one boarding."
            seoTitle="Top up Transit Credit — Movio | FUTA"
            seoDescription="Add Transit Credit to your Movio wallet by matric number or email. Secure Paystack payment, no login required."
            path="/topup"
        >
            {/* Stepper */}
            <ol className="mb-8 flex items-center justify-center gap-2">
                {STEPS.map((s, i) => {
                    const done = i < activeIndex
                    const active = i === activeIndex
                    return (
                        <li key={s.key} className="flex items-center gap-2">
                            <span
                                className={cn(
                                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                                    done && 'bg-brand-600 text-white',
                                    active && 'bg-brand-100 text-brand-700 ring-2 ring-brand-500',
                                    !done && !active && 'bg-neutral-100 text-neutral-400',
                                )}
                            >
                                {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                            </span>
                            <span
                                className={cn(
                                    'hidden text-xs font-medium sm:inline',
                                    active ? 'text-neutral-900' : 'text-neutral-400',
                                )}
                            >
                                {s.label}
                            </span>
                            {i < STEPS.length - 1 && (
                                <span
                                    className={cn(
                                        'h-px w-6 sm:w-8',
                                        i < activeIndex ? 'bg-brand-500' : 'bg-neutral-200',
                                    )}
                                />
                            )}
                        </li>
                    )
                })}
            </ol>

            {/* ── Step 1: identify + amount ── */}
            {step === 'identify' && (
                <form onSubmit={handleIdentify} className="animate-fade-up space-y-6">
                    <div className="shadow-card rounded-2xl border border-neutral-200 bg-white p-6">
                        <Label htmlFor="identifier">Matric number or email</Label>
                        <Input
                            id="identifier"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="e.g. CSC/17/1234 or you@futa.edu.ng"
                            autoComplete="off"
                            autoFocus
                        />
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
                            <Lock className="h-3.5 w-3.5" />
                            We only use this to find the right wallet. Nothing about the account is
                            shown back except a first name to confirm.
                        </p>
                    </div>

                    <div className="shadow-card rounded-2xl border border-neutral-200 bg-white p-6">
                        <Label>How many credits?</Label>
                        <div className="mt-1 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                            {PRESETS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => {
                                        setCredits(c)
                                        setCustomMode(false)
                                    }}
                                    className={cn(
                                        'flex flex-col items-center rounded-xl border-2 px-2 py-3 transition-all',
                                        !customMode && credits === c
                                            ? 'border-brand-500 bg-brand-50'
                                            : 'border-neutral-200 hover:border-brand-200',
                                    )}
                                >
                                    <span className="text-brand-700 text-lg font-bold">{c}</span>
                                    <span className="text-[11px] text-neutral-500">
                                        {c === 1 ? 'credit' : 'credits'}
                                    </span>
                                    <span className="mt-1 text-xs font-semibold text-neutral-700">
                                        {naira(c * FARE_NAIRA)}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => setCustomMode(true)}
                            className={cn(
                                'mt-3 text-sm font-medium transition-colors',
                                customMode ? 'text-brand-700' : 'text-neutral-500 hover:text-brand-700',
                            )}
                        >
                            Enter a custom amount
                        </button>

                        {customMode && (
                            <div className="animate-fade-up mt-3">
                                <div className="relative">
                                    <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-semibold text-neutral-500">
                                        ₦
                                    </span>
                                    <Input
                                        type="number"
                                        inputMode="numeric"
                                        min={FARE_NAIRA}
                                        step={FARE_NAIRA}
                                        value={customNaira}
                                        onChange={(e) => setCustomNaira(e.target.value)}
                                        placeholder={String(FARE_NAIRA)}
                                        className="pl-7"
                                        autoFocus
                                    />
                                </div>
                                <p className="mt-2 text-xs text-neutral-500">
                                    {previewCredits >= 1
                                        ? `That's ${previewCredits} ${previewCredits === 1 ? 'credit' : 'credits'} (₦${FARE_NAIRA} each). Any remainder isn't charged.`
                                        : `Minimum ${naira(FARE_NAIRA)} — one Transit Credit.`}
                                </p>
                            </div>
                        )}
                    </div>

                    {error && <ErrorNote>{error}</ErrorNote>}

                    <Button type="submit" size="lg" loading={initiating} className="w-full">
                        {initiating ? 'Checking…' : `Continue — pay ${naira(amountNaira || 0)}`}
                        {!initiating && <ArrowRight className="h-4 w-4" />}
                    </Button>

                    <TrustRow />
                </form>
            )}

            {/* ── Step 2: confirm + pay ── */}
            {step === 'confirm' && session && (
                <div className="animate-fade-up space-y-6">
                    <div className="shadow-lift overflow-hidden rounded-2xl border border-brand-100">
                        <div className="from-brand-600 to-brand-700 bg-gradient-to-br px-6 py-7 text-white">
                            <p className="text-brand-100 text-xs font-semibold tracking-wide uppercase">
                                Topping up for
                            </p>
                            <p className="mt-1 flex items-center gap-2 text-2xl font-bold">
                                <BadgeCheck className="h-6 w-6" />
                                {session.first_name}
                            </p>
                        </div>
                        <div className="space-y-3 bg-white px-6 py-6">
                            <Row label="Credits" value={
                                <span className="text-brand-700 inline-flex items-center gap-1.5 font-bold">
                                    <Ticket className="h-4 w-4" />
                                    {session.credits} {session.credits === 1 ? 'credit' : 'credits'}
                                </span>
                            } />
                            <Row label="You pay" value={<span className="font-bold text-neutral-900">{naira(amountNaira)}</span>} />
                            <Row label="Rate" value={<span className="text-neutral-600">{naira(FARE_NAIRA)} per credit · one boarding each</span>} />
                        </div>
                    </div>

                    {error && <ErrorNote>{error}</ErrorNote>}

                    <Button size="lg" onClick={handlePay} loading={paying} className="w-full">
                        {paying ? (
                            'Opening secure checkout…'
                        ) : (
                            <>
                                <CreditCard className="h-4.5 w-4.5" />
                                Pay {naira(amountNaira)} with Paystack
                            </>
                        )}
                    </Button>
                    <button
                        type="button"
                        onClick={reset}
                        disabled={paying}
                        className="w-full text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-800 disabled:opacity-50"
                    >
                        ← Change account or amount
                    </button>

                    <p className="flex items-center justify-center gap-1.5 text-center text-xs text-neutral-400">
                        <Lock className="h-3.5 w-3.5" />
                        Card details go straight to Paystack — Movio never sees them.
                    </p>
                </div>
            )}

            {/* ── Step 3: receipt ── */}
            {step === 'done' && receipt && (
                <div className="animate-fade-up">
                    <div className="border-brand-200 bg-brand-50 flex flex-col items-center gap-4 rounded-3xl border p-8 text-center sm:p-10">
                        <span className="animate-pop bg-brand-600 flex h-16 w-16 items-center justify-center rounded-full text-white">
                            <CheckCircle2 className="h-9 w-9" />
                        </span>
                        <div>
                            <h2 className="text-brand-900 text-2xl font-bold">Payment successful</h2>
                            <p className="text-brand-800 mt-2">
                                <span className="font-semibold">{receipt.credits_added}</span>{' '}
                                {receipt.credits_added === 1 ? 'credit' : 'credits'} added to{' '}
                                <span className="font-semibold">{receipt.first_name}</span>’s Movio
                                wallet.
                            </p>
                        </div>
                        <p className="text-brand-700/80 max-w-sm text-sm">
                            Open the Movio app to see the updated balance. For privacy, we don’t show
                            wallet balances on this website.
                        </p>
                        <div className="mt-2 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <Button onClick={reset} variant="secondary" className="sm:w-auto">
                                Top up again
                            </Button>
                            <Link to="/" className="sm:w-auto">
                                <Button variant="outline" className="w-full sm:w-auto">
                                    Back to home
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </PageShell>
    )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3 text-sm last:border-0 last:pb-0">
            <span className="text-neutral-500">{label}</span>
            <span>{value}</span>
        </div>
    )
}

function ErrorNote({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {children}
        </div>
    )
}

function TrustRow() {
    return (
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-neutral-500">
            <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="text-brand-600 h-4 w-4" /> Secured by Paystack
            </span>
            <span className="inline-flex items-center gap-1.5">
                <Lock className="text-brand-600 h-4 w-4" /> No login needed
            </span>
            <span className="inline-flex items-center gap-1.5">
                <Loader2 className="text-brand-600 h-4 w-4" /> Credited instantly
            </span>
        </div>
    )
}
