import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Radio, XCircle, type LucideIcon } from 'lucide-react'
import { getTripsMonitor, type TripMonitorRow, type TripMonitorStatus } from '../lib/api'
import { formatDuration, formatElapsed, timeAgo } from '../lib/format'

// Matches the TapTrace device's real ~5s location-update cadence (AGENTS.md),
// same POLL_INTERVAL_MS convention as Overview.tsx's Fleet Map.
const POLL_INTERVAL_MS = 5_000

const STATUS_META: Record<TripMonitorStatus, { label: string; className: string; icon: LucideIcon }> = {
    active: { label: 'Active', className: 'text-brand bg-brand/10', icon: Radio },
    completed: { label: 'Completed', className: 'text-ink/50 bg-ink/5', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', className: 'text-alert bg-alert/10', icon: XCircle },
}

export default function TripMonitoring() {
    const [trips, setTrips] = useState<TripMonitorRow[] | null>(null)
    const [error, setError] = useState<string | null>(null)

    const refresh = useCallback(async () => {
        try {
            const data = await getTripsMonitor()
            setTrips(data)
            setError(null)
        } catch {
            setError('Could not load trip data.')
        }
    }, [])

    useEffect(() => {
        // setTimeout(…, 0) defers the initial call off the effect's synchronous
        // call stack - see the same pattern/reasoning in StatusFooter.tsx.
        const initial = setTimeout(refresh, 0)
        const interval = setInterval(refresh, POLL_INTERVAL_MS)
        return () => {
            clearTimeout(initial)
            clearInterval(interval)
        }
    }, [refresh])

    return (
        <div className="max-w-5xl">
            <h1 className="text-xl font-semibold text-ink">Trip Monitoring</h1>
            <p className="text-sm text-ink/50 mt-1">
                Active and recently completed trips, with live passenger counts.
            </p>

            {error && (
                <div className="text-sm text-alert bg-alert/10 border border-alert/20 rounded-lg px-3 py-2 mt-4">
                    {error}
                </div>
            )}

            <div className="bg-surface border border-line rounded-xl overflow-hidden mt-5">
                {trips && trips.length === 0 ? (
                    <p className="text-sm text-ink/50 px-4 py-8 text-center">
                        No trips yet. Trips appear here once a driver starts one.
                    </p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-ink/40 border-b border-line">
                                <th className="font-medium px-4 py-2.5">Vehicle</th>
                                <th className="font-medium px-4 py-2.5">Route</th>
                                <th className="font-medium px-4 py-2.5">Driver</th>
                                <th className="font-medium px-4 py-2.5">Status</th>
                                <th className="font-medium px-4 py-2.5">Passengers</th>
                                <th className="font-medium px-4 py-2.5">Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(trips ?? []).map((trip) => {
                                const meta = STATUS_META[trip.status]
                                const Icon = meta.icon
                                return (
                                    <tr key={trip.trip_id} className="border-b border-line last:border-0">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {trip.plate_number}
                                            <span className="text-ink/40 capitalize"> · {trip.vehicle_type}</span>
                                        </td>
                                        <td className="px-4 py-3 text-ink/60">
                                            {trip.route_name ?? 'No route assigned'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {trip.driver_first_name} {trip.driver_last_name}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}
                                            >
                                                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                                {meta.label}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono">
                                            {trip.passenger_count}/{trip.capacity}
                                        </td>
                                        <td className="px-4 py-3 text-ink/50 whitespace-nowrap">
                                            {trip.status === 'active'
                                                ? formatDuration(trip.start_time)
                                                : trip.end_time
                                                  ? formatElapsed(trip.start_time, trip.end_time)
                                                  : '—'}
                                            <span className="text-ink/30 text-xs block">
                                                started {timeAgo(trip.start_time)}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
