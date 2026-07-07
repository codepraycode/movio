import { Link } from 'react-router-dom'
import {
    MapPin,
    Coins,
    Users,
    Bell,
    CreditCard,
    Map,
    BarChart3,
    ShieldCheck,
    Clock,
    HeartHandshake,
    Sparkles,
    ArrowRight,
    ArrowUpRight,
    Wallet,
    MessageSquareWarning,
    Radio,
    Leaf,
    GraduationCap,
    Building2,
    Smartphone,
    Bus,
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { WaitlistForm } from '@/components/WaitlistForm'
import { HeroVisual } from '@/components/HeroVisual'
import { Reveal } from '@/components/Reveal'
import { LogoMark } from '@/components/Logo'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

const problems = [
    {
        icon: MapPin,
        title: 'No real-time tracking',
        body: 'You stand at the stop with zero idea when the next shuttle is coming. Could be 2 minutes. Could be 25.',
    },
    {
        icon: Coins,
        title: 'The change wahala',
        body: 'Driver has no change for your ₦200 or ₦500. So you “manage it” — and quietly overpay, again.',
    },
    {
        icon: Users,
        title: 'Packed before you reach',
        body: 'You walk all the way to the stop only to watch a full bus zoom past. No way to know there was no space.',
    },
]

// Honest status per feature — "live" means you can use it *today* on this site;
// "coming" means it's designed and in progress (hardware/app integration still
// open per AGENTS.md). Don't oversell the coming ones — a defence panel checks.
const features = [
    {
        icon: Map,
        title: 'Live shuttle map',
        text: 'See exactly where every campus shuttle is, right now — no more guessing at the stop.',
        status: 'live' as const,
        to: '/live',
    },
    {
        icon: Wallet,
        title: 'Transit Credit top-up',
        text: 'Load credits to your wallet online — no cash, no change wahala. One credit, one boarding.',
        status: 'live' as const,
        to: '/topup',
    },
    {
        icon: CreditCard,
        title: 'Tap to board',
        text: 'Tap your student ID or phone against the reader to board. Rolls out with the TapTrace device.',
        status: 'coming' as const,
    },
    {
        icon: Bell,
        title: 'Arrival heads-up',
        text: 'A nudge when a shuttle is a few minutes from your stop, so you leave at the right time.',
        status: 'coming' as const,
    },
    {
        icon: BarChart3,
        title: 'Ridership analytics',
        text: 'Real demand data so the school runs routes that match how students actually move.',
        status: 'coming' as const,
    },
]

// The three actions a visitor can genuinely do on this site today.
const liveActions = [
    {
        icon: Radio,
        title: 'Watch it live',
        body: 'Every active shuttle on the campus map, updating in real time.',
        to: '/live',
        cta: 'Open live map',
    },
    {
        icon: Wallet,
        title: 'Top up credit',
        body: 'Add Transit Credit by matric number or email — no login.',
        to: '/topup',
        cta: 'Top up now',
    },
    {
        icon: MessageSquareWarning,
        title: 'Report a problem',
        body: 'Late bus, wrong charge, packed shuttle? Tell us — a person reads it.',
        to: '/complaint',
        cta: 'Report it',
    },
]

// Mirrors the actual argument in Chapters 1–3 / the conference paper — no
// invented emissions numbers, just the real SDG framing.
const sdgs = [
    {
        icon: GraduationCap,
        tag: 'SDG 4 · Quality Education',
        text: 'Unreliable transport makes students late to lectures and exams. Predictable, trackable shuttles protect learning time.',
    },
    {
        icon: Building2,
        tag: 'SDG 9 · Industry & Innovation',
        text: 'Movio lays a digital infrastructure layer — GPS, NFC boarding, a data backbone — over an analogue campus service.',
    },
    {
        icon: Leaf,
        tag: 'SDG 11 · Sustainable Cities',
        text: 'Demand-driven scheduling means fewer idle and under-filled trips — less wasted fuel per student actually moved.',
    },
]

export function Landing() {
    return (
        <div className="min-h-screen bg-white">
            <Seo
                title="MovIo — Mobility Optimization Via Intelligent Operation | FUTA"
                description="Real-time vehicle tracking and tap-to-board for the FUTA campus. Watch the live campus map, take the student survey, and join the waitlist."
                path="/"
            />
            <Navbar />

            {/* ───────────────────────── Hero ───────────────────────── */}
            <section className="bg-aurora relative overflow-hidden">
                <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-2">
                    <div className="text-center lg:text-left">
                        <span className="animate-fade-up border-brand-200 text-brand-700 inline-flex items-center gap-1.5 rounded-full border bg-white/70 px-3 py-1 text-xs font-semibold backdrop-blur">
                            <Sparkles className="h-3.5 w-3.5" />
                            Smart campus transport · built for FUTA
                        </span>

                        <h1
                            className="animate-fade-up mx-auto mt-6 max-w-xl text-4xl leading-[1.1] font-extrabold tracking-tight text-neutral-900 sm:text-5xl lg:mx-0"
                            style={{ animationDelay: '80ms' }}
                        >
                            Stop guessing when the{' '}
                            <span className="text-brand-600 relative whitespace-nowrap">
                                shuttle
                                <svg
                                    viewBox="0 0 200 12"
                                    className="text-brand-300 absolute -bottom-1 left-0 h-2.5 w-full"
                                    fill="none"
                                    preserveAspectRatio="none"
                                >
                                    <path
                                        d="M2 9 C 50 2, 150 2, 198 8"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </span>{' '}
                            will show up.
                        </h1>

                        <p
                            className="animate-fade-up mx-auto mt-5 max-w-lg text-lg text-neutral-600 lg:mx-0"
                            style={{ animationDelay: '160ms' }}
                        >
                            Movio brings real-time GPS tracking and tap-to-board to the FUTA campus
                            shuttle — so you know when your bus is coming and hop on without cash.
                        </p>

                        <div
                            className="animate-fade-up mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start"
                            style={{ animationDelay: '240ms' }}
                        >
                            <Link to="/survey" className="w-full sm:w-auto">
                                <Button
                                    size="lg"
                                    className="w-full transition-all hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
                                >
                                    Take the quick survey
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link to="/live" className="w-full sm:w-auto">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full transition-all hover:-translate-y-0.5 sm:w-auto"
                                >
                                    <span className="relative flex h-2 w-2">
                                        <span className="bg-brand-400 absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" />
                                        <span className="bg-brand-500 relative inline-flex h-2 w-2 rounded-full" />
                                    </span>
                                    Watch it live
                                </Button>
                            </Link>
                        </div>

                        <div
                            className="animate-fade-up mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-neutral-500 lg:justify-start"
                            style={{ animationDelay: '320ms' }}
                        >
                            <span className="inline-flex items-center gap-1.5">
                                <ShieldCheck className="text-brand-600 h-4 w-4" /> 100% anonymous
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <Clock className="text-brand-600 h-4 w-4" /> Under 5 minutes
                            </span>
                        </div>
                    </div>

                    <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
                        <HeroVisual />
                    </div>
                </div>
            </section>

            {/* ─────────────────── Personal note ─────────────────── */}
            <section className="mx-auto max-w-3xl px-4 py-14">
                <Reveal>
                    <Card className="border-brand-100 bg-brand-50/50">
                        <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                            <LogoMark
                                animated
                                className="shadow-brand-900/10 h-12 w-12 shrink-0 rounded-2xl shadow-sm"
                            />
                            <p className="text-[15px] leading-relaxed text-neutral-700">
                                <span className="font-semibold text-neutral-900">Hey 👋</span> I’m a
                                final-year Software Engineering student at the School of Computing,
                                FUTA, and Movio is my final year project. It only becomes something
                                real if it’s built around what <em>you</em> actually go through at
                                the bus stop. Your honest answers literally shape what I build —
                                thank you for a few minutes.
                            </p>
                        </CardContent>
                    </Card>
                </Reveal>
            </section>

            {/* ───────────────────── Problems ───────────────────── */}
            <section className="mx-auto max-w-5xl px-4 py-12">
                <Reveal className="mb-10 text-center">
                    <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
                        We’ve all been here
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-neutral-600">
                        Real problems FUTA students face at the shuttle stop — every single day.
                    </p>
                </Reveal>
                <div className="grid gap-5 sm:grid-cols-3">
                    {problems.map(({ icon: Icon, title, body }, i) => (
                        <Reveal key={title} delay={i * 120}>
                            <Card className="group hover:border-brand-200 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                <CardContent className="space-y-3">
                                    <span className="bg-brand-50 text-brand-600 group-hover:bg-brand-600 flex h-12 w-12 items-center justify-center rounded-2xl transition-colors group-hover:text-white">
                                        <Icon className="h-6 w-6" />
                                    </span>
                                    <h3 className="font-semibold text-neutral-900">{title}</h3>
                                    <p className="text-sm leading-relaxed text-neutral-600">
                                        {body}
                                    </p>
                                </CardContent>
                            </Card>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ─────────────────── What Movio does ─────────────────── */}
            <section className="relative overflow-hidden bg-neutral-900 py-16">
                <div className="bg-route absolute inset-0 opacity-[0.06]" />
                <div className="relative mx-auto max-w-4xl px-4">
                    <Reveal className="mb-10 text-center">
                        <LogoMark
                            animated
                            className="shadow-brand-500/20 mx-auto mb-5 h-12 w-12 rounded-2xl shadow-lg ring-1 ring-white/10"
                        />
                        <h2 className="text-2xl font-bold text-white sm:text-3xl">
                            What Movio does
                        </h2>
                        <p className="mx-auto mt-3 max-w-xl text-neutral-400">
                            One system for students and admins — built around how FUTA actually
                            moves. Some of it is already live; the rest ships as the hardware rolls
                            out.
                        </p>
                    </Reveal>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {features.map(({ icon: Icon, title, text, status, to }, i) => {
                            const inner = (
                                <div className="group flex h-full items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10">
                                    <span className="bg-brand-500 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-white">{title}</h3>
                                            {status === 'live' ? (
                                                <span className="bg-brand-500/15 text-brand-300 ring-brand-500/30 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ring-1">
                                                    <span className="bg-brand-400 h-1.5 w-1.5 animate-pulse rounded-full" />
                                                    Live
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-neutral-400 uppercase ring-1 ring-white/10">
                                                    Coming
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1.5 text-sm leading-relaxed text-neutral-300">
                                            {text}
                                        </p>
                                        {to && (
                                            <span className="text-brand-300 mt-2 inline-flex items-center gap-1 text-xs font-semibold group-hover:gap-1.5">
                                                Try it
                                                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                            return (
                                <Reveal key={title} delay={i * 90}>
                                    {to ? (
                                        <Link to={to} className="block h-full">
                                            {inner}
                                        </Link>
                                    ) : (
                                        inner
                                    )}
                                </Reveal>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ─────────────────── SDG / sustainability ─────────────────── */}
            <section className="bg-grid relative overflow-hidden py-16">
                <div className="mx-auto max-w-4xl px-4">
                    <Reveal className="mb-10 text-center">
                        <span className="border-brand-200 text-brand-700 inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-xs font-semibold">
                            <Leaf className="h-3.5 w-3.5" />
                            Built with the UN Global Goals in mind
                        </span>
                        <h2 className="mt-5 text-2xl font-bold text-neutral-900 sm:text-3xl">
                            A campus shuttle that pulls its weight
                        </h2>
                        <p className="mx-auto mt-3 max-w-xl text-neutral-600">
                            Movio isn’t only about convenience. It’s deliberately aligned with three
                            of the UN Sustainable Development Goals — and this is a design
                            commitment, not a slogan.
                        </p>
                    </Reveal>
                    <div className="grid gap-5 sm:grid-cols-3">
                        {sdgs.map(({ icon: Icon, tag, text }, i) => (
                            <Reveal key={tag} delay={i * 120}>
                                <Card className="hover:border-brand-200 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                    <CardContent className="space-y-3">
                                        <span className="bg-brand-600 flex h-11 w-11 items-center justify-center rounded-2xl text-white">
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <p className="text-brand-700 text-xs font-bold tracking-wide uppercase">
                                            {tag}
                                        </p>
                                        <p className="text-sm leading-relaxed text-neutral-600">
                                            {text}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Reveal>
                        ))}
                    </div>
                    <Reveal delay={200}>
                        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-neutral-500">
                            A precise fuel-saving figure will be published once real trip and
                            fuel-use data is gathered from FUTA’s transport unit — we’d rather leave
                            it blank than quote a number we can’t stand behind.
                        </p>
                    </Reveal>
                </div>
            </section>

            {/* ─────────────────── Try it today strip ─────────────────── */}
            <section className="mx-auto max-w-5xl px-4 py-12">
                <Reveal className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
                        You can already do this today
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-neutral-600">
                        No app install, no login. Three things this site does for real, right now.
                    </p>
                </Reveal>
                <div className="grid gap-5 sm:grid-cols-3">
                    {liveActions.map(({ icon: Icon, title, body, to, cta }, i) => (
                        <Reveal key={title} delay={i * 110}>
                            <Link to={to} className="group block h-full">
                                <Card className="hover:border-brand-300 flex h-full flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                    <CardContent className="flex h-full flex-col space-y-3">
                                        <span className="bg-brand-50 text-brand-600 group-hover:bg-brand-600 flex h-12 w-12 items-center justify-center rounded-2xl transition-colors group-hover:text-white">
                                            <Icon className="h-6 w-6" />
                                        </span>
                                        <h3 className="font-semibold text-neutral-900">{title}</h3>
                                        <p className="flex-1 text-sm leading-relaxed text-neutral-600">
                                            {body}
                                        </p>
                                        <span className="text-brand-700 inline-flex items-center gap-1 text-sm font-semibold">
                                            {cta}
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                        </span>
                                    </CardContent>
                                </Card>
                            </Link>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ───────────── Why the survey matters ───────────── */}
            <section className="mx-auto max-w-4xl px-4 py-16">
                <Reveal>
                    <div className="border-brand-100 from-brand-50 rounded-3xl border bg-gradient-to-br to-white p-8 text-center sm:p-12">
                        <span className="bg-brand-600 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white">
                            <HeartHandshake className="h-3.5 w-3.5" />
                            This part really matters
                        </span>
                        <h2 className="mt-5 text-2xl font-bold text-neutral-900 sm:text-3xl">
                            Your answers become real features
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-neutral-600">
                            This isn’t a random poll. Every response is analysed and cited in the
                            project’s requirements research — it’s the evidence that decides what
                            Movio is built to fix first. No data, no Movio. It’s genuinely that
                            important, and it’s completely anonymous.
                        </p>
                        <div className="mt-8">
                            <Link to="/survey">
                                <Button
                                    size="lg"
                                    className="transition-all hover:-translate-y-0.5 hover:shadow-lg"
                                >
                                    Okay, I’ll help — start the survey
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <p className="mt-3 text-sm text-neutral-500">
                                A few minutes · anonymous · 18 quick questions
                            </p>
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* ─────────────── Download the app (pre-launch) ─────────────── */}
            <section id="waitlist" className="scroll-mt-20 px-4 pb-20">
                <Reveal>
                    <div className="mx-auto grid max-w-5xl items-center gap-10 rounded-3xl border border-neutral-200 bg-white p-6 shadow-card sm:p-10 lg:grid-cols-2">
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
                                <Smartphone className="h-3.5 w-3.5" />
                                Android · pre-launch
                            </span>
                            <h2 className="mt-5 text-2xl font-bold text-neutral-900 sm:text-3xl">
                                Movio for your phone is on the way
                            </h2>
                            <p className="mt-3 max-w-md text-neutral-600">
                                The student app — live map, tap-to-board and your Transit Credit
                                wallet in one place — is being prepared for Google Play. Join the
                                waitlist and you’ll be the first to know the moment it’s installable.
                            </p>
                            {/* Deliberately NOT a Play Store badge — showing one for an app that
                                isn't published yet is itself a Play policy problem. Swap this for a
                                real badge + link once it clears closed testing. */}
                            <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3">
                                <Bus className="text-brand-600 h-5 w-5" />
                                <span className="text-sm font-medium text-neutral-600">
                                    Coming soon to Google Play
                                </span>
                            </div>
                        </div>
                        <div>
                            <WaitlistForm />
                        </div>
                    </div>
                </Reveal>
            </section>

            <Footer />
        </div>
    )
}
