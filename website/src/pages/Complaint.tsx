import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, MessageSquareWarning, Send } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/toast'
import { submitGuestComplaint } from '@/lib/complaints-api'
import { ApiError } from '@/lib/backend'

export function Complaint() {
    const { toast } = useToast()
    const [description, setDescription] = useState('')
    const [tripRef, setTripRef] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [done, setDone] = useState(false)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (loading) return
        setError(null)

        if (!description.trim()) {
            setError('Please describe what happened.')
            return
        }
        if (!email.trim() && !phone.trim()) {
            setError('Add a contact email or phone so we can get back to you.')
            return
        }

        setLoading(true)
        try {
            await submitGuestComplaint({
                description: tripRef.trim()
                    ? `${description.trim()}\n\nTrip reference: ${tripRef.trim()}`
                    : description.trim(),
                contact_email: email.trim() || undefined,
                contact_phone: phone.trim() || undefined,
                category: 'complaint',
            })
            setDone(true)
        } catch (err) {
            const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.'
            setError(msg)
            toast({ variant: 'error', title: 'Could not send', description: msg })
        } finally {
            setLoading(false)
        }
    }

    return (
        <PageShell
            eyebrow="Report a problem"
            icon={<MessageSquareWarning className="h-7 w-7" />}
            title="Something went wrong? Tell us."
            subtitle="A late shuttle, a wrong charge, a packed bus that skipped your stop — report it here. No login needed; a real person reviews every report."
            seoTitle="Report a problem — Movio | FUTA"
            seoDescription="Report an issue with the FUTA campus shuttle — late buses, wrong charges, or anything else. No login required."
            path="/complaint"
        >
            {done ? (
                <div className="animate-fade-up border-brand-200 bg-brand-50 flex flex-col items-center gap-4 rounded-3xl border p-8 text-center sm:p-10">
                    <span className="animate-pop bg-brand-600 flex h-16 w-16 items-center justify-center rounded-full text-white">
                        <CheckCircle2 className="h-9 w-9" />
                    </span>
                    <h2 className="text-brand-900 text-2xl font-bold">Thanks — we’ve got it</h2>
                    <p className="text-brand-800 max-w-sm">
                        Your report has been logged and will be reviewed personally. If you left a
                        contact, we’ll reach out with an update. We don’t promise a fixed response
                        time — but nothing here is ignored.
                    </p>
                    <Link to="/" className="mt-2">
                        <Button variant="secondary">Back to home</Button>
                    </Link>
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="animate-fade-up shadow-card space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7"
                >
                    <div>
                        <Label htmlFor="description">What happened?</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. The 8am shuttle from South Gate was over 20 minutes late and left before I could board."
                            className="min-h-32"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="tripRef">
                            Trip reference{' '}
                            <span className="font-normal text-neutral-400">(optional)</span>
                        </Label>
                        <Input
                            id="tripRef"
                            value={tripRef}
                            onChange={(e) => setTripRef(e.target.value)}
                            placeholder="Plate number, route, or time — anything that helps us find it"
                        />
                    </div>

                    <div className="rounded-xl bg-neutral-50 p-4">
                        <p className="mb-3 text-sm font-medium text-neutral-800">
                            How can we reach you?{' '}
                            <span className="font-normal text-neutral-500">
                                (at least one — email or phone)
                            </span>
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="email" className="text-xs">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@futa.edu.ng"
                                    autoComplete="email"
                                />
                            </div>
                            <div>
                                <Label htmlFor="phone" className="text-xs">
                                    Phone
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="080…"
                                    autoComplete="tel"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <Button type="submit" size="lg" loading={loading} className="w-full">
                        {loading ? 'Sending…' : 'Send report'}
                        {!loading && <Send className="h-4 w-4" />}
                    </Button>
                </form>
            )}
        </PageShell>
    )
}
