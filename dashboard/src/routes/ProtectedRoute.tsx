import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Only admins should ever reach this dashboard - a valid but non-admin JWT
// (student/driver/transport_personnel) is treated the same as no JWT.
// This check happens synchronously during render, so a protected page's own
// data-fetching effects never get a chance to fire before the redirect -
// see docs/MovIO_Manual_Test_Plan.md DASH-07 ("no data leaks in network tab").
export function ProtectedRoute() {
    const { isAuthenticated, role } = useAuth()

    if (!isAuthenticated || role !== 'admin') {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}
