import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { createRoute, getRoutes, updateRoute, type RouteRecord, type RouteStop } from '../lib/api'

const EMPTY_STOP: RouteStop = { name: '', lat: 0, lng: 0 }

function emptyForm(): { routeName: string; stops: RouteStop[] } {
    return { routeName: '', stops: [{ ...EMPTY_STOP }, { ...EMPTY_STOP }] }
}

export default function Routes() {
    const [routes, setRoutes] = useState<RouteRecord[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [routeName, setRouteName] = useState('')
    const [stops, setStops] = useState<RouteStop[]>(emptyForm().stops)
    const [formError, setFormError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const refresh = useCallback(async () => {
        try {
            const data = await getRoutes()
            setRoutes(data)
            setError(null)
        } catch {
            setError('Could not load routes.')
        }
    }, [])

    useEffect(() => {
        // setTimeout(…, 0) defers this off the effect's synchronous call stack -
        // see the same pattern/reasoning in StatusFooter.tsx.
        const timeout = setTimeout(refresh, 0)
        return () => clearTimeout(timeout)
    }, [refresh])

    function openCreateForm() {
        setEditingId(null)
        const form = emptyForm()
        setRouteName(form.routeName)
        setStops(form.stops)
        setFormError(null)
        setFormOpen(true)
    }

    function openEditForm(route: RouteRecord) {
        setEditingId(route.route_id)
        setRouteName(route.route_name)
        setStops(route.stops.map((s) => ({ ...s })))
        setFormError(null)
        setFormOpen(true)
    }

    function closeForm() {
        setFormOpen(false)
        setFormError(null)
    }

    function updateStop(index: number, field: keyof RouteStop, value: string) {
        setStops((prev) =>
            prev.map((stop, i) =>
                i === index
                    ? { ...stop, [field]: field === 'name' ? value : Number(value) }
                    : stop
            )
        )
    }

    function addStop() {
        setStops((prev) => [...prev, { ...EMPTY_STOP }])
    }

    function removeStop(index: number) {
        setStops((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)))
    }

    async function handleSubmit() {
        if (!routeName.trim()) {
            setFormError('Route name is required.')
            return
        }
        if (stops.length < 2) {
            setFormError('A route needs at least 2 stops.')
            return
        }
        if (stops.some((s) => !s.name.trim())) {
            setFormError('Every stop needs a name.')
            return
        }

        setSaving(true)
        setFormError(null)
        try {
            if (editingId) {
                await updateRoute(editingId, { route_name: routeName, stops })
            } else {
                await createRoute(routeName, stops)
            }
            await refresh()
            closeForm()
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Could not save route.')
        } finally {
            setSaving(false)
        }
    }

    async function handleToggleActive(route: RouteRecord) {
        try {
            await updateRoute(route.route_id, { is_active: !route.is_active })
            await refresh()
        } catch {
            setError('Could not update that route. Try again.')
        }
    }

    return (
        <div className="max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-ink">Routes</h1>
                    <p className="text-sm text-ink/50 mt-1">
                        Campus routes and their stops, used when a driver starts a trip.
                    </p>
                </div>
                {!formOpen && (
                    <button
                        onClick={openCreateForm}
                        className="flex items-center gap-1.5 text-sm font-medium bg-brand text-white rounded-lg px-4 py-2 hover:bg-brand/90 transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        New route
                    </button>
                )}
            </div>

            {error && (
                <div className="text-sm text-alert bg-alert/10 border border-alert/20 rounded-lg px-3 py-2 mt-4">
                    {error}
                </div>
            )}

            {formOpen && (
                <div className="bg-surface border border-line rounded-xl p-5 mt-5">
                    <h2 className="text-sm font-semibold text-ink mb-3">
                        {editingId ? 'Edit route' : 'New route'}
                    </h2>

                    <label htmlFor="route-name" className="block text-xs font-medium text-ink/60 mb-1">
                        Route name
                    </label>
                    <input
                        id="route-name"
                        type="text"
                        value={routeName}
                        onChange={(e) => setRouteName(e.target.value)}
                        placeholder="e.g. South Gate to West Gate"
                        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:border-brand mb-4"
                    />

                    <p className="text-xs font-medium text-ink/60 mb-2">Stops (at least 2)</p>
                    <div className="space-y-2">
                        {stops.map((stop, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    value={stop.name}
                                    onChange={(e) => updateStop(index, 'name', e.target.value)}
                                    placeholder="Stop name"
                                    className="flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:border-brand"
                                />
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={stop.lat}
                                    onChange={(e) => updateStop(index, 'lat', e.target.value)}
                                    placeholder="Lat"
                                    className="w-28 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:border-brand"
                                />
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={stop.lng}
                                    onChange={(e) => updateStop(index, 'lng', e.target.value)}
                                    placeholder="Lng"
                                    className="w-28 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:border-brand"
                                />
                                <button
                                    onClick={() => removeStop(index)}
                                    disabled={stops.length <= 2}
                                    aria-label={`Remove stop ${index + 1}`}
                                    className="text-ink/40 hover:text-alert disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1.5 rounded focus-visible:ring-2 focus-visible:ring-brand/40 outline-none"
                                >
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addStop}
                        className="flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand/80 transition-colors mt-2 focus-visible:ring-2 focus-visible:ring-brand/40 outline-none rounded px-1.5 py-1"
                    >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        Add stop
                    </button>

                    {formError && (
                        <div className="text-sm text-alert bg-alert/10 border border-alert/20 rounded-lg px-3 py-2 mt-4">
                            {formError}
                        </div>
                    )}

                    <div className="flex gap-2 mt-5 pt-4 border-t border-line">
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="text-sm font-medium bg-brand text-white rounded-lg px-4 py-2 hover:bg-brand/90 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2"
                        >
                            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create route'}
                        </button>
                        <button
                            onClick={closeForm}
                            disabled={saving}
                            className="text-sm font-medium text-ink/70 hover:text-ink transition-colors px-4 py-2 focus-visible:ring-2 focus-visible:ring-brand/40 outline-none rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-surface border border-line rounded-xl overflow-hidden mt-5">
                {routes && routes.length === 0 ? (
                    <p className="text-sm text-ink/50 px-4 py-8 text-center">No routes yet.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-ink/40 border-b border-line">
                                <th className="font-medium px-4 py-2.5">Route</th>
                                <th className="font-medium px-4 py-2.5">Stops</th>
                                <th className="font-medium px-4 py-2.5">Status</th>
                                <th className="font-medium px-4 py-2.5"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {(routes ?? []).map((route) => (
                                <tr key={route.route_id} className="border-b border-line last:border-0">
                                    <td className="px-4 py-3">{route.route_name}</td>
                                    <td className="px-4 py-3 text-ink/60">
                                        {route.stops.map((s) => s.name).join(' → ')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                                route.is_active
                                                    ? 'text-brand bg-brand/10'
                                                    : 'text-ink/50 bg-ink/5'
                                            }`}
                                        >
                                            {route.is_active ? 'Active' : 'Deactivated'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        <button
                                            onClick={() => openEditForm(route)}
                                            className="text-sm font-medium text-brand hover:text-brand/80 transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 outline-none rounded px-1.5 py-1"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(route)}
                                            className="text-sm font-medium text-ink/60 hover:text-ink transition-colors ml-3 focus-visible:ring-2 focus-visible:ring-brand/40 outline-none rounded px-1.5 py-1"
                                        >
                                            {route.is_active ? 'Deactivate' : 'Reactivate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
