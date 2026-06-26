import { NavLink, useLocation } from 'react-router-dom'
import { Home, Calendar, Trophy, User, ClipboardList } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function BottomNav() {
  const { user, isCoach } = useAuth()
  const location = useLocation()

  if (!user || isCoach) return null

  const links = [
    { to: '/dashboard',  icon: Home,          label: 'Início' },
    { to: '/plano',      icon: ClipboardList,  label: 'Plano' },
    { to: '/corridas',   icon: Calendar,       label: 'Corridas' },
    { to: '/resultados', icon: Trophy,         label: 'Resultados' },
    { to: '/perfil',     icon: User,           label: 'Perfil' },
  ]

  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', justifyContent: 'space-around', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {links.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to))
          return (
            <NavLink key={to} to={to}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 8px 6px', gap: 2, position: 'relative', minWidth: 52, color: active ? 'var(--heh-green)' : 'var(--text-muted)', textDecoration: 'none', flex: 1 }}>
              {active && (
                <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 24, height: 2, borderRadius: 4, background: 'var(--heh-green)' }} />
              )}
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
