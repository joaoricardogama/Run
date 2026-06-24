import { NavLink, useLocation } from 'react-router-dom'
import { Home, Calendar, Trophy, User, ClipboardList } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function BottomNav() {
  const { user, isCoach } = useAuth()
  const location = useLocation()

  if (!user) return null
  if (isCoach) return null // coach has sidebar

  const links = [
    { to: '/',          icon: Home,          label: 'Início' },
    { to: '/plano',     icon: ClipboardList,  label: 'Plano' },
    { to: '/corridas',  icon: Calendar,       label: 'Corridas' },
    { to: '/resultados',icon: Trophy,         label: 'Resultados' },
    { to: '/perfil',    icon: User,           label: 'Perfil' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 safe-area-bottom">
      <div className="max-w-2xl mx-auto flex justify-around">
        {links.map(({ to, icon: Icon, label }) => {
          const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-col items-center py-2 px-3 text-xs transition-colors ${
                active ? 'text-[#38bdf8]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="mt-0.5">{label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
