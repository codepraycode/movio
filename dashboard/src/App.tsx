import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { DashboardLayout } from './components/layout/DashboardLayout'
import Login from './pages/Login'
import Overview from './pages/Overview'

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                    <Route path="/" element={<Overview />} />
                </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App
