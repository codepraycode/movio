import { useCallback, useEffect, useState } from 'react'
import { Info, Leaf } from 'lucide-react'
import { getRidershipReport } from '../lib/api'

// No backend field exists yet for this figure - AGENTS.md lists a real
// fuel-consumption number from FUTA's Transport Unit as an open item still
// pending as of this writing. Rather than invent a plausible-sounding
// default (which would misrepresent a real number as already confirmed),
// this starts blank and the admin enters/persists their own working
// estimate client-side, same localStorage pattern already used for auth.
const FUEL_PER_TRIP_KEY = 'movio_fuel_per_trip_estimate'

function readStoredEstimate(): number | null {
    const raw = localStorage.getItem(FUEL_PER_TRIP_KEY)
    if (!raw) return null
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export default function Sustainability() {
    const [totalTrips, setTotalTrips] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [fuelPerTrip, setFuelPerTrip] = useState<number | null>(readStoredEstimate)
    const [draft, setDraft] = useState(() => readStoredEstimate()?.toString() ?? '')

    const refresh = useCallback(async () => {
        try {
            const rows = await getRidershipReport('day')
            setTotalTrips(rows.reduce((sum, row) => sum + row.boarding_count, 0))
            setError(null)
        } catch {
            setError('Could not load ridership data for this estimate.')
        }
    }, [])

    useEffect(() => {
        // setTimeout(…, 0) defers this off the effect's synchronous call stack -
        // see the same pattern/reasoning in StatusFooter.tsx.
        const timeout = setTimeout(refresh, 0)
        return () => clearTimeout(timeout)
    }, [refresh])

    function handleSaveEstimate() {
        const parsed = Number(draft)
        if (!Number.isFinite(parsed) || parsed <= 0) return
        localStorage.setItem(FUEL_PER_TRIP_KEY, String(parsed))
        setFuelPerTrip(parsed)
    }

    const estimatedLitres =
        totalTrips != null && fuelPerTrip != null ? totalTrips * fuelPerTrip : null

    return (
        <div className="max-w-3xl">
            <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-sustain" aria-hidden="true" />
                <h1 className="text-xl font-semibold text-ink">Sustainability</h1>
            </div>
            <p className="text-sm text-ink/50 mt-1">
                Estimated fuel saved by trips taken through MovIO instead of private vehicles.
            </p>

            {error && (
                <div className="text-sm text-alert bg-alert/10 border border-alert/20 rounded-lg px-3 py-2 mt-4">
                    {error}
                </div>
            )}

            <div className="bg-surface border border-line rounded-xl p-6 mt-5">
                <div className="flex items-start gap-2">
                    {estimatedLitres != null ? (
                        <p className="text-4xl font-semibold text-sustain font-mono">
                            {estimatedLitres.toLocaleString()} L
                        </p>
                    ) : (
                        <p className="text-lg text-ink/50">
                            Enter an estimated fuel figure below to see this number.
                        </p>
                    )}
                    <span
                        title={`Total MovIO trips (${totalTrips ?? '…'}) × estimated litres saved per trip vs. a private vehicle equivalent.`}
                    >
                        <Info className="h-4 w-4 text-ink/30 mt-1.5" aria-hidden="true" />
                    </span>
                </div>
                {estimatedLitres != null && (
                    <p className="text-xs text-ink/40 mt-1">
                        Estimated · pending confirmed fuel data
                    </p>
                )}

                <p className="text-sm text-ink/60 mt-4">
                    Trips taken via MovIO: <span className="font-mono">{totalTrips ?? '…'}</span>
                </p>

                <div className="mt-5 pt-5 border-t border-line">
                    <label
                        htmlFor="fuel-estimate"
                        className="block text-sm font-medium text-ink mb-1"
                    >
                        Estimated fuel saved per trip (litres)
                    </label>
                    <p className="text-xs text-ink/50 mb-2">
                        Set from FUTA's Transport Unit once a confirmed figure is available. Saved
                        on this device only.
                    </p>
                    <div className="flex gap-2">
                        <input
                            id="fuel-estimate"
                            type="number"
                            min="0"
                            step="0.1"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            className="w-40 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:border-brand"
                        />
                        <button
                            onClick={handleSaveEstimate}
                            className="text-sm font-medium bg-brand text-white rounded-lg px-4 py-2 hover:bg-brand/90 transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
