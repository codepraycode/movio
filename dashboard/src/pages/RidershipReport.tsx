import { useCallback, useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getRidershipReport, type RidershipGroupBy, type RidershipRow } from '../lib/api'

const GROUP_OPTIONS: { label: string; value: RidershipGroupBy }[] = [
    { label: 'By route', value: 'route' },
    { label: 'By vehicle', value: 'vehicle' },
    { label: 'By day', value: 'day' },
]

function labelOf(row: RidershipRow, groupBy: RidershipGroupBy): string {
    if (groupBy === 'route') return row.route_name ?? 'Unknown route'
    if (groupBy === 'vehicle') return row.plate_number ?? 'Unknown vehicle'
    return row.day ?? 'Unknown day'
}

export default function RidershipReport() {
    const [groupBy, setGroupBy] = useState<RidershipGroupBy>('route')
    const [rows, setRows] = useState<RidershipRow[] | null>(null)
    const [error, setError] = useState<string | null>(null)

    const refresh = useCallback(async (by: RidershipGroupBy) => {
        try {
            const data = await getRidershipReport(by)
            setRows(data)
            setError(null)
        } catch {
            setError('Could not load the ridership report.')
        }
    }, [])

    useEffect(() => {
        // setTimeout(…, 0) defers this off the effect's synchronous call stack -
        // see the same pattern/reasoning in StatusFooter.tsx.
        const timeout = setTimeout(() => {
            setRows(null)
            refresh(groupBy)
        }, 0)
        return () => clearTimeout(timeout)
    }, [groupBy, refresh])

    const chartData = (rows ?? []).map((row) => ({
        name: labelOf(row, groupBy),
        boardings: row.boarding_count,
    }))

    return (
        <div className="max-w-5xl">
            <h1 className="text-xl font-semibold text-ink">Ridership</h1>
            <p className="text-sm text-ink/50 mt-1">Boarding counts across the system.</p>

            <div className="flex gap-1 mt-5 mb-4">
                {GROUP_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setGroupBy(opt.value)}
                        className={`text-sm font-medium rounded-lg px-3 py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 outline-none ${
                            groupBy === opt.value
                                ? 'bg-brand/10 text-brand'
                                : 'text-ink/60 hover:bg-surface hover:text-ink'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="text-sm text-alert bg-alert/10 border border-alert/20 rounded-lg px-3 py-2 mb-4">
                    {error}
                </div>
            )}

            <div className="bg-surface border border-line rounded-xl overflow-hidden mb-4">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-ink/40 border-b border-line">
                            <th className="font-medium px-4 py-2.5">
                                {GROUP_OPTIONS.find((o) => o.value === groupBy)?.label}
                            </th>
                            <th className="font-medium px-4 py-2.5">Boardings</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(rows ?? []).map((row) => (
                            <tr
                                key={labelOf(row, groupBy)}
                                className="border-b border-line last:border-0"
                            >
                                <td className="px-4 py-2.5">{labelOf(row, groupBy)}</td>
                                <td className="px-4 py-2.5 font-mono">{row.boarding_count}</td>
                            </tr>
                        ))}
                        {rows && rows.length === 0 && (
                            <tr>
                                <td colSpan={2} className="px-4 py-8 text-center text-ink/50">
                                    No boarding data yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {rows && rows.length > 0 && (
                <div className="bg-surface border border-line rounded-xl p-4 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#E4E4E1"
                                vertical={false}
                            />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#101828' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#101828' }} allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="boardings" fill="#1E4FD6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}
