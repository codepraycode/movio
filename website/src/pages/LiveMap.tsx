import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowLeft, Crosshair, RefreshCw, WifiOff, X } from 'lucide-react'
import { LogoMark } from '@/components/Logo'
import { Seo } from '@/components/Seo'
import { fetchActiveTrips, normalizeTrip, type PublicTrip } from '@/lib/track-api'
import { getSocket } from '@/lib/socket'

// ── Campus geography (mirrors the mobile live map) ──────────────────────────
const SOUTHGATE: [number, number] = [7.303739, 5.138726]
// FUTA fence — the map is hard-contained inside this box (a campus map, not a
// world map). NE (top) and SW (bottom) corners, same values as mobile.
const FUTA_BOUNDS = L.latLngBounds([7.28887, 5.10894], [7.31914, 5.15525])

// ── Per-type styling: green shuttle, amber cab, teal keke (no dashboard blue) ─
const BUS_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2s-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>'
const CAB_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.6-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>'
const KEKE_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>'

interface VehicleStyle {
    color: string
    label: string
    svg: string
}

function styleFor(type: string): VehicleStyle {
    switch (type) {
        case 'cab':
            return { color: '#d97706', label: 'Cab', svg: CAB_SVG }
        case 'tricycle':
            return { color: '#0f766e', label: 'Keke', svg: KEKE_SVG }
        case 'bus':
        default:
            return { color: '#16a34a', label: 'Shuttle', svg: BUS_SVG }
    }
}

function makeIcon(type: string, selected: boolean): L.DivIcon {
    const { color } = styleFor(type)
    const size = selected ? 46 : 38
    const ring = selected
        ? `<span class="movio-pin__ring" style="background:${color}"></span>`
        : ''
    const html = `
        ${ring}
        <div class="movio-pin" style="width:${size}px;height:${size}px;border:2px solid ${
            selected ? '#fff' : color
        };color:${selected ? '#fff' : color};background:${selected ? color : '#fff'}">
            ${styleFor(type).svg}
        </div>`
    return L.divIcon({
        html,
        className: '', // strip Leaflet's default .leaflet-div-icon box
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    })
}

// ── Helper map children ─────────────────────────────────────────────────────

/** Frames the camera onto the vehicles the first time any appear. */
function FitOnce({ points, enabled }: { points: [number, number][]; enabled: boolean }) {
    const map = useMap()
    const done = useRef(false)
    useEffect(() => {
        if (done.current || !enabled || points.length === 0) return
        done.current = true
        if (points.length === 1) {
            map.setView(points[0], 16)
        } else {
            map.fitBounds(points, { padding: [64, 64], maxZoom: 16 })
        }
    }, [map, points, enabled])
    return null
}

/** Deselects when the empty map is clicked. */
function MapClick({ onClick }: { onClick: () => void }) {
    useMapEvents({ click: () => onClick() })
    return null
}

// ── Page ────────────────────────────────────────────────────────────────────

