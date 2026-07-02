import { useCallback, useEffect, useState } from 'react'
import { assignDriver, getDrivers, getVehicles, type DriverUser, type Vehicle } from '../lib/api'

export default function DriverAssignment() {
    const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
    const [drivers, setDrivers] = useState<DriverUser[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [selectedVehicle, setSelectedVehicle] = useState('')
    const [selectedDriver, setSelectedDriver] = useState('')
    const [assigning, setAssigning] = useState(false)
    const [unassigningId, setUnassigningId] = useState<string | null>(null)

    const refresh = useCallback(async () => {
        try {
            const [vehicleData, driverData] = await Promise.all([getVehicles(), getDrivers()])
            setVehicles(vehicleData)
            setDrivers(driverData)
            setError(null)
        } catch {
            setError('Could not load vehicles and drivers.')
        }
    }, [])

    useEffect(() => {
        // setTimeout(…, 0) defers this off the effect's synchronous call stack -
        // see the same pattern/reasoning in StatusFooter.tsx.
        const timeout = setTimeout(refresh, 0)
        return () => clearTimeout(timeout)
    }, [refresh])

    async function handleAssign() {
        if (!selectedVehicle || !selectedDriver) return
        setAssigning(true)
        setError(null)
        try {
            await assignDriver(selectedVehicle, selectedDriver)
            await refresh()
            setSelectedVehicle('')
            setSelectedDriver('')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not assign driver.')
        } finally {
            setAssigning(false)
        }
    }

    async function handleUnassign(vehicleId: string) {
        setUnassigningId(vehicleId)
        try {
            await assignDriver(vehicleId, null)
            await refresh()
        } catch {
            setError('Could not unassign that driver. Try again.')
        } finally {
            setUnassigningId(null)
        }
    }

    return (
        <div className="max-w-4xl">
            <h1 className="text-xl font-semibold text-ink">Driver Assignment</h1>
            <p className="text-sm text-ink/50 mt-1">
                Link a driver to a vehicle so trips can be started with the correct assignment.
            </p>

            {error && (
                <div className="text-sm text-alert bg-alert/10 border border-alert/20 rounded-lg px-3 py-2 mt-4">
                    {error}
                </div>
            )}

            {drivers && drivers.length === 0 ? (
                <p className="text-sm text-ink/50 bg-surface border border-line rounded-xl px-4 py-8 text-center mt-5">
                    No drivers registered yet.
                </p>
            ) : (
                <div className="bg-surface border border-line rounded-xl p-5 mt-5 flex items-end gap-3">
                    <div className="flex-1">
                        <label htmlFor="vehicle-select" className="block text-xs font-medium text-ink/60 mb-1">
                            Vehicle
                        </label>
                        <select
                            id="vehicle-select"
                            value={selectedVehicle}
                            onChange={(e) => setSelectedVehicle(e.target.value)}
                            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:border-brand"
                        >
                            <option value="">Select a vehicle…</option>
                            {(vehicles ?? []).map((v) => (
                                <option key={v.vehicle_id} value={v.vehicle_id}>
                                    {v.plate_number} ({v.vehicle_type})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label htmlFor="driver-select" className="block text-xs font-medium text-ink/60 mb-1">
                            Driver
                        </label>
                        <select
                            id="driver-select"
                            value={selectedDriver}
                            onChange={(e) => setSelectedDriver(e.target.value)}
                            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:border-brand"
                        >
                            <option value="">Select a driver…</option>
                            {(drivers ?? []).map((d) => (
                                <option key={d.user_id} value={d.user_id}>
                                    {d.first_name} {d.last_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedVehicle || !selectedDriver || assigning}
                        className="text-sm font-medium bg-brand text-white rounded-lg px-4 py-2 hover:bg-brand/90 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2"
                    >
                        {assigning ? 'Assigning…' : 'Assign driver'}
                    </button>
                </div>
            )}

            <div className="bg-surface border border-line rounded-xl overflow-hidden mt-5">
                {vehicles && vehicles.length === 0 ? (
                    <p className="text-sm text-ink/50 px-4 py-8 text-center">No vehicles yet.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-ink/40 border-b border-line">
                                <th className="font-medium px-4 py-2.5">Vehicle</th>
                                <th className="font-medium px-4 py-2.5">Type</th>
                                <th className="font-medium px-4 py-2.5">Assigned driver</th>
                                <th className="font-medium px-4 py-2.5"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {(vehicles ?? []).map((v) => (
                                <tr key={v.vehicle_id} className="border-b border-line last:border-0">
                                    <td className="px-4 py-3">{v.plate_number}</td>
                                    <td className="px-4 py-3 text-ink/60 capitalize">{v.vehicle_type}</td>
                                    <td className="px-4 py-3">
                                        {v.assigned_driver_id ? (
                                            `${v.driver_first_name} ${v.driver_last_name}`
                                        ) : (
                                            <span className="text-ink/40">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {v.assigned_driver_id && (
                                            <button
                                                onClick={() => handleUnassign(v.vehicle_id)}
                                                disabled={unassigningId === v.vehicle_id}
                                                className="text-sm font-medium text-ink/60 hover:text-alert disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 outline-none rounded px-1.5 py-1"
                                            >
                                                Unassign
                                            </button>
                                        )}
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
