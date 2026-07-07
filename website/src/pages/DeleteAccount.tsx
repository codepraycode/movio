import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Database, ShieldOff, Trash2, UserX } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/toast'
import { submitGuestComplaint } from '@/lib/complaints-api'
import { ApiError } from '@/lib/backend'

const WHAT_HAPPENS = [
    {
        icon: UserX,
        title: 'Your account is removed',
        body: 'Your profile — name, matric number, email, phone and login — is permanently deleted. This is deletion, not deactivation: it can’t be undone.',
    },
    {
        icon: Database,
        title: 'Your personal records go with it',
        body: 'Your Transit Credit wallet, boarding history and any reports tied to your account are deleted along with it.',
    },
    {
        icon: ShieldOff,
        title: 'What may be kept',
        body: 'Anonymised, non-identifying ride counts (with no link back to you) may be retained for campus transport and sustainability statistics — consistent with our Privacy Policy.',
    },
]

export function DeleteAccount() {
    const { toast } = useToast()
    const [email, setEmail] = useState('')
    const [matric, setMatric] = useState('')
    const [reason, setReason] = useState('')
    const [confirmed, setConfirmed] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [done, setDone] = useState(false)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (loading) return
        setError(null)

        if (!email.trim()) {
            setError('Enter the email on your Movio account so we can verify and confirm.')
            return
        }
        if (!confirmed) {
            setError('Please confirm you understand this permanently deletes your account.')
            return
        }

        const lines = [
            'ACCOUNT DELETION REQUEST',
            matric.trim() ? `Matric number: ${matric.trim()}` : null,
            reason.trim() ? `Reason: ${reason.trim()}` : 'Reason: (none given)',
        ].filter(Boolean)

        setLoading(true)
        try {
            await submitGuestComplaint({
                description: lines.join('\n'),
                contact_email: email.trim(),
                category: 'account_deletion',
            })
            setDone(true)
        } catch (err) {
            const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.'
            setError(msg)
            toast({ variant: 'error', title: 'Could not submit', description: msg })
        } finally {
            setLoading(false)
        }
    }

    return (
        <PageShell
            eyebrow="Data & privacy"
            icon={<Trash2 className="h-7 w-7" />}
            title="Delete your Movio account"
            subtitle="Request permanent deletion of your Movio account and the data tied to it. This page is for the Movio mobile app account — no login required to ask."
            seoTitle="Delete your account — Movio | FUTA"
            seoDescription="Request permanent deletion of your Movio account and associated data. A public, web-based deletion request for the Movio mobile app."
            path="/delete-account"
            back={{ to: '/privacy', label: 'Read the Privacy Policy' }}
        >
            {done ? (
                <div className="animate-fade-up border-brand-200 bg-brand-50 flex flex-col items-center gap-4 rounded-3xl border p-8 text-center sm:p-10">
                    <span className="animate-pop bg-brand-600 flex h-16 w-16 items-center justify-center rounded-full text-white">
                        <CheckCircle2 className="h-9 w-9" />
                    </span>
                    <h2 className="text-brand-900 text-2xl font-bold">Request received</h2>
                    <p className="text-brand-800 max-w-sm">
                        We’ve logged your deletion request. We’ll verify it against the email you
                        provided and confirm by email once your account and data have been removed.
                    </p>
                    <Link to="/" className="mt-2">
                        <Button variant="secondary">Back to home</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* What deletion means */}
                    <div className="animate-fade-up space-y-3">
                        {WHAT_HAPPENS.map(({ icon: Icon, title, body }) => (
                            <div
                                key={title}
                                className="shadow-card flex gap-4 rounded-2xl border border-neutral-200 bg-white p-4"
                            >
                                <span className="bg-brand-50 text-brand-600 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                                    <Icon className="h-5 w-5" />
                                </span>
                                <div>
                                    <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
                                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                                        {body}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="animate-fade-up shadow-card space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7"
                    >
                        <div>
                            <Label htmlFor="email">Account email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="The email you registered with"
                                autoComplete="email"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="matric">
                                Matric number{' '}
                                <span className="font-normal text-neutral-400">(optional)</span>
                            </Label>
                            <Input
                                id="matric"
                                value={matric}
                                onChange={(e) => setMatric(e.target.value)}
                                placeholder="Helps us find the right account faster"
                            />
                        </div>
                        <div>
                            <Label htmlFor="reason">
                                Reason{' '}
                                <span className="font-normal text-neutral-400">(optional)</span>
                            </Label>
                            <Textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Anything you'd like us to know — not required."
                            />
                        </div>

                        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-neutral-50 p-4">
                            <input
                                type="checkbox"
                                checked={confirmed}
                                onChange={(e) => setConfirmed(e.target.checked)}
                                className="text-brand-600 focus:ring-brand-500/40 mt-0.5 h-4 w-4 rounded border-neutral-300"
                            />
                            <span className="text-sm leading-relaxed text-neutral-700">
                                I understand this permanently deletes my Movio account and the data
                                tied to it, and that it can’t be undone.
                            </span>
                        </label>

                        {error && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            size="lg"
                            loading={loading}
                            className="w-full bg-red-600 hover:bg-red-700"
                        >
                            {loading ? 'Submitting…' : 'Request account deletion'}
                            {!loading && <Trash2 className="h-4 w-4" />}
                        </Button>
                        <p className="text-center text-xs text-neutral-400">
                            Prefer to keep your account? Just close this page — nothing happens
                            unless you submit.
                        </p>
                    </form>
                </div>
            )}
        </PageShell>
    )
}