export function LiveMap() {
    const [trips, setTrips] = useState<Record<string, PublicTrip>>({})
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [offline, setOffline] = useState(false)
    const [connected, setConnected] = useState(false)
    const mapRef = useRef<L.Map | null>(null)
    const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const loadRoster = useCallback(async (signal?: AbortSignal) => {
        try {
            const fresh = await fetchActiveTrips(signal)
            setTrips((prev) => {
                const next: Record<string, PublicTrip> = {}
                for (const t of fresh) {
                    const ex = prev[t.trip_id]
                    if (ex && ex.latitude != null) {
                        // Keep whichever position is newer (socket pings update
                        // last_location_at to "now"; the roll-call may lag).
                        const exTime = ex.last_location_at ? Date.parse(ex.last_location_at) : 0
                        const frTime = t.last_location_at ? Date.parse(t.last_location_at) : 0
                        const keepEx = exTime >= frTime
                        next[t.trip_id] = keepEx
                            ? {
                                  ...t,
                                  latitude: ex.latitude,
                                  longitude: ex.longitude,
                                  last_location_at: ex.last_location_at,
                              }
                            : t
                    } else {
                        next[t.trip_id] = t
                    }
                }
                return next
            })
            setOffline(false)
        } catch {
            // Backend unreachable / waking up (Render cold start). Keep whatever
            // we last had on screen and surface the honest offline state.
            setOffline(true)
        } finally {
            setLoading(false)
        }
    }, [])

    const scheduleRefresh = useCallback(() => {
        if (refreshTimer.current) return
        refreshTimer.current = setTimeout(() => {
            refreshTimer.current = null
            void loadRoster()
        }, 1800)
    }, [loadRoster])

    // Initial load + socket wiring + reconciliation poll.
    useEffect(() => {
        const ctrl = new AbortController()
        void loadRoster(ctrl.signal)

        const socket = getSocket()

        const onLocation = (data: unknown) => {
            const d = data as Record<string, unknown>
            const id = String(d.trip_id)
            const lat = typeof d.latitude === 'number' ? d.latitude : parseFloat(String(d.latitude))
            const lng =
                typeof d.longitude === 'number' ? d.longitude : parseFloat(String(d.longitude))
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
            setTrips((prev) => {
                const ex = prev[id]
                if (!ex) {
                    // A trip we don't know yet (started before the page opened, or
                    // its first fix) — pull a fresh roster shortly.
                    scheduleRefresh()
                    return prev
                }
                return {
                    ...prev,
                    [id]: {
                        ...ex,
                        latitude: lat,
                        longitude: lng,
                        last_location_at: new Date().toISOString(),
                    },
                }
            })
        }

        const onStarted = (data: unknown) => {
            const t = normalizeTrip(data as Record<string, unknown>)
            setTrips((prev) => ({ ...prev, [t.trip_id]: t }))
        }

        const onEnded = (data: unknown) => {
            const id = String((data as Record<string, unknown>).trip_id)
            setTrips((prev) => {
                if (!prev[id]) return prev
                const next = { ...prev }
                delete next[id]
                return next
            })
            setSelectedId((cur) => (cur === id ? null : cur))
        }

        const onPassengers = (data: unknown) => {
            const d = data as Record<string, unknown>
            const id = String(d.trip_id)
            const count =
                typeof d.passenger_count === 'number'
                    ? d.passenger_count
                    : parseInt(String(d.passenger_count), 10)
            if (!Number.isFinite(count)) return
            setTrips((prev) =>
                prev[id] ? { ...prev, [id]: { ...prev[id], passenger_count: count } } : prev,
            )
        }

        socket.on('connect', () => setConnected(true))
        socket.on('disconnect', () => setConnected(false))
        socket.on('connect_error', () => setConnected(false))
        socket.on('location:update', onLocation)
        socket.on('trip:started', onStarted)
        socket.on('trip:ended', onEnded)
        socket.on('trip:passengers', onPassengers)
        socket.connect()

        const poll = setInterval(() => void loadRoster(), 20_000)

        return () => {
            ctrl.abort()
            clearInterval(poll)
            if (refreshTimer.current) clearTimeout(refreshTimer.current)
            socket.off('connect')
            socket.off('disconnect')
            socket.off('connect_error')
            socket.off('location:update', onLocation)
            socket.off('trip:started', onStarted)
            socket.off('trip:ended', onEnded)
            socket.off('trip:passengers', onPassengers)
            socket.disconnect()
        }
    }, [loadRoster, scheduleRefresh])

    const retry = useCallback(() => {
        setLoading(true)
        void loadRoster()
        getSocket().connect()
    }, [loadRoster])

    const located = Object.values(trips).filter((t) => t.latitude != null && t.longitude != null)
    const selected = selectedId ? trips[selectedId] : null
    const points = located.map((t) => [t.latitude as number, t.longitude as number] as [number, number])

    const fitAll = () => {
        const map = mapRef.current
        if (!map || points.length === 0) return
        if (points.length === 1) map.setView(points[0], 16)
        else map.fitBounds(points, { padding: [64, 64], maxZoom: 16 })
    }

    return (
        <div className="relative h-[100dvh] w-full overflow-hidden bg-[#eae7e1]">
            <Seo
                title="Live campus map — Mobility Optimization Via Intelligent Operation | FUTA"
                description="See FUTA campus shuttles, cabs and kekes moving in real time. No sign-in needed — the live Movio map, right in your browser."
                path="/live"
            />

            <MapContainer
                center={SOUTHGATE}
                zoom={18}
                minZoom={16}
                maxZoom={20}
                maxBounds={FUTA_BOUNDS}
                maxBoundsViscosity={1}
                zoomControl={false}
                className="absolute inset-0 z-0 h-full w-full"
                ref={(m) => {
                    mapRef.current = m
                }}
            >
                <TileLayer
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    maxZoom={19}
                />
                <FitOnce points={points} enabled={!selected} />
                <MapClick onClick={() => setSelectedId(null)} />
                {located.map((t) => (
                    <Marker
                        key={t.trip_id}
                        position={[t.latitude as number, t.longitude as number]}
                        icon={makeIcon(t.vehicle_type, t.trip_id === selectedId)}
                        eventHandlers={{ click: () => setSelectedId(t.trip_id) }}
                    />
                ))}
            </MapContainer>

            {/* top scrim + bar */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-black/25 to-transparent" />
            <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-3 sm:p-4">
                <div className="flex items-center gap-2">
                    <Link
                        to="/"
                        aria-label="Back to home"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-800 shadow-md transition hover:bg-neutral-50"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <span className="hidden items-center gap-2 rounded-full bg-white/90 px-3 py-2 shadow-md backdrop-blur sm:inline-flex">
                        <LogoMark className="h-5 w-5" />
                        <span className="text-sm font-bold text-neutral-900">
                            Mov<span className="text-brand-600">IO</span> FUTA MAP
                        </span>
                    </span>
                </div>
                <button
                    onClick={fitAll}
                    aria-label="Recenter on vehicles"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-800 shadow-md transition hover:bg-neutral-50"
                >
                    <Crosshair className="h-5 w-5" />
                </button>
            </header>

            {/* connectivity / status pill */}
            <StatusPill loading={loading} offline={offline} connected={connected} onRetry={retry} />

            {/* bottom panel: selected vehicle, or the summary bar */}
            <div className="absolute inset-x-0 bottom-0 z-20 p-3 sm:p-4">
                <div className="mx-auto max-w-md">
                    {selected ? (
                        <VehicleCard trip={selected} onClose={() => setSelectedId(null)} />
                    ) : (
                        <SummaryBar
                            count={located.length}
                            connected={connected}
                            loading={loading}
                            offline={offline}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Status pill (top center) ────────────────────────────────────────────────

function StatusPill({
    loading,
    offline,
    connected,
    onRetry,
}: {
    loading: boolean
    offline: boolean
    connected: boolean
    onRetry: () => void
}) {
    if (offline) {
        return (
            <div className="absolute inset-x-0 top-16 z-30 flex justify-center px-4 sm:top-20">
                <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-neutral-800"
                >
                    <WifiOff className="h-4 w-4 text-accent-400" />
                    Live tracking is offline — tap to retry
                    <RefreshCw className="h-3.5 w-3.5" />
                </button>
            </div>
        )
    }
    if (loading) {
        return (
            <div className="absolute inset-x-0 top-16 z-30 flex justify-center px-4 sm:top-20">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-lg">
                    <RefreshCw className="h-4 w-4 animate-spin text-brand-600" />
                    Loading live map…
                </span>
            </div>
        )
    }
    if (!connected) {
        return (
            <div className="absolute inset-x-0 top-16 z-30 flex justify-center px-4 sm:top-20">
                <span className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-accent-400" />
                    Reconnecting to live feed…
                </span>
            </div>
        )
    }
    return null
}

// ── Summary bar (nothing selected) ──────────────────────────────────────────

function SummaryBar({
    count,
    connected,
    loading,
    offline,
}: {
    count: number
    connected: boolean
    loading: boolean
    offline: boolean
}) {
    let headline: string
    if (offline) headline = 'Live tracking is offline'
    else if (loading) headline = 'Finding active vehicles…'
    else if (count === 0) headline = 'No vehicle active on campus right now'
    else headline = `${count} vehicle${count === 1 ? '' : 's'} moving on campus`

    const live = connected && !offline && count > 0

    return (
        <div className="rounded-2xl bg-white p-4 shadow-lift">
            <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                    {live && (
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-70" />
                    )}
                    <span
                        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                            live ? 'bg-brand-500' : 'bg-neutral-300'
                        }`}
                    />
                </span>
                <p className="flex-1 truncate text-sm font-semibold text-neutral-900">{headline}</p>
                {count > 0 && (
                    <span className="text-xs text-neutral-400">Tap a vehicle</span>
                )}
            </div>
            <div className="mt-3 border-t border-neutral-100 pt-3">
                <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                    <LegendChip type="bus" />
                    <LegendChip type="cab" />
                    <LegendChip type="tricycle" />
                </div>
            </div>
        </div>
    )
}

function LegendChip({ type }: { type: string }) {
    const { color, label, svg } = styleFor(type)
    return (
        <span className="inline-flex items-center gap-1.5 text-xs text-neutral-600">
            <span
                className="inline-flex h-4 w-4 items-center justify-center"
                style={{ color }}
                dangerouslySetInnerHTML={{ __html: svg }}
            />
            {label}
        </span>
    )
}

// ── Vehicle detail card (a vehicle is selected) ─────────────────────────────

function VehicleCard({ trip, onClose }: { trip: PublicTrip; onClose: () => void }) {
    const { color, label } = styleFor(trip.vehicle_type)
    const occupancy =
        trip.capacity > 0 ? Math.min(1, Math.max(0, trip.passenger_count / trip.capacity)) : 0

    // Tick every second so "updated Ns ago" stays honest while the card is open.
    const [, setNow] = useState(0)
    useEffect(() => {
        const id = setInterval(() => setNow((n) => n + 1), 1000)
        return () => clearInterval(id)
    }, [])
    const lastSeen = relativeSeen(trip.last_location_at)

    return (
        <div className="rounded-2xl bg-white p-5 shadow-lift">
            <div className="flex items-start gap-3">
                <span
                    className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${color}1f`, color }}
                    dangerouslySetInnerHTML={{ __html: styleFor(trip.vehicle_type).svg }}
                />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-neutral-900">
                        {trip.route_name ?? `${label} on campus`}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color }}>
                            {label}
                        </span>
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-brand-700 uppercase">
                            Active
                        </span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-neutral-50 p-3">
                <Cell label="Vehicle no." value={trip.plate_number || '—'} mono />
                <Cell label="Onboard" value={`${trip.passenger_count} / ${trip.capacity} seats`} />
            </div>

            <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Occupancy</span>
                    <span className="font-semibold text-neutral-700">
                        {Math.round(occupancy * 100)}%
                    </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${occupancy * 100}%`, backgroundColor: color }}
                    />
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                Position updated {lastSeen}
            </div>
        </div>
    )
}

function Cell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div>
            <p className="text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">
                {label}
            </p>
            <p
                className={`mt-0.5 truncate text-sm font-semibold text-neutral-900 ${
                    mono ? 'font-mono' : ''
                }`}
            >
                {value}
            </p>
        </div>
    )
}

function relativeSeen(iso: string | null): string {
    if (!iso) return 'just now'
    const secs = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000))
    if (secs <= 1) return 'moving now'
    if (secs < 60) return `${secs}s ago`
    return `${Math.floor(secs / 60)}m ago`
}
