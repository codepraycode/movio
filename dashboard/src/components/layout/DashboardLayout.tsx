import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface NavItem {
    label: string
    to?: string
}

// Only "Overview" is wired to a real page - the rest reflect backend features
// that already exist (tracking, trips, reports, complaints) but have no
// dashboard screen built yet. Shown as visibly disabled, not faked as working.
const NAV_ITEMS: NavItem[] = [
    { label: 'Overview', to: '/' },
    { label: 'Fleet Map' },
    { label: 'Routes' },
    { label: 'Ridership' },
    { label: 'Complaints' },
]

export function DashboardLayout() {
    const { logout } = useAuth()

    return (
        <div className="min-h-screen flex bg-slate-50">
            <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col">
                <div className="px-5 py-5 border-b border-slate-200">
                    <span className="text-lg font-bold text-brand">MovIO</span>
                    <p className="text-xs text-slate-400 mt-0.5">Admin Dashboard</p>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1">
                    {NAV_ITEMS.map((item) =>
                        item.to ? (
                            <NavLink
                                key={item.label}
                                to={item.to}
                                end
                                className={({ isActive }) =>
                                    `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-brand/10 text-brand'
                                            : 'text-slate-600 hover:bg-slate-100'
                                    }`
                                }
                            >
                                {item.label}
                            </NavLink>
                        ) : (
                            <div
                                key={item.label}
                                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-400"
                            >
                                <span>{item.label}</span>
                                <span className="text-[10px] uppercase tracking-wide bg-slate-100 text-slate-400 rounded px-1.5 py-0.5">
                                    Soon
                                </span>
                            </div>
                        )
                    )}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-slate-200 bg-white">
                    <span className="text-sm text-slate-500">FUTA Campus Transport</span>
                    <button
                        onClick={logout}
                        className="text-sm font-medium text-slate-600 hover:text-red-600 transition-colors"
                    >
                        Log out
                    </button>
                </header>

                <main className="flex-1 p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
