import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { RequireAuth, RequireCoach } from './components/ProtectedRoute'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import LoadingSpinner from './components/LoadingSpinner'

import Home from './pages/Home'
import Login from './pages/Login'

const MyPlan        = lazy(() => import('./pages/athlete/MyPlan'))
const MyRaces       = lazy(() => import('./pages/athlete/MyRaces'))
const MyResults     = lazy(() => import('./pages/athlete/MyResults'))
const MyProfile     = lazy(() => import('./pages/athlete/MyProfile'))
const CoachLayout   = lazy(() => import('./pages/coach/CoachLayout'))
const Athletes      = lazy(() => import('./pages/coach/Athletes'))
const GeneralPlan   = lazy(() => import('./pages/coach/GeneralPlan'))
const Races         = lazy(() => import('./pages/coach/Races'))
const ResultsOverview = lazy(() => import('./pages/coach/ResultsOverview'))

function PublicShell({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <BottomNav />
    </div>
  )
}

function AthleteShell({ children }) {
  return (
    <RequireAuth>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
        </main>
        <BottomNav />
      </div>
    </RequireAuth>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<PublicShell><Home /></PublicShell>} />

            <Route path="/plano"      element={<AthleteShell><MyPlan /></AthleteShell>} />
            <Route path="/corridas"   element={<AthleteShell><MyRaces /></AthleteShell>} />
            <Route path="/resultados" element={<AthleteShell><MyResults /></AthleteShell>} />
            <Route path="/perfil"     element={<AthleteShell><MyProfile /></AthleteShell>} />

            <Route path="/coach" element={
              <RequireCoach>
                <Suspense fallback={<LoadingSpinner />}>
                  <CoachLayout />
                </Suspense>
              </RequireCoach>
            }>
              <Route index element={<Navigate to="/coach/atletas" replace />} />
              <Route path="atletas"    element={<Athletes />} />
              <Route path="plano"      element={<GeneralPlan />} />
              <Route path="corridas"   element={<Races />} />
              <Route path="resultados" element={<ResultsOverview />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
