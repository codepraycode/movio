import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { createVehicle, getVehicles, updateVehicle, type Vehicle, type VehicleType } from '../lib/api'

const VEHICLE_TYPES: VehicleType[] = ['bus', 'cab', 'tricycle']

function emptyForm(): { plateNumber: string; vehicleType: VehicleType; capacity: string } {
    return { plateNumber: '', vehicleType: 'bus', capacity: '' }
}

export default function Vehicles() {
    const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [plateNumber, setPlateNumber] = useState('')
    const [vehicleType, setVehicleType] = useState<VehicleType>('bus')
    const [capacity, setCapacity] = useState('')
    const [formError, setFormError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [togglingId, setTogglingId] = useState<string | null>(null)

    const refresh = useCallback(async () => {
        try {
            const data = await getVehicles()
            setVehicles(data)
            setError(null)
        } catch {
            setError('Could not load vehicles.')
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
        setPlateNumber(form.plateNumber)
        setVehicleType(form.vehicleType)
        setCapacity(form.capacity)
        setFormError(null)
        setFormOpen(true)
    }

    function openEditForm(vehicle: Vehicle) {
        setEditingId(vehicle.vehicle_id)
        setPlateNumber(vehicle.plate_number)
        setVehicleType(vehicle.vehicle_type)
        setCapacity(String(vehicle.capacity))
        setFormError(null)
        setFormOpen(true)
    }

    function closeForm() {
        setFormOpen(false)
        setFormError(null)
    }

    async function handleSubmit() {
        if (!plateNumber.trim()) {
            setFormError('Plate number is required.')
            return
        }
        const parsedCapacity = Number(capacity)
        if (!Number.isInteger(parsedCapacity) || parsedCapacity <= 0) {
            setFormError('Capacity must be a positive whole number.')
            return
        }

        setSaving(true)
        setFormError(null)
        try {
            if (editingId) {
                await updateVehicle(editingId, {
                    plate_number: plateNumber,
                    vehicle_type: vehicleType,
                    capacity: parsedCapacity,
                })
            } else {
                await createVehicle(plateNumber, vehicleType, parsedCapacity)
            }
            await refresh()
            closeForm()
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Could not save vehicle.')
        } finally {
            setSaving(false)
        }
    }

    async function handleToggleActive(vehicle: Vehicle) {
        setTogglingId(vehicle.vehicle_id)
        try {
            await updateVehicle(vehicle.vehicle_id, { is_active: !vehicle.is_active })
            await refresh()
        } catch {
            setError('Could not update that vehicle. Try again.')
        } finally {
            setTogglingId(null)
        }
    }

    return (
        <div className="max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-ink">Vehicles</h1>
                    <p className="text-sm text-ink/50 mt-1">The fleet available to be assigned to trips.</p>
                </div>
                {!formOpen && (
                    <button
                        onClick={openCreateForm}
                        className="flex items-center gap-1.5 text-sm font-medium bg-brand text-white rounded-lg px-4 py-2 hover:bg-brand/90 transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        New vehicle
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
                        {editingId ? 'Edit vehicle' : 'New vehicle'}
                    </h2>

                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label htmlFor="plate-number" className="block text-xs font-medium text-ink/60 mb-1">
                                Plate number
                            </label>
                            <input
                                id="plate-number"
                                type="text"
                                value={plateNumber}
                                onChange={(e) => setPlateNumber(e.target.value)}
                                placeholder="e.g. FUTA-002"
                                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:border-brand"
                            />
                        </div>
                        <div>
                            <label htmlFor="vehicle-type" className="block text-xs font-medium text-ink/60 mb-1">
                                Type
                            </label>
                            <select
                                id="vehicle-type"
                                value={vehicleType}
                                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                                className="w-36 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:border-brand capitalize"
                            >
                                {VEHICLE_TYPES.map((t) => (
                                    <option key={t} value={t} className="capitalize">
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="capacity" className="block text-xs font-medium text-ink/60 mb-1">
                                Capacity
                            </label>
                            <input
                                id="capacity"
                                type="number"
                                min="1"
                                step="1"
                                value={capacity}
                                onChange={(e) => setCapacity(e.target.value)}
                                placeholder="e.g. 40"
                                className="w-24 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:border-brand"
                            />
                        </div>
                    </div>

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
                            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create vehicle'}
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
                {vehicles && vehicles.length === 0 ? (
                    <p className="text-sm text-ink/50 px-4 py-8 text-center">No vehicles yet.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-ink/40 border-b border-line">
                                <th className="font-medium px-4 py-2.5">Plate</th>
                                <th className="font-medium px-4 py-2.5">Type</th>
                                <th className="font-medium px-4 py-2.5">Capacity</th>
                                <th className="font-medium px-4 py-2.5">Status</th>
                                <th className="font-medium px-4 py-2.5"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {(vehicles ?? []).map((v) => (
                                <tr key={v.vehicle_id} className="border-b border-line last:border-0">
                                    <td className="px-4 py-3">{v.plate_number}</td>
                                    <td className="px-4 py-3 text-ink/60 capitalize">{v.vehicle_type}</td>
                                    <td className="px-4 py-3 font-mono">{v.capacity}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                                v.is_active ? 'text-brand bg-brand/10' : 'text-ink/50 bg-ink/5'
                                            }`}
                                        >
                                            {v.is_active ? 'Active' : 'Deactivated'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        <button
                                            onClick={() => openEditForm(v)}
                                            className="text-sm font-medium text-brand hover:text-brand/80 transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 outline-none rounded px-1.5 py-1"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(v)}
                                            disabled={togglingId === v.vehicle_id}
                                            className="text-sm font-medium text-ink/60 hover:text-ink disabled:opacity-50 transition-colors ml-3 focus-visible:ring-2 focus-visible:ring-brand/40 outline-none rounded px-1.5 py-1"
                                        >
                                            {v.is_active ? 'Deactivate' : 'Reactivate'}
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
