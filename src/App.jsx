import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Log from './pages/Log'
import History from './pages/History'
import MiraImport from './pages/MiraImport'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  console.log('Auth state:', { user, profile, loading })

  if (loading) return (
    <div className="min-h-dvh bg-cream-100 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"
           className="w-16 h-16 animate-pulse" aria-hidden="true">
        <circle cx="32" cy="32" r="30" fill="#5a8a58"/>
        <text x="32" y="43" textAnchor="middle" fontSize="28"
              fontFamily="Georgia,serif" fill="white">C</text>
      </svg>
    </div>
  )

  if (!user) return <Login />

  if (!profile?.onboarding_complete) return <Onboarding />

  return (
    <div className="min-h-dvh bg-cream-100">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/log" element={<Log />} />
        <Route path="/history" element={<History />} />
        <Route path="/mira-import" element={<MiraImport />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
