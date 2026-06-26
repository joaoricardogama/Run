import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Users, CalendarDays, BarChart3, ClipboardList, LogOut, LayoutGrid, Menu, X, Activity } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const NAV = [
  { to: '/coach/atletas',    icon: Users,         label: 'Atletas'    },
  { to: '/coach/treinos',    icon: Activity,      label: 'Treinos'    },
  { to: '/coach/calendario', icon: LayoutGrid,    label: 'Calendário' },
  { to: '/coach/plano',      icon: ClipboardList, label: 'Plano Geral' },
  { to: '/coach/corridas',   icon: CalendarDays,  label: 'Corridas'   },
  { to: '/coach/resultados', icon: BarChart3,     label: 'Resultados' },
]

export default function CoachLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div style={{ background: 'var(--dark)', minHeight: '100dvh' }}>
      <style>{`
        .coach-shell { display: flex; height: 100dvh; }
        .coach-sidebar-panel { width: 224px; flex-shrink: 0; display: flex; flex-direction: column; background: var(--surface); border-right: 1px solid var(--border); }
        .coach-mobile-header { display: none; }
        .coach-content { flex: 1; overflow-y: auto; background: var(--dark); }

        @media (max-width: 768px) {
          .coach-shell { flex-direction: column; height: auto; min-height: 100dvh; }
          .coach-sidebar-panel { display: none; }
          .coach-mobile-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 50; }
          .coach-content { overflow-y: unset; }
          .coach-mobile-drawer { position: fixed; inset: 0; z-index: 100; }
          .coach-mobile-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); }
          .coach-mobile-menu { position: absolute; top: 0; left: 0; bottom: 0; width: 260px; background: var(--surface); display: flex; flex-direction: column; padding: 24px 0; }
        }
      `}</style>

      {/* Mobile top bar */}
      <div className="coach-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.03em' }}>
            H<span style={{ color: 'var(--heh-green)' }}>é</span>H
          </span>
          <span style={{ color: 'var(--heh-green)', fontSize: 8 }}>✦</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6, fontWeight: 600 }}>Coach</span>
        </div>
        <button onClick={() => setMobileOpen(true)}
          style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Menu size={18} style={{ color: 'var(--text)' }} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="coach-mobile-drawer">
          <div className="coach-mobile-overlay" onClick={() => setMobileOpen(false)} />
          <div className="coach-mobile-menu">
            <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 900, fontSize: 16, color: 'var(--text)' }}>
                  H<span style={{ color: 'var(--heh-green)' }}>é</span>H<span style={{ color: 'var(--heh-green)', fontSize: 8 }}>✦</span>
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Área do Treinador</p>
              </div>
              <button onClick={() => setMobileOpen(false)}
                style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            <nav style={{ flex: 1, padding: '12px' }}>
              {NAV.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12,
                    marginBottom: 4, textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 700 : 500,
                    background: isActive ? 'rgba(184,255,0,0.10)' : 'transparent',
                    color: isActive ? 'var(--heh-green)' : 'var(--text-muted)',
                  })}>
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
              <button onClick={handleSignOut}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', width: '100%', borderRadius: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>
                <LogOut size={18} />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="coach-shell">
        {/* Desktop sidebar */}
        <aside className="coach-sidebar-panel">
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontWeight: 900, fontSize: 16 }}>
              H<span style={{ color: 'var(--heh-green)' }}>é</span>H<span style={{ color: 'var(--heh-green)', fontSize: 8 }}>✦</span>
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Área do Treinador</p>
          </div>
          <nav style={{ flex: 1, padding: '12px' }}>
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                  marginBottom: 2, textDecoration: 'none', fontSize: 13, fontWeight: isActive ? 700 : 500,
                  background: isActive ? 'rgba(184,255,0,0.10)' : 'transparent',
                  color: isActive ? 'var(--heh-green)' : 'var(--text-muted)',
                })}>
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
            <button onClick={handleSignOut}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', width: '100%', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}>
              <LogOut size={17} />
              Sair
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="coach-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
