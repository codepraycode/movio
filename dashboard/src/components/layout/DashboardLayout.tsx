import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
    AlertCircle,
    BarChart3,
    Bus,
    Leaf,
    LogOut,
    Map,
    Radio,
    Route as RouteIcon,
    Users,
    type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { StatusFooter } from './StatusFooter'

interface NavItem {
    label: string
    icon: LucideIcon
    to?: string
}

// Fleet Map, Complaints, Ridership, Sustainability, Routes, Trip Monitoring and
// Driver Assignment are real, backend-integrated screens (PSD-150/FE-7,
// PSD-99/FE-8, PSD-151/FE-11 added Routes/Trip Monitoring/Driver Assignment).
// Vehicles stays disabled - FE-6 (vehicle create/deactivate CRUD) hasn't been
// built; vehicles are only listable (read-only) as supporting data for Driver
// Assignment. See docs/admin_design_brief.md for the design reasoning.
const NAV_ITEMS: NavItem[] = [
    { label: 'Fleet Map', to: '/', icon: Map },
    { label: 'Complaints', to: '/complaints', icon: AlertCircle },
    { label: 'Ridership', to: '/reports/ridership', icon: BarChart3 },
    { label: 'Sustainability', to: '/sustainability', icon: Leaf },
    { label: 'Vehicles', icon: Bus },
    { label: 'Routes', to: '/routes', icon: RouteIcon },
    { label: 'Trip Monitoring', to: '/trips', icon: Radio },
    { label: 'Driver Assignment', to: '/driver-assignment', icon: Users },
]

export function DashboardLayout() {
    const { logout, user } = useAuth()
    const location = useLocation()
    const activeItem = NAV_ITEMS.find((item) => item.to === location.pathname)

    return (
        <div className="min-h-screen flex flex-col bg-paper">
            <div className="flex flex-1 min-h-0">
                <aside className="w-60 shrink-0 bg-surface border-r border-line flex flex-col">
                    <div className="px-5 py-5 border-b border-line flex items-center gap-2">
                        <img src="/movio-icon.png" alt="" className="h-7 w-7 rounded-md" />
                        <div>
                            <span className="text-base font-bold text-ink">MovIO</span>
                            <p className="text-xs text-ink/50">Admin Dashboard</p>
                        </div>
                    </div>

                    <nav className="flex-1 px-3 py-4 space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon
                            return item.to ? (
                                <NavLink
                                    key={item.label}
                                    to={item.to}
                                    end
                                    className={({ isActive }) =>
                                        `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 outline-none ${
                                            isActive
                                                ? 'bg-brand/10 text-brand'
                                                : 'text-ink/70 hover:bg-paper hover:text-ink'
                                        }`
                                    }
                                >
                                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                                    <span>{item.label}</span>
                                </NavLink>
                            ) : (
                                <div
                                    key={item.label}
                                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-ink/35"
                                >
                                    <span className="flex items-center gap-2.5">
                                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                                        {item.label}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-wide bg-paper text-ink/40 rounded px-1.5 py-0.5">
                                        Soon
                                    </span>
                                </div>
                            )
                        })}
                    </nav>
                </aside>

                <div className="flex-1 flex flex-col min-w-0">
                    <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-line bg-surface">
                        <span className="text-sm font-semibold text-ink">
                            {activeItem?.label ?? 'MovIO'}
                        </span>
                        <div className="flex items-center gap-4">
                            {user && (
                                <span className="text-sm text-ink/60">
                                    {user.first_name} {user.last_name}
                                </span>
                            )}
                            <button
                                onClick={logout}
                                className="flex items-center gap-1.5 text-sm font-medium text-ink/70 hover:text-alert transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 outline-none rounded px-1.5 py-1"
                            >
                                <LogOut className="h-4 w-4" aria-hidden="true" />
                                Log out
                            </button>
                        </div>
                    </header>

                    <main className="flex-1 p-6 overflow-y-auto">
                        <Outlet />
                    </main>
                </div>
            </div>

            <StatusFooter />
        </div>
    )
}
