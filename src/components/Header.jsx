import { Link, useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Header() {
  const { user, isCoach, athlete, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="bg-[#0f172a] text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-[#38bdf8] font-bold text-xl tracking-tight">Run</span>
          <span className="font-bold text-xl tracking-tight">Tejo</span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-xs text-slate-400 hidden sm:block">
                {isCoach ? 'Treinador' : athlete?.name || user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 text-sm text-slate-300 hover:text-white transition-colors"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1 text-sm text-[#38bdf8] hover:text-white transition-colors"
            >
              <User size={16} />
              <span>Entrar</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
