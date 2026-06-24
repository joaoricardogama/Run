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
          <div style={{ background: 'var(--orange)' }} className="w-7 h-7 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/>
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text)' }}>
            Run<span style={{ color: 'var(--orange)' }}>Tejo</span>
          </span>
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
