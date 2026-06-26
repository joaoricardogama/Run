import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AlertCircle } from 'lucide-react'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) {
      setError('Email ou palavra-passe incorretos.')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--dark)' }}>
      {/* Top decoration */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-10 text-center">
          {/* HéH mark */}
          <div className="mx-auto mb-5 relative inline-flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--heh-green)', boxShadow: '0 0 40px rgba(184,255,0,0.3)' }}>
              <span className="font-black text-3xl tracking-tight" style={{ color: '#080808', letterSpacing: '-0.04em', lineHeight: 1 }}>HéH</span>
            </div>
            <span className="absolute -top-1 -right-1 text-xs" style={{ color: 'var(--heh-green)' }}>✦</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-1" style={{ color: 'var(--text)', letterSpacing: '-0.04em' }}>
            Hoje é Hoje
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)', letterSpacing: '0.2em' }}>
            CORRE · VIVE · REPETE
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="o.teu@email.pt"
              className="w-full rounded-xl px-4 py-3.5 text-sm font-medium outline-none transition-all"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--heh-green)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}>Palavra-passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-xl px-4 py-3.5 text-sm font-medium outline-none transition-all"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--heh-green)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3"
              style={{ background: 'rgba(255,69,58,0.12)', color: '#FF453A' }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl text-sm font-bold tracking-wide transition-all disabled:opacity-50 mt-2"
            style={{ background: 'var(--orange)', color: 'white' }}>
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Ainda não tens conta?{' '}
            <Link to="/registo" style={{ color: 'var(--orange)', fontWeight: 700 }}>Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
