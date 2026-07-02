import { SystemStatusCard } from '../components/SystemStatusCard'

export default function Overview() {
    return (
        <div className="max-w-5xl">
            <h1 className="text-xl font-semibold text-slate-900">Overview</h1>
            <p className="text-sm text-slate-500 mt-1">
                A snapshot of MovIO&apos;s backend health.
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <SystemStatusCard />
            </div>
        </div>
    )
}
