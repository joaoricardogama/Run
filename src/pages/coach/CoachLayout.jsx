import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Users, CalendarDays, BarChart3, ClipboardList, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const NAV = [
  { to: '/coach/atletas',  icon: Users,         label: 'Atletas' },
  { to: '/coach/plano',    icon: ClipboardList,  label: 'Plano Geral' },
  { to: '/coach/corridas', icon: CalendarDays,   label: 'Corridas' },
  { to: '/coach/resultados',icon: BarChart3,     label: 'Resultados' },
]

export default function CoachLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 bg-[#0f172a] text-white flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800">
          <p className="font-bold text-lg">
            <span className="text-[#38bdf8]">Run</span>Tejo
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Área do Treinador</p>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-3">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[#38bdf8]/20 text-[#38bdf8] font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
