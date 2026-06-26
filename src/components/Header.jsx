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
    <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      className="sticky top-0 z-40">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-xl tracking-tight" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>
              H<span style={{ color: 'var(--heh-green)' }}>é</span>H
            </span>
            <span style={{ color: 'var(--heh-green)', fontSize: 10 }}>✦</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                  {isCoach ? 'Treinador' : athlete?.name?.split(' ')[0] || ''}
                </p>
                {athlete?.group && (
                  <p className="text-xs" style={{ color: 'var(--orange)' }}>{athlete.group}</p>
                )}
              </div>
              <button onClick={handleSignOut}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'var(--surface2)' }}>
                <LogOut size={15} style={{ color: 'var(--text-muted)' }} />
              </button>
            </>
          ) : (
            <Link to="/login"
              className="text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
              style={{ background: 'var(--orange)', color: 'white' }}>
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
