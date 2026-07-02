import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { DashboardLayout } from './components/layout/DashboardLayout'
import Login from './pages/Login'
import Overview from './pages/Overview'
import Complaints from './pages/Complaints'
import RidershipReport from './pages/RidershipReport'
import Sustainability from './pages/Sustainability'
import RoutesPage from './pages/Routes'
import TripMonitoring from './pages/TripMonitoring'
import DriverAssignment from './pages/DriverAssignment'
import Vehicles from './pages/Vehicles'

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                    <Route path="/" element={<Overview />} />
                    <Route path="/complaints" element={<Complaints />} />
                    <Route path="/reports/ridership" element={<RidershipReport />} />
                    <Route path="/sustainability" element={<Sustainability />} />
                    <Route path="/routes" element={<RoutesPage />} />
                    <Route path="/trips" element={<TripMonitoring />} />
                    <Route path="/driver-assignment" element={<DriverAssignment />} />
                    <Route path="/vehicles" element={<Vehicles />} />
                </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App
