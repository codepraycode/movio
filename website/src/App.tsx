import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Landing } from '@/pages/Landing'
import { Survey } from '@/pages/Survey'
import { Admin } from '@/pages/Admin'
import { LiveMap } from '@/pages/LiveMap'
import { Privacy } from '@/pages/Privacy'
import { Terms } from '@/pages/Terms'
import { NotFound } from '@/pages/NotFound'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/ui/toast'

export default function App() {
    return (
        <ErrorBoundary>
            <ToastProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/live" element={<LiveMap />} />
                        <Route path="/survey" element={<Survey />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </BrowserRouter>
            </ToastProvider>
        </ErrorBoundary>
    )
}
