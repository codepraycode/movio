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
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { WaitlistForm } from '@/components/WaitlistForm'
import { HeroVisual } from '@/components/HeroVisual'
import { Reveal } from '@/components/Reveal'
import { LogoMark } from '@/components/Logo'
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

const features = [
    { icon: Map, text: 'A live map showing exactly where every shuttle is, right now' },
    { icon: CreditCard, text: 'Tap your student ID or phone to board — no cash, no change drama' },
    { icon: Bell, text: 'A heads-up when a shuttle is a few minutes from your stop' },
    {
        icon: BarChart3,
        text: 'Real ridership data so the school can run routes that actually work',
    },
]

export function Landing() {
    return (
        <div className="min-h-screen bg-white">
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
                            <a href="#waitlist" className="w-full sm:w-auto">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full transition-all hover:-translate-y-0.5 sm:w-auto"
                                >
                                    Join the waitlist
                                </Button>
                            </a>
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
                <div className="relative mx-auto max-w-3xl px-4">
                    <Reveal className="mb-10 text-center">
                        <LogoMark
                            animated
                            className="shadow-brand-500/20 mx-auto mb-5 h-12 w-12 rounded-2xl shadow-lg ring-1 ring-white/10"
                        />
                        <h2 className="text-2xl font-bold text-white sm:text-3xl">
                            Here’s what Movio will do
                        </h2>
                        <p className="mx-auto mt-3 max-w-xl text-neutral-400">
                            One app for students and admins — built around how FUTA actually moves.
                        </p>
                    </Reveal>
                    <ul className="space-y-3">
                        {features.map(({ icon: Icon, text }, i) => (
                            <Reveal key={text} delay={i * 100}>
                                <li className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10">
                                    <span className="bg-brand-500 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <span className="text-sm text-neutral-100 sm:text-base">
                                        {text}
                                    </span>
                                </li>
                            </Reveal>
                        ))}
                    </ul>
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

            {/* ───────────────────── Waitlist ───────────────────── */}
            <section id="waitlist" className="mx-auto max-w-md scroll-mt-20 px-4 pb-20">
                <Reveal>
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
                            Want Movio on your phone?
                        </h2>
                        <p className="mt-3 text-neutral-600">
                            Join the waitlist and be the first to know the moment it launches at
                            FUTA.
                        </p>
                    </div>
                    <WaitlistForm />
                </Reveal>
            </section>

            <Footer />
        </div>
    )
}
