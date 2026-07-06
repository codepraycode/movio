import { Bus, MapPin, Wifi } from 'lucide-react'

/**
 * A faux "live shuttle map" card for the hero — a bus drives along the route,
 * stops pulse, and an ETA ticks. Pure SVG/CSS, sells the core Movio idea.
 */
export function HeroVisual() {
    return (
        <div className="animate-float relative mx-auto w-full max-w-sm">
            {/* glow */}
            <div className="bg-brand-400/30 absolute inset-0 -z-10 rounded-[2rem] blur-3xl" />

            <div className="shadow-brand-900/10 overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-2xl">
                {/* App top bar */}
                <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-pulse-ring bg-brand-500 absolute inline-flex h-full w-full rounded-full" />
                            <span className="bg-brand-500 relative inline-flex h-2.5 w-2.5 rounded-full" />
                        </span>
                        <span className="text-sm font-semibold text-neutral-800">
                            Shuttle 02 · Live
                        </span>
                    </div>
                    <Wifi className="text-brand-500 h-4 w-4" />
                </div>

                {/* Map */}
                <div className="bg-route bg-brand-50/40 relative h-56">
                    <svg viewBox="0 0 320 224" className="absolute inset-0 h-full w-full">
                        <path
                            id="route"
                            d="M30 190 C 90 150, 70 90, 140 90 S 250 120, 290 40"
                            fill="none"
                            stroke="#16a34a"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray="2 12"
                            opacity="0.55"
                        />
                        {/* Origin + destination stops */}
                        <circle cx="30" cy="190" r="6" fill="#0f7a52" />
                        <circle cx="290" cy="40" r="6" fill="#0f7a52" />
                        <circle cx="290" cy="40" r="6" fill="#16a34a" opacity="0.5">
                            <animate
                                attributeName="r"
                                values="6;16;6"
                                dur="2.2s"
                                repeatCount="indefinite"
                            />
                            <animate
                                attributeName="opacity"
                                values="0.5;0;0.5"
                                dur="2.2s"
                                repeatCount="indefinite"
                            />
                        </circle>

                        {/* The bus, driving the route */}
                        <g>
                            <circle r="14" fill="#16a34a" />
                            <circle r="14" fill="#16a34a" opacity="0.35">
                                <animate
                                    attributeName="r"
                                    values="14;22;14"
                                    dur="1.8s"
                                    repeatCount="indefinite"
                                />
                                <animate
                                    attributeName="opacity"
                                    values="0.35;0;0.35"
                                    dur="1.8s"
                                    repeatCount="indefinite"
                                />
                            </circle>
                            <animateMotion
                                dur="6s"
                                repeatCount="indefinite"
                                rotate="0"
                                keyPoints="0;1"
                                keyTimes="0;1"
                                calcMode="linear"
                            >
                                <mpath href="#route" />
                            </animateMotion>
                        </g>
                    </svg>

                    {/* Bus glyph pinned to centre of the moving group is hard in pure SVG;
                        overlay a floating chip instead for the "your stop" marker. */}
                    <div className="text-brand-700 absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur">
                        <MapPin className="h-3.5 w-3.5" />
                        Your stop
                    </div>
                </div>

                {/* ETA bar */}
                <div className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-brand-600 flex h-10 w-10 items-center justify-center rounded-xl text-white">
                            <Bus className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-sm font-bold text-neutral-900">Arriving in 3 min</p>
                            <p className="text-xs text-neutral-500">12 seats free · Tap to board</p>
                        </div>
                    </div>
                    <span className="bg-brand-50 text-brand-700 rounded-full px-3 py-1 text-xs font-bold">
                        ₦0 cash
                    </span>
                </div>
            </div>
        </div>
    )
}
