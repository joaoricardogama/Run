import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, AlertCircle, CheckCircle, Mail, Lock } from 'lucide-react'

export default function Login() {
  const { signIn, user, loading: authLoading } = useAuth()
  const navigate   = useNavigate()

  // Se já está autenticado, vai directo para o dashboard
  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard', { replace: true })
  }, [user, authLoading])

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  // Recuperar palavra-passe
  const [forgotMode,    setForgotMode]    = useState(false)
  const [resetEmail,    setResetEmail]    = useState('')
  const [resetSent,     setResetSent]     = useState(false)
  const [resetLoading,  setResetLoading]  = useState(false)

  async function handleReset(e) {
    e.preventDefault()
    setResetLoading(true)
    await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetSent(true)
    setResetLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) {
      setError('Email ou palavra-passe incorretos.')
    } else {
      if (!remember) {
        // Sinalizar sessão temporária
        sessionStorage.setItem('runtejo_temp_session', '1')
      }
      navigate('/dashboard')
    }
  }

  // ── Estilos reutilizáveis ──────────────────────────────────
  const fieldWrap = {
    position: 'relative',
    background: 'rgba(255,255,255,0.05)',
    border: '1.5px solid rgba(255,255,255,0.12)',
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    transition: 'border-color 0.15s, background 0.15s',
  }

  const inputBase = {
    flex: 1,
    padding: '18px 16px',
    fontSize: 16,
    fontWeight: 500,
    background: 'transparent',
    color: 'var(--text)',
    border: 'none',
    outline: 'none',
    WebkitAppearance: 'none',
    boxSizing: 'border-box',
  }

  const iconWrap = {
    paddingLeft: 16,
    color: 'rgba(255,255,255,0.3)',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  }

  function focusField(e) {
    e.target.closest('[data-field]').style.borderColor = '#B8FF00'
    e.target.closest('[data-field]').style.background  = 'rgba(184,255,0,0.04)'
  }
  function blurField(e) {
    e.target.closest('[data-field]').style.borderColor = 'rgba(255,255,255,0.12)'
    e.target.closest('[data-field]').style.background  = 'rgba(255,255,255,0.05)'
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--dark)',
      padding: '0 24px',
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 400,
        width: '100%',
        margin: '0 auto',
      }}>

        {/* ── Logo ── */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{
            width: 76, height: 76, borderRadius: 22, margin: '0 auto 18px',
            background: 'linear-gradient(135deg, #B8FF00 0%, #7ACC00 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(184,255,0,0.3)',
          }}>
            <span style={{ fontSize: 34 }}>🏃</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.04em', marginBottom: 6 }}>
            RunTejo
          </h1>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            CORRE · MELHORA · REPETE
          </p>
        </div>

        {/* ── Recuperar palavra-passe ── */}
        {forgotMode ? (
          <div style={{ width: '100%' }}>
            {resetSent ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(52,199,89,0.12)', border: '1px solid rgba(52,199,89,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                }}>
                  <CheckCircle size={28} color="#34C759" />
                </div>
                <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>Email enviado!</p>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 28, lineHeight: 1.6 }}>
                  Verifica a caixa de entrada de{' '}
                  <strong style={{ color: 'var(--text)' }}>{resetEmail}</strong>{' '}
                  e clica no link para redefinir a palavra-passe.
                </p>
                <button onClick={() => { setForgotMode(false); setResetSent(false) }}
                  style={{ fontSize: 14, fontWeight: 700, color: '#B8FF00', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ← Voltar ao login
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset}>
                <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>Recuperar palavra-passe</p>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 28, lineHeight: 1.6 }}>
                  Introduz o teu email e enviamos um link para redefinires a palavra-passe.
                </p>
                <div data-field style={{ ...fieldWrap, marginBottom: 20 }}>
                  <span style={iconWrap}><Mail size={18} /></span>
                  <input
                    type="email" name="email" value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required autoComplete="email" placeholder="o.teu@email.pt"
                    style={inputBase}
                    onFocus={focusField} onBlur={blurField}
                  />
                </div>
                <button type="submit" disabled={resetLoading || !resetEmail} style={{
                  width: '100%', padding: '17px', fontSize: 16, fontWeight: 800,
                  borderRadius: 14, border: 'none', cursor: resetLoading ? 'wait' : 'pointer',
                  background: resetLoading || !resetEmail ? 'rgba(255,255,255,0.08)' : '#B8FF00',
                  color: resetLoading || !resetEmail ? 'rgba(255,255,255,0.3)' : '#080808',
                  marginBottom: 14, transition: 'background 0.2s',
                }}>
                  {resetLoading ? 'A enviar…' : 'Enviar link de recuperação'}
                </button>
                <button type="button" onClick={() => setForgotMode(false)}
                  style={{ width: '100%', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ← Voltar ao login
                </button>
              </form>
            )}
          </div>

        ) : (

          /* ── Form principal ── */
          <form onSubmit={handleSubmit} style={{ width: '100%' }} autoComplete="on">

            {/* Email */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8, paddingLeft: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Email
              </label>
              <div data-field style={fieldWrap}>
                <span style={iconWrap}><Mail size={18} /></span>
                <input
                  type="email" name="email" id="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  required autoComplete="email" placeholder="o.teu@email.pt"
                  style={inputBase}
                  onFocus={focusField} onBlur={blurField}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8, paddingLeft: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Palavra-passe
              </label>
              <div data-field style={fieldWrap}>
                <span style={iconWrap}><Lock size={18} /></span>
                {/* Campo real — type="password" SEMPRE para o browser guardar credenciais */}
                <input
                  type="password"
                  name="password" id="password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete="current-password" placeholder="A tua palavra-passe"
                  style={{ ...inputBase, paddingRight: 52, opacity: showPass ? 0 : 1, position: showPass ? 'absolute' : 'relative', pointerEvents: showPass ? 'none' : 'auto' }}
                  onFocus={focusField} onBlur={blurField}
                />
                {/* Campo de visualização — type="text", apenas visual */}
                {showPass && (
                  <input
                    type="text"
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="A tua palavra-passe"
                    style={{ ...inputBase, paddingRight: 52 }}
                    onFocus={focusField} onBlur={blurField}
                    autoComplete="off"
                  />
                )}
                <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                  style={{ position: 'absolute', right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', padding: 4 }}>
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Lembrar-me + Esqueceste */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, marginTop: 4 }}>
              {/* Checkbox lembrar */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div
                  onClick={() => setRemember(v => !v)}
                  style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${remember ? '#B8FF00' : 'rgba(255,255,255,0.2)'}`,
                    background: remember ? '#B8FF00' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s', cursor: 'pointer',
                  }}
                >
                  {remember && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4L4 7L10 1" stroke="#080808" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', userSelect: 'none' }}>
                  Lembrar-me
                </span>
              </label>

              {/* Esqueceste */}
              <button type="button" onClick={() => { setForgotMode(true); setResetEmail(email) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
                Esqueceste a palavra-passe?
              </button>
            </div>

            {/* Erro */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '13px 16px', borderRadius: 12, marginBottom: 16,
                background: 'rgba(255,69,58,0.10)', border: '1px solid rgba(255,69,58,0.2)',
                color: '#FF453A', fontSize: 14, fontWeight: 600,
              }}>
                <AlertCircle size={16} strokeWidth={2.5} />
                {error}
              </div>
            )}

            {/* Botão entrar */}
            <button type="submit" disabled={loading || !email || !password} style={{
              width: '100%', padding: '18px', fontSize: 16, fontWeight: 900,
              borderRadius: 16, border: 'none', cursor: loading ? 'wait' : 'pointer',
              background: loading || !email || !password
                ? 'rgba(255,255,255,0.08)'
                : 'linear-gradient(135deg, #B8FF00 0%, #7ACC00 100%)',
              color: loading || !email || !password ? 'rgba(255,255,255,0.3)' : '#080808',
              transition: 'all 0.2s',
              letterSpacing: '-0.01em',
              boxShadow: !loading && email && password ? '0 4px 24px rgba(184,255,0,0.3)' : 'none',
            }}>
              {loading ? 'A entrar…' : 'Entrar'}
            </button>
          </form>
        )}

        {/* ── Rodapé ── */}
        {!forgotMode && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
              Ainda não tens conta?{' '}
              <Link to="/registo" style={{ color: '#B8FF00', fontWeight: 800, textDecoration: 'none' }}>
                Criar conta
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
