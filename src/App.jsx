import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { RequireAuth, RequireCoach } from './components/ProtectedRoute'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import LoadingSpinner from './components/LoadingSpinner'

import Login from './pages/Login'
import Register from './pages/Register'

const Dashboard       = lazy(() => import('./pages/Dashboard'))
const StravaCallback  = lazy(() => import('./pages/StravaCallback'))
const MyPlan        = lazy(() => import('./pages/athlete/MyPlan'))
const MyRaces       = lazy(() => import('./pages/athlete/MyRaces'))
const MyResults     = lazy(() => import('./pages/athlete/MyResults'))
const MyProfile     = lazy(() => import('./pages/athlete/MyProfile'))
const CoachLayout   = lazy(() => import('./pages/coach/CoachLayout'))
const Athletes      = lazy(() => import('./pages/coach/Athletes'))
const GeneralPlan   = lazy(() => import('./pages/coach/GeneralPlan'))
const Races         = lazy(() => import('./pages/coach/Races'))
const ResultsOverview = lazy(() => import('./pages/coach/ResultsOverview'))
const CoachCalendar   = lazy(() => import('./pages/coach/CoachCalendar'))

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
            {/* Página inicial = login */}
            <Route path="/"        element={<Login />} />
            <Route path="/login"   element={<Login />} />
            <Route path="/registo" element={<Register />} />

            {/* Dashboard pós-login (atleta e coach) */}
            <Route path="/dashboard" element={
              <RequireAuth>
                <Suspense fallback={<LoadingSpinner />}>
                  <Dashboard />
                </Suspense>
              </RequireAuth>
            } />

            {/* Strava OAuth callback */}
            <Route path="/strava/callback" element={
              <RequireAuth>
                <Suspense fallback={<LoadingSpinner />}>
                  <StravaCallback />
                </Suspense>
              </RequireAuth>
            } />

            {/* Páginas do atleta */}
            <Route path="/plano"      element={<AthleteShell><MyPlan /></AthleteShell>} />
            <Route path="/corridas"   element={<AthleteShell><MyRaces /></AthleteShell>} />
            <Route path="/resultados" element={<AthleteShell><MyResults /></AthleteShell>} />
            <Route path="/perfil"     element={<AthleteShell><MyProfile /></AthleteShell>} />

            {/* Área do coach */}
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
              <Route path="calendario" element={<CoachCalendar />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
