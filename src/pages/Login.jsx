import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
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

  const inputStyle = {
    width: '100%',
    padding: '16px 18px',
    fontSize: 16,
    fontWeight: 500,
    borderRadius: 14,
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    outline: 'none',
    boxSizing: 'border-box',
    WebkitAppearance: 'none',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--dark)', padding: '0 20px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: 420, width: '100%', margin: '0 auto' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 22, margin: '0 auto 16px',
            background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(184,255,0,0.25)',
          }}>
            <span style={{ fontSize: 36 }}>🏃</span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            RunTejo
          </h1>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
            CORRE · MELHORA · REPETE
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ width: '100%' }}
          autoComplete="on"
        >
          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, paddingLeft: 2 }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="o.teu@email.pt"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, paddingLeft: 2 }}>
              Palavra-passe
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="A tua palavra-passe"
                style={{ ...inputStyle, paddingRight: 52 }}
                onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                }}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, marginBottom: 16,
              background: 'rgba(255,69,58,0.10)', border: '1px solid rgba(255,69,58,0.2)', color: '#FF453A', fontSize: 14, fontWeight: 600,
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              width: '100%', padding: '17px', fontSize: 16, fontWeight: 800,
              borderRadius: 14, border: 'none', cursor: loading ? 'wait' : 'pointer',
              background: loading || !email || !password ? 'var(--surface)' : 'var(--orange)',
              color: loading || !email || !password ? 'var(--text-muted)' : '#080808',
              transition: 'background 0.2s, color 0.2s',
              letterSpacing: '-0.01em',
            }}
          >
            {loading ? 'A entrar…' : 'Entrar'}
          </button>
        </form>

        {/* Links */}
        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Ainda não tens conta?{' '}
            <Link to="/registo" style={{ color: 'var(--orange)', fontWeight: 800, textDecoration: 'none' }}>
              Criar conta
            </Link>
          </p>
        </div>

        {/* Dica browser */}
        <p style={{ marginTop: 32, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', opacity: 0.6 }}>
          O teu browser pode guardar a palavra-passe automaticamente
        </p>
      </div>
    </div>
  )
}
