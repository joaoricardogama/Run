import { NavLink, useLocation } from 'react-router-dom'
import { Home, Calendar, Trophy, User, ClipboardList } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function BottomNav() {
  const { user, isCoach } = useAuth()
  const location = useLocation()

  if (!user || isCoach) return null

  const links = [
    { to: '/',           icon: Home,          label: 'Início' },
    { to: '/plano',      icon: ClipboardList,  label: 'Plano' },
    { to: '/corridas',   icon: Calendar,       label: 'Corridas' },
    { to: '/resultados', icon: Trophy,         label: 'Resultados' },
    { to: '/perfil',     icon: User,           label: 'Perfil' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe"
      style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-2xl mx-auto flex justify-around">
        {links.map(({ to, icon: Icon, label }) => {
          const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
          return (
            <NavLink key={to} to={to}
              className="flex flex-col items-center py-2.5 px-3 gap-0.5 relative"
              style={{ color: active ? 'var(--orange)' : 'var(--text-muted)', minWidth: 56 }}>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ background: 'var(--orange)' }} />
              )}
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-xs font-medium">{label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
