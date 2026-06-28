import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const inputStyle = {
    width: '100%', padding: '16px 18px', fontSize: 16, fontWeight: 500,
    borderRadius: 14, border: '1.5px solid var(--border)', background: 'var(--surface)',
    color: 'var(--text)', outline: 'none', boxSizing: 'border-box', WebkitAppearance: 'none',
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError('As palavras-passe não coincidem.'); return }
    if (password.length < 6) { setError('A palavra-passe deve ter pelo menos 6 caracteres.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) setError(err.message)
    else setDone(true)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--dark)', padding: '0 20px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>🔐</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', marginBottom: 6 }}>Nova palavra-passe</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Escolhe uma nova palavra-passe para a tua conta.</p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(52,199,89,0.12)', border: '1px solid rgba(52,199,89,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={28} color="#34C759" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Palavra-passe atualizada!</p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Já podes entrar com a nova palavra-passe.</p>
            <button onClick={() => navigate('/login')} style={{
              width: '100%', padding: '16px', fontSize: 15, fontWeight: 800, borderRadius: 14, border: 'none',
              background: 'var(--orange)', color: '#080808', cursor: 'pointer',
            }}>
              Ir para o login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Nova palavra-passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete="new-password" placeholder="Mínimo 6 caracteres"
                  style={{ ...inputStyle, paddingRight: 52 }}
                  onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Confirmar palavra-passe</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirm} onChange={e => setConfirm(e.target.value)}
                required autoComplete="new-password" placeholder="Repetir palavra-passe"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, marginBottom: 16, background: 'rgba(255,69,58,0.10)', color: '#FF453A', fontSize: 14, fontWeight: 600 }}>
                <AlertCircle size={16} />{error}
              </div>
            )}
            <button type="submit" disabled={loading || !password || !confirm} style={{
              width: '100%', padding: '16px', fontSize: 15, fontWeight: 800, borderRadius: 14, border: 'none',
              background: loading || !password || !confirm ? 'var(--surface)' : 'var(--orange)',
              color: loading || !password || !confirm ? 'var(--text-muted)' : '#080808',
              cursor: loading ? 'wait' : 'pointer',
            }}>
              {loading ? 'A guardar…' : 'Guardar nova palavra-passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
