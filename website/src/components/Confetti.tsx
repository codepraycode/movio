import { useMemo } from 'react'

/** Brand-leaning palette so the burst feels like Movio, not a generic party. */
const COLORS = ['#22c55e', '#16a34a', '#0f7a52', '#fbbf24', '#f59e0b', '#6ee7b7']

/** Deterministic [0,1) pseudo-random — keeps render pure (no Math.random). */
function rand(seed: number) {
    const x = Math.sin(seed * 12.9898) * 43758.5453
    return x - Math.floor(x)
}

interface ConfettiProps {
    /** Number of pieces to drop. */
    count?: number
}

/**
 * A lightweight, dependency-free confetti burst for the thank-you moment.
 * Pieces are spread with a deterministic pseudo-random so render stays pure;
 * they fall a single time, and `prefers-reduced-motion` resolves them to their
 * faded end-state (invisible).
 */
export function Confetti({ count = 36 }: ConfettiProps) {
    const pieces = useMemo(
        () =>
            Array.from({ length: count }, (_, i) => ({
                id: i,
                left: rand(i + 1) * 100,
                delay: rand(i + 2) * 0.5,
                duration: 2.6 + rand(i + 3) * 1.8,
                size: 6 + rand(i + 4) * 6,
                color: COLORS[i % COLORS.length],
                round: rand(i + 5) > 0.5,
            })),
        [count],
    )

    return (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
            {pieces.map((p) => (
                <span
                    key={p.id}
                    className="absolute top-0 block"
                    style={{
                        left: `${p.left}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        borderRadius: p.round ? '9999px' : '2px',
                        animation: `confetti-fall ${p.duration}s cubic-bezier(0.3, 0.6, 0.5, 1) ${p.delay}s forwards`,
                    }}
                />
            ))}
        </div>
    )
}
