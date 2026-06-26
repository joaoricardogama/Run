import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Users, CalendarDays, BarChart3, ClipboardList, LogOut, LayoutGrid } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const NAV = [
  { to: '/coach/atletas',    icon: Users,         label: 'Atletas'    },
  { to: '/coach/calendario', icon: LayoutGrid,    label: 'Calendário' },
  { to: '/coach/plano',      icon: ClipboardList, label: 'Plano Geral' },
  { to: '/coach/corridas',   icon: CalendarDays,  label: 'Corridas'   },
  { to: '/coach/resultados', icon: BarChart3,     label: 'Resultados' },
]

export default function CoachLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--dark)' }}>
      {/* Sidebar */}
      <aside className="w-56 flex flex-col flex-shrink-0"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
        <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="font-black text-lg tracking-tight">
            <span style={{ color: 'var(--orange)' }}>Run</span>
            <span style={{ color: 'var(--text)' }}>Tejo</span>
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>&#193;rea do Treinador</p>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-3">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'active' : ''}`
              }
              style={({ isActive }) => ({
                background: isActive ? 'rgba(184,255,0,0.10)' : 'transparent',
                color: isActive ? 'var(--orange)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
              })}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--dark)' }}>
        <Outlet />
      </main>
    </div>
  )
}
