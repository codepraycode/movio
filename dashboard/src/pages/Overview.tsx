import { useCallback, useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { divIcon } from 'leaflet'
import { getActiveTrips, type ActiveTrip, type LocationUpdateEvent } from '../lib/api'
import { getSocket } from '../lib/socket'
import { timeAgo } from '../lib/format'

// Midpoint of the two stops already seeded in backend/db/seed.sql
// (South Gate 7.2999,5.1350 / West Gate 7.3050,5.1400) - real campus
// coordinates already used elsewhere in this project, not a guess.
const CAMPUS_CENTER: [number, number] = [7.30245, 5.1375]
const CAMPUS_ZOOM = 16

// Position updates for trips already on the map arrive live via the
// location:update socket subscription below (FE-5) - this interval is now
// only a reconciliation poll, picking up trips that start or end since the
// socket payload carries no vehicle/route metadata to introduce/remove a
// marker with. 20s is plenty for that; the pulse-ring recency thresholds
// below are keyed off actual GPS timestamps, not this poll cadence.
const RECONCILE_POLL_INTERVAL_MS = 20_000

type Recency = 'live' | 'static' | 'stale'

function recencyOf(lastLocationAt: string | null): Recency {
    if (!lastLocationAt) return 'stale'
    const ageMs = Date.now() - new Date(lastLocationAt).getTime()
    if (ageMs < 5_000) return 'live'
    if (ageMs < 15_000) return 'static'
    return 'stale'
}

// Leaflet markers are plain DOM, not React - the pulse-ring signature (see
// index.css) is built as an inline-styled divIcon rather than a React marker
// component. Colors stay inside the brief's signal-amber token.
function markerIcon(recency: Recency) {
    const color = recency === 'stale' ? '#94a3b8' : '#F59E0B'
    const ring =
        recency === 'live'
            ? `<span class="pulse-ring absolute inset-0 rounded-full" style="background-color:${color}"></span>`
            : ''
    const dotStyle =
        recency === 'stale'
            ? `background:transparent;border:2px solid ${color}`
            : `background-color:${color};border:2px solid ${color}`
    return divIcon({
        html: `<span class="relative flex h-3.5 w-3.5">${ring}<span class="relative inline-flex h-3.5 w-3.5 rounded-full" style="${dotStyle}"></span></span>`,
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
    })
}

export default function Overview() {
    const [trips, setTrips] = useState<ActiveTrip[] | null>(null)
    const [error, setError] = useState<string | null>(null)

    const refresh = useCallback(async () => {
        try {
            const data = await getActiveTrips()
            console.log("Trip Data", data)
            setTrips(data)
            setError(null)
        } catch(e) {
            console.error(e)
            setError('Could not load live trip data.')
        }
    }, [])

    const handleLocationUpdate = useCallback((update: LocationUpdateEvent) => {
        setTrips((prev) =>
            prev
                ? prev.map((t) =>
                      t.trip_id === update.trip_id
                          ? {
                                ...t,
                                latitude: update.latitude,
                                longitude: update.longitude,
                                last_location_at: update.recorded_at,
                            }
                          : t
                  )
                : prev
        )
    }, [])

    useEffect(() => {
        // setTimeout(…, 0) defers the initial call off the effect's synchronous
        // call stack - see the same pattern/reasoning in StatusFooter.tsx.
        const initial = setTimeout(refresh, 0)
        const interval = setInterval(refresh, RECONCILE_POLL_INTERVAL_MS)

        const socket = getSocket()
        socket.on('location:update', handleLocationUpdate)

        return () => {
            clearTimeout(initial)
            clearInterval(interval)
            socket.off('location:update', handleLocationUpdate)
        }
    }, [refresh, handleLocationUpdate])

    const withLocation = (trips ?? []).filter((t) => t.latitude != null && t.longitude != null)
    const routesInService = new Set((trips ?? []).map((t) => t.route_name).filter(Boolean)).size

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex gap-4">
                <StatCard label="Active trips" value={trips ? trips.length : '—'} />
                <StatCard label="Routes in service" value={trips ? routesInService : '—'} />
            </div>

            <div className="flex-1 rounded-xl border border-line overflow-hidden relative min-h-[420px]">
                <MapContainer center={CAMPUS_CENTER} zoom={CAMPUS_ZOOM} className="h-full w-full">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {withLocation.map((trip) => (
                        <Marker
                            key={trip.trip_id}
                            position={[trip.latitude as number, trip.longitude as number]}
                            icon={markerIcon(recencyOf(trip.last_location_at))}
                        >
                            <Popup>
                                <div className="text-sm">
                                    <p className="font-semibold">{trip.plate_number}</p>
                                    <p className="text-ink/60 capitalize">{trip.vehicle_type}</p>
                                    <p className="text-ink/60">
                                        {trip.route_name ?? 'No route assigned'}
                                    </p>
                                    <p className="text-ink/40 text-xs mt-1">
                                        {trip.last_location_at
                                            ? `Updated ${timeAgo(trip.last_location_at)}`
                                            : 'No location yet'}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {trips && trips.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
                        <div className="bg-surface border border-line rounded-lg px-4 py-3 text-sm text-ink/70 shadow-sm">
                            No active trips right now. Trips appear here once a driver starts one.
                        </div>
                    </div>
                )}

                {error && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-alert/10 border border-alert/20 text-alert text-xs rounded-lg px-3 py-1.5 z-[1000]">
                        {error}
                    </div>
                )}
            </div>
        </div>
    )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="bg-surface border border-line rounded-xl px-4 py-3 flex-1">
            <p className="text-xs text-ink/50">{label}</p>
            <p className="text-2xl font-semibold text-ink font-mono">{value}</p>
        </div>
    )
}
