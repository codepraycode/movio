import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    CornerDownLeft,
    Loader2,
    Lock,
    PartyPopper,
    Send,
    ShieldCheck,
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ProgressBar } from '@/components/ProgressBar'
import { SurveyQuestion } from '@/components/SurveyQuestion'
import { SurveyHost } from '@/components/SurveyHost'
import { WaitlistForm } from '@/components/WaitlistForm'
import { ShareButtons } from '@/components/ShareButtons'
import { Confetti } from '@/components/Confetti'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useToast } from '@/components/ui/toast'
import { supabase, PG_UNIQUE_VIOLATION } from '@/lib/supabase'
import { fetchSurveyOpen } from '@/lib/settings'
import {
    surveySteps,
    initialAnswers,
    CONTACT_HOST,
    NEVER_USES_TRANSPORT,
    type SurveyAnswers,
    type Question,
} from '@/lib/survey'

type View = 'form' | 'exit' | 'contact' | 'done'
type Direction = 'forward' | 'back'

/** Question sections + the final contact step, for the overall total. */
const TOTAL_STEPS = surveySteps.length + 1

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function Survey() {
    const { toast } = useToast()
    // null = still checking with Supabase whether the survey is open.
    const [surveyOpen, setSurveyOpen] = useState<boolean | null>(null)
    const [view, setView] = useState<View>('form')
    // The flow advances one question at a time, framed inside its section.
    const [sectionIndex, setSectionIndex] = useState(0)
    const [questionIndex, setQuestionIndex] = useState(0)
    const [direction, setDirection] = useState<Direction>('forward')
    const [answers, setAnswers] = useState<SurveyAnswers>(initialAnswers)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState(false)

    // Final contact step — kept separate from `answers` so the survey row itself
    // stays anonymous; these only feed the optional waitlist opt-in.
    const [contactName, setContactName] = useState('')
    const [contactEmail, setContactEmail] = useState('')
    const [joinWaitlist, setJoinWaitlist] = useState(true)
    const [joinedWaitlist, setJoinedWaitlist] = useState(false)

    // Master switch: read once on mount so an ended survey stops taking responses.
    useEffect(() => {
        let active = true
        fetchSurveyOpen().then((open) => {
            if (active) setSurveyOpen(open)
        })
        return () => {
            active = false
        }
    }, [])

    const section = surveySteps[sectionIndex]
    const question = section.questions[questionIndex]
    const isLastSection = sectionIndex === surveySteps.length - 1
    const isLastInSection = questionIndex === section.questions.length - 1
    const isFinalQuestion = isLastSection && isLastInSection
    const isFirstQuestion = sectionIndex === 0 && questionIndex === 0

    function update(key: keyof SurveyAnswers, value: string | number | string[] | null) {
        setAnswers((prev) => ({ ...prev, [key]: value }))
        setErrors((prev) => {
            if (!prev[key]) return prev
            const next = { ...prev }
            delete next[key]
            return next
        })
    }

    /** Validate just the question on screen; returns true if it passes. */
    function validateCurrentQuestion(): boolean {
        const err = validateQuestion(question, answers)
        setErrors(err ? { [question.key]: err } : {})
        if (err) {
            toast({ variant: 'info', title: 'One quick thing', description: err })
        }
        return !err
    }

    function handleNext() {
        if (!validateCurrentQuestion()) return

        // Conditional exit: a student who uses no campus transport stops here.
        if (
            question.key === 'transport_frequency' &&
            answers.transport_frequency === NEVER_USES_TRANSPORT
        ) {
            setView('exit')
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }

        setDirection('forward')

        if (isFinalQuestion) {
            // Hand off to the contact step rather than submitting straight away.
            setView('contact')
        } else if (isLastInSection) {
            setSectionIndex((i) => i + 1)
            setQuestionIndex(0)
        } else {
            setQuestionIndex((i) => i + 1)
        }
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function handleBack() {
        setErrors({})
        setDirection('back')
        if (questionIndex > 0) {
            setQuestionIndex((i) => i - 1)
        } else if (sectionIndex > 0) {
            const prev = sectionIndex - 1
            setSectionIndex(prev)
            setQuestionIndex(surveySteps[prev].questions.length - 1)
        }
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Press Enter to advance — except inside the textarea, where it adds a line.
    useEffect(() => {
        if (view !== 'form') return
        function onKey(e: KeyboardEvent) {
            if (e.key !== 'Enter' || e.shiftKey) return
            if (e.target instanceof HTMLTextAreaElement) return
            e.preventDefault()
            handleNext()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, sectionIndex, questionIndex, answers])

    function backToForm() {
        setDirection('back')
        setView('form')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function handleSubmit() {
        // If they want in on the waitlist, we need real contact details first.
        const name = contactName.trim()
        const email = contactEmail.trim().toLowerCase()
        if (joinWaitlist && (!name || !EMAIL_RE.test(email))) {
            toast({
                variant: 'info',
                title: 'Almost there',
                description:
                    'Add your name and a valid email to join the waitlist — or untick it to finish anonymously.',
            })
            return
        }

        setSubmitting(true)

        // 1. The survey response — always anonymous, no name/email attached.
        const { error: surveyError } = await supabase.from('survey_responses').insert(answers)
        if (surveyError) {
            setSubmitting(false)
            toast({
                variant: 'error',
                title: 'Could not submit',
                description: 'Something went wrong saving your response. Please try again.',
            })
            return
        }

        // 2. Optional waitlist opt-in — a failure here must not lose the survey.
        if (joinWaitlist) {
            const { error: waitlistError } = await supabase.from('waitlist').insert({ name, email })
            if (waitlistError && waitlistError.code === PG_UNIQUE_VIOLATION) {
                setJoinedWaitlist(true)
            } else if (waitlistError) {
                toast({
                    variant: 'info',
                    title: 'Response saved',
                    description: 'We saved your answers, but couldn’t add you to the waitlist.',
                })
            } else {
                setJoinedWaitlist(true)
            }
        }

        setSubmitting(false)
        setView('done')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Still checking the flag — keep it quiet so a brief check doesn't flash the form.
    if (surveyOpen === null) {
        return (
            <div className="flex min-h-screen flex-col bg-neutral-50">
                <Navbar />
                <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="text-brand-500 h-6 w-6 animate-spin" aria-label="Loading" />
                </div>
                <Footer />
            </div>
        )
    }

    // Survey has ended — no form, no submissions.
    if (!surveyOpen) {
        return <SurveyClosedScreen />
    }

    return (
        <div className="flex min-h-screen flex-col bg-neutral-50">
            <Navbar />
            <div className="bg-grid relative flex-1">
                <div
                    className="bg-aurora pointer-events-none absolute inset-x-0 top-0 h-64"
                    aria-hidden
                />
                <main className="relative mx-auto max-w-2xl px-4 py-10">
                    {view === 'form' && (
                        <div className="space-y-6">
                            <ProgressBar
                                current={questionIndex + 1}
                                total={section.questions.length}
                                label="Question"
                                context={`${section.section} of ${TOTAL_STEPS}`}
                            />

                            {/* Section header + host stay put; only the question frame flips.
                                key on sectionIndex replays their entrance per section. */}
                            <div key={`sec-${sectionIndex}`} className="animate-fade-up space-y-4">
                                <div>
                                    <span className="border-brand-200 bg-brand-50 text-brand-700 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold">
                                        <span className="bg-brand-500 h-1.5 w-1.5 rounded-full" />
                                        {section.title}
                                    </span>
                                </div>
                                <SurveyHost message={section.host} />
                            </div>

                            {/* The live frame: one question, sliding in per step. */}
                            <div
                                key={`q-${sectionIndex}-${questionIndex}`}
                                className={
                                    direction === 'back'
                                        ? 'animate-frame-in-left'
                                        : 'animate-frame-in-right'
                                }
                            >
                                <div className="shadow-card relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 sm:p-7">
                                    <span
                                        className="from-brand-400 via-brand-500 to-brand-600 absolute inset-x-0 top-0 h-1 bg-gradient-to-r"
                                        aria-hidden
                                    />
                                    <SurveyQuestion
                                        question={question}
                                        answers={answers}
                                        onChange={update}
                                        error={errors[question.key]}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                {!isFirstQuestion ? (
                                    <Button variant="outline" onClick={handleBack}>
                                        <ArrowLeft className="h-4 w-4" /> Back
                                    </Button>
                                ) : (
                                    <span />
                                )}
                                <Button
                                    onClick={handleNext}
                                    className="transition-all hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    {isFinalQuestion ? (
                                        <>
                                            Almost done <ArrowRight className="h-4 w-4" />
                                        </>
                                    ) : (
                                        <>
                                            Continue <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </div>

                            <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs text-neutral-400">
                                <span className="inline-flex items-center gap-1.5">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Anonymous · shapes a real FUTA project
                                </span>
                                <span className="hidden items-center gap-1.5 sm:inline-flex">
                                    <kbd className="rounded border border-neutral-300 bg-white px-1.5 py-0.5 font-sans text-[10px] text-neutral-500">
                                        Enter
                                    </kbd>
                                    <CornerDownLeft className="h-3 w-3" /> to continue
                                </span>
                            </p>
                        </div>
                    )}

                    {view === 'contact' && (
                        <ContactStep
                            name={contactName}
                            email={contactEmail}
                            joinWaitlist={joinWaitlist}
                            submitting={submitting}
                            onName={setContactName}
                            onEmail={setContactEmail}
                            onToggleWaitlist={setJoinWaitlist}
                            onBack={backToForm}
                            onSubmit={() => void handleSubmit()}
                        />
                    )}

                    {view === 'exit' && <ExitScreen />}
                    {view === 'done' && <ThankYouScreen joinedWaitlist={joinedWaitlist} />}
                </main>
            </div>
            <Footer />
        </div>
    )
}

/** Returns an error message for a question, or null if it is valid. */
function validateQuestion(q: Question, answers: SurveyAnswers): string | null {
    const value = answers[q.key]

    if (q.type === 'checkbox') {
        const arr = value as string[]
        if (q.required && arr.length === 0) return 'Please select at least one option.'
        if (q.maxSelections && arr.length > q.maxSelections) {
            return `Please select a maximum of ${q.maxSelections} options.`
        }
        return null
    }

    if (!q.required) return null

    if (q.type === 'scale') {
        return value === null ? 'Please choose a rating.' : null
    }

    return value === '' || value === null ? 'This question is required.' : null
}

interface ContactStepProps {
    name: string
    email: string
    joinWaitlist: boolean
    submitting: boolean
    onName: (v: string) => void
    onEmail: (v: string) => void
    onToggleWaitlist: (v: boolean) => void
    onBack: () => void
    onSubmit: () => void
}

/**
 * The final, conversational step: collect name + email purely to power the
 * optional waitlist opt-in. The survey response itself stays anonymous.
 */
function ContactStep({
    name,
    email,
    joinWaitlist,
    submitting,
    onName,
    onEmail,
    onToggleWaitlist,
    onBack,
    onSubmit,
}: ContactStepProps) {
    return (
        <div className="space-y-6">
            <ProgressBar current={TOTAL_STEPS} total={TOTAL_STEPS} />

            <div className="space-y-6">
                <SurveyHost message={CONTACT_HOST} />

                <form
                    className="animate-fade-up space-y-6"
                    onSubmit={(e) => {
                        e.preventDefault()
                        if (!submitting) onSubmit()
                    }}
                >
                    <div className="shadow-card relative space-y-5 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 sm:p-7">
                        <span
                            className="from-brand-400 via-brand-500 to-brand-600 absolute inset-x-0 top-0 h-1 bg-gradient-to-r"
                            aria-hidden
                        />
                        <div>
                            <Label htmlFor="contact-name">
                                Your name{' '}
                                <span className="font-normal text-neutral-400">(optional)</span>
                            </Label>
                            <Input
                                id="contact-name"
                                value={name}
                                onChange={(e) => onName(e.target.value)}
                                placeholder="What should I call you?"
                                autoComplete="name"
                            />
                        </div>
                        <div>
                            <Label htmlFor="contact-email">
                                Email{' '}
                                <span className="font-normal text-neutral-400">(optional)</span>
                            </Label>
                            <Input
                                id="contact-email"
                                type="email"
                                value={email}
                                onChange={(e) => onEmail(e.target.value)}
                                placeholder="you@whatever.com"
                                autoComplete="email"
                            />
                        </div>

                        <label className="hover:border-brand-300 flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3.5 transition-colors">
                            <input
                                type="checkbox"
                                checked={joinWaitlist}
                                onChange={(e) => onToggleWaitlist(e.target.checked)}
                                className="text-brand-600 focus:ring-brand-500/40 mt-0.5 h-5 w-5 shrink-0 rounded border-neutral-300"
                            />
                            <span className="text-sm leading-snug text-neutral-700">
                                <span className="font-semibold text-neutral-900">
                                    Yes, add me to the Movio waitlist.
                                </span>{' '}
                                I’d like a heads-up on how it goes.
                            </span>
                        </label>

                        <p className="flex items-start gap-1.5 text-xs text-neutral-400">
                            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            Your survey answers stay anonymous. Your email is only used for the
                            waitlist — nothing else, no spam.
                        </p>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <Button type="button" variant="outline" onClick={onBack}>
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                        <Button
                            type="submit"
                            loading={submitting}
                            className="transition-all hover:-translate-y-0.5 hover:shadow-md"
                        >
                            {submitting ? (
                                'Submitting...'
                            ) : (
                                <>
                                    Submit survey <Send className="h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

/**
 * Shown on /survey once the survey has been closed (app_settings.survey_open =
 * false). No form is rendered, so no further responses can be submitted — but
 * visitors can still join the waitlist and head back home.
 */
function SurveyClosedScreen() {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : ''

    return (
        <div className="flex min-h-screen flex-col bg-neutral-50">
            <Navbar />
            <div className="bg-grid relative flex-1">
                <div
                    className="bg-aurora pointer-events-none absolute inset-x-0 top-0 h-64"
                    aria-hidden
                />
                <main className="relative mx-auto max-w-2xl px-4 py-10">
                    <div className="animate-fade-up space-y-6">
                        <div className="border-brand-100 from-brand-50 relative overflow-hidden rounded-2xl border bg-gradient-to-br to-white p-8 text-center shadow-sm">
                            <span className="bg-brand-50 text-brand-600 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
                                <Lock className="h-7 w-7" />
                            </span>
                            <h1 className="mt-4 text-2xl font-bold text-neutral-900">
                                The survey has closed 🙏🏽
                            </h1>
                            <p className="mx-auto mt-3 max-w-md text-neutral-600">
                                Thank you to every FUTA student who took part — responses are no
                                longer being collected. Your input is now shaping Movio as a final
                                year project at the School of Computing, FUTA.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-1 text-center text-lg font-semibold text-neutral-900">
                                Still want Movio on your phone?
                            </h2>
                            <p className="mb-4 text-center text-sm text-neutral-600">
                                The survey is done, but you can still join the waitlist and be the
                                first to know when Movio launches.
                            </p>
                            <WaitlistForm />
                        </div>

                        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                            <h2 className="text-center text-sm font-semibold text-neutral-900">
                                Know someone who’d want Movio at FUTA? Share it.
                            </h2>
                            <div className="mt-4">
                                <ShareButtons url={shareUrl} />
                            </div>
                        </div>

                        <p className="text-center">
                            <Link
                                to="/"
                                className="text-brand-700 hover:text-brand-800 text-sm font-medium"
                            >
                                ← Back to home
                            </Link>
                        </p>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    )
}

function ExitScreen() {
    return (
        <div className="animate-fade-up space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
                <CheckCircle2 className="text-brand-600 mx-auto h-12 w-12" />
                <h1 className="mt-4 text-2xl font-bold text-neutral-900">
                    Thanks for your honesty 🙏🏽
                </h1>
                <p className="mx-auto mt-3 max-w-md text-neutral-600">
                    Since you don’t really use campus transport, the rest won’t apply to you — no
                    worries. You can still join the Movio waitlist below, or pass this on to a
                    friend who rides the shuttle, Keke or cab.
                </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-center text-lg font-semibold text-neutral-900">
                    Join the Movio waitlist
                </h2>
                <WaitlistForm />
            </div>
            <p className="text-center">
                <Link to="/" className="text-brand-700 hover:text-brand-800 text-sm font-medium">
                    ← Back to home
                </Link>
            </p>
        </div>
    )
}

function ThankYouScreen({ joinedWaitlist }: { joinedWaitlist: boolean }) {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : ''

    return (
        <div className="animate-fade-up space-y-6">
            <Confetti />
            <div className="border-brand-100 from-brand-50 relative overflow-hidden rounded-2xl border bg-gradient-to-br to-white p-8 text-center shadow-sm">
                <PartyPopper className="text-brand-600 mx-auto h-12 w-12" />
                <h1 className="mt-4 text-2xl font-bold text-neutral-900">
                    You’re a legend. Thank you! 🎉
                </h1>
                <p className="mx-auto mt-3 max-w-md text-neutral-600">
                    Your response is recorded and will directly help shape Movio. This genuinely
                    means a lot for a final year project at the School of Computing, FUTA.
                </p>
            </div>

            {/* The big ask: share */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-neutral-900">One tiny favour? 🙏🏽</h2>
                <p className="mt-1.5 text-sm text-neutral-600">
                    The research only holds up if enough <strong>real FUTA students</strong>{' '}
                    respond. If you know even one or two course mates, please forward this — it only
                    takes a few minutes and it pushes Movio forward more than you’d think.
                </p>
                <div className="mt-4">
                    <ShareButtons url={shareUrl} />
                </div>
            </div>

            {joinedWaitlist ? (
                <div className="border-brand-200 bg-brand-50 flex items-center gap-3 rounded-2xl border p-6">
                    <CheckCircle2 className="text-brand-600 h-8 w-8 shrink-0" />
                    <div>
                        <p className="text-brand-900 font-semibold">You’re on the waitlist 🎉</p>
                        <p className="text-brand-800 text-sm">
                            I’ll reach out the moment Movio is ready to launch.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-1 text-center text-lg font-semibold text-neutral-900">
                        Haven’t joined the waitlist yet?
                    </h2>
                    <p className="mb-4 text-center text-sm text-neutral-600">
                        Get notified the moment Movio launches.
                    </p>
                    <WaitlistForm />
                </div>
            )}

            <p className="text-center">
                <Link to="/" className="text-brand-700 hover:text-brand-800 text-sm font-medium">
                    ← Back to home
                </Link>
            </p>
        </div>
    )
}
