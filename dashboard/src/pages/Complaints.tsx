import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock, type LucideIcon } from 'lucide-react'
import {
    getComplaints,
    updateComplaintStatus,
    type Complaint,
    type ComplaintStatus,
} from '../lib/api'
import { timeAgo } from '../lib/format'

const FILTERS: { label: string; value: ComplaintStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Open', value: 'open' },
    { label: 'Under review', value: 'under_review' },
    { label: 'Resolved', value: 'resolved' },
]

const STATUS_OPTIONS: ComplaintStatus[] = ['open', 'under_review', 'resolved']

// alert-red / signal-amber only - sustain-green is reserved exclusively for
// the Sustainability panel (docs/admin_design_brief.md), so "resolved" uses a
// neutral done-state gray rather than the brief's literal "muted green"
// suggestion, to avoid diluting that panel's visual distinctiveness.
const STATUS_META: Record<ComplaintStatus, { label: string; className: string; icon: LucideIcon }> =
    {
        open: { label: 'Open', className: 'text-alert bg-alert/10', icon: AlertCircle },
        under_review: { label: 'Under review', className: 'text-signal bg-signal/10', icon: Clock },
        resolved: { label: 'Resolved', className: 'text-ink/50 bg-ink/5', icon: CheckCircle2 },
    }

export default function Complaints() {
    const [filter, setFilter] = useState<ComplaintStatus | 'all'>('all')
    const [complaints, setComplaints] = useState<Complaint[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    const refresh = useCallback(async (status: ComplaintStatus | 'all') => {
        try {
            const data = await getComplaints(status === 'all' ? undefined : status)
            setComplaints(data)
            setError(null)
        } catch {
            setError('Could not load complaints.')
        }
    }, [])

    useEffect(() => {
        // setTimeout(…, 0) defers this off the effect's synchronous call stack -
        // see the same pattern/reasoning in StatusFooter.tsx.
        const timeout = setTimeout(() => {
            setComplaints(null)
            refresh(filter)
        }, 0)
        return () => clearTimeout(timeout)
    }, [filter, refresh])

    async function handleStatusChange(complaintId: string, status: ComplaintStatus) {
        setUpdatingId(complaintId)
        try {
            await updateComplaintStatus(complaintId, status)
            await refresh(filter)
        } catch {
            setError('Could not update that complaint. Try again.')
        } finally {
            setUpdatingId(null)
        }
    }

    return (
        <div className="max-w-5xl">
            <h1 className="text-xl font-semibold text-ink">Complaints</h1>
            <p className="text-sm text-ink/50 mt-1">
                Student-submitted complaints across all trips.
            </p>

            <div className="flex gap-1 mt-5 mb-4">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`text-sm font-medium rounded-lg px-3 py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 outline-none ${
                            filter === f.value
                                ? 'bg-brand/10 text-brand'
                                : 'text-ink/60 hover:bg-surface hover:text-ink'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="text-sm text-alert bg-alert/10 border border-alert/20 rounded-lg px-3 py-2 mb-4">
                    {error}
                </div>
            )}

            <div className="bg-surface border border-line rounded-xl overflow-hidden">
                {complaints && complaints.length === 0 ? (
                    <p className="text-sm text-ink/50 px-4 py-8 text-center">No open complaints.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-ink/40 border-b border-line">
                                <th className="font-medium px-4 py-2.5">Student</th>
                                <th className="font-medium px-4 py-2.5">Description</th>
                                <th className="font-medium px-4 py-2.5">Trip</th>
                                <th className="font-medium px-4 py-2.5">Submitted</th>
                                <th className="font-medium px-4 py-2.5">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(complaints ?? []).map((c) => {
                                const meta = STATUS_META[c.status]
                                const Icon = meta.icon
                                return (
                                    <tr
                                        key={c.complaint_id}
                                        className="border-b border-line last:border-0"
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {c.first_name} {c.last_name}
                                        </td>
                                        <td className="px-4 py-3 max-w-xs">{c.description}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-ink/50">
                                            {c.trip_id ? c.trip_id.slice(0, 8) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-ink/50 whitespace-nowrap">
                                            {timeAgo(c.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}
                                            >
                                                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                                {meta.label}
                                            </div>
                                            <select
                                                value={c.status}
                                                disabled={updatingId === c.complaint_id}
                                                onChange={(e) =>
                                                    handleStatusChange(
                                                        c.complaint_id,
                                                        e.target.value as ComplaintStatus
                                                    )
                                                }
                                                className="ml-2 text-xs border border-line rounded px-1.5 py-1 bg-surface disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/40 outline-none"
                                            >
                                                {STATUS_OPTIONS.map((s) => (
                                                    <option key={s} value={s}>
                                                        {STATUS_META[s].label}
                                                    </option>
                                                ))}
                                            </select>
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
