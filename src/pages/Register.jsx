import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { parseTime } from '../utils/pace'
import { assignGroup } from '../utils/groupAssignment'
import { AlertCircle, ChevronLeft, Check } from 'lucide-react'

const STRAVA_REGISTER_URL = `https://www.strava.com/oauth/authorize?client_id=261127&redirect_uri=${encodeURIComponent('https://run-blush.vercel.app/strava/register-callback')}&response_type=code&scope=read,activity:read_all&approval_prompt=auto`

const COUNTRIES = [
  'Portugal','Brasil','Angola','Moçambique','Cabo Verde','Guiné-Bissau',
  'São Tomé e Príncipe','Timor-Leste','Espanha','França','Alemanha',
  'Reino Unido','Itália','Holanda','Bélgica','Suíça','Suécia','Noruega',
  'Estados Unidos','Canadá','Outro',
]

const EVENT_GROUPS = [
  {
    label: 'Estrada',
    events: ['5k','10k','Meia Maratona','Maratona'],
  },
  {
    label: 'Trail',
    events: ['Trail Curto','Trail Médio','Ultra Trail'],
  },
  {
    label: 'Pista',
    events: ['100m','200m','400m','800m','1500m','3000m','5000m','10000m'],
  },
  {
    label: 'Campo',
    events: ['Salto em Comprimento','Salto em Altura','Salto com Vara','Triplo Salto','Lançamento do Dardo','Lançamento do Martelo','Lançamento do Disco','Lançamento do Peso'],
  },
]

const RUNNING_EVENTS = ['5k','10k','Meia Maratona','Maratona','Trail Curto','Trail Médio','Ultra Trail','800m','1500m','3000m','5000m','10000m']

const GOALS = [
  { id: 'improve',  label: 'Melhorar os meus tempos',    icon: '⏱' },
  { id: 'compete',  label: 'Competir a alto nível',       icon: '🏆' },
  { id: 'health',   label: 'Manter-me saudável',          icon: '💚' },
]

function StravaIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  )
}

const s = {
  input: {
    width: '100%', background: 'var(--surface2)',
    border: '1px solid var(--border)', borderRadius: 14,
    padding: '14px 16px', fontSize: 15, color: 'var(--text)', outline: 'none',
  },
  label: {
    display: 'block', fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.08em',
    color: 'var(--text-muted)', marginBottom: 8,
  },
}

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep]   = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading]     = useState(false)
  const [coaches, setCoaches]     = useState([])
  const [stravaPrefill, setStravaPrefill] = useState(null)

  const [form, setForm] = useState({
    name: '', sex: '', date_of_birth: '', country: 'Portugal',
    email: '', password: '',
    experience: '',
    events: [],
    goal: '',
    pr_10km: '',
    no_pr: false,
    coach_id: '',
    gdpr_consent: false,
  })

  useEffect(() => {
    const prefill = sessionStorage.getItem('strava_prefill')
    if (prefill) {
      const p = JSON.parse(prefill)
      setStravaPrefill(p)
      setForm(f => ({
        ...f,
        name: p.name || '',
        sex: p.sex === 'M' ? 'M' : p.sex === 'F' ? 'F' : '',
      }))
    }
    supabase.from('athletes').select('id,name,email').eq('is_coach', true)
      .then(({ data }) => { if (data) setCoaches(data) })
  }, [])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function toggleEvent(ev) {
    setForm(f => ({
      ...f,
      events: f.events.includes(ev) ? f.events.filter(e => e !== ev) : [...f.events, ev],
    }))
  }

  const hasRunningEvent = form.events.some(e => RUNNING_EVENTS.includes(e))
  const needsPR = form.experience === 'runner' && hasRunningEvent

  // Validate each step
  const canAdvance = [
    null,
    form.name && form.sex && form.date_of_birth && form.country && form.email && form.password.length >= 6,
    form.experience && form.goal && (form.experience === 'beginner' || form.events.length > 0),
    form.gdpr_consent,
  ]

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      // Sign up
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: form.email, password: form.password,
      })
      let session = signUpData?.session

      if (signUpErr?.message?.includes('already registered')) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: form.email, password: form.password,
        })
        if (signInErr || !signInData.session) {
          setError('Email já registado. Confirma o email ou usa outra password.')
          setLoading(false)
          return
        }
        session = signInData.session
      }

      await supabase.auth.setSession(session)

      // Compute group
      const pr10 = form.no_pr ? null : parseTime(form.pr_10km)
      const group = form.experience === 'beginner' || (!pr10 && !hasRunningEvent)
        ? 'G6'
        : assignGroup(form.sex, pr10) || 'G6'

      const { error: insErr } = await supabase.rpc('register_athlete', {
        p_name:           form.name,
        p_email:          form.email,
        p_group:          group,
        p_sex:            form.sex || null,
        p_date_of_birth:  form.date_of_birth || null,
        p_nationality:    form.country || null,
        p_location:       null,
        p_postal_code:    null,
        p_nif:            null,
        p_modalities:     ['Atletismo'],
        p_specializations: form.events,
        p_pr_10km:        pr10 || null,
        p_pr_5km:         null,
        p_coach_id:       form.coach_id || null,
        p_gdpr_consent:   form.gdpr_consent,
      })

      if (insErr) {
        setError('Erro ao criar perfil: ' + (insErr.message || insErr.code))
        setLoading(false)
        return
      }

      if (stravaPrefill?.access_token) {
        await supabase.from('athletes').update({
          avatar_url:              stravaPrefill.avatar_url,
          strava_athlete_id:       stravaPrefill.strava_athlete_id,
          strava_access_token:     stravaPrefill.access_token,
          strava_refresh_token:    stravaPrefill.refresh_token,
          strava_token_expires_at: stravaPrefill.expires_at,
        }).eq('email', form.email)
        sessionStorage.removeItem('strava_prefill')
      }

      navigate('/dashboard')
    } catch (e) {
      setError('Erro inesperado: ' + e.message)
      setLoading(false)
    }
  }

  const TOTAL = 3

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--dark)' }}>
      <div className="max-w-sm w-full mx-auto px-5 pt-8 pb-24 flex-1">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--surface2)' }}>
              <ChevronLeft size={18} style={{ color: 'var(--text-muted)' }} />
            </button>
          ) : (
            <Link to="/" className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--surface2)' }}>
              <ChevronLeft size={18} style={{ color: 'var(--text-muted)' }} />
            </Link>
          )}
          <div className="flex-1">
            <div className="flex gap-1.5">
              {[1,2,3].map(i => (
                <div key={i} className="h-1 rounded-full flex-1 transition-all duration-300"
                  style={{ background: i <= step ? 'var(--heh-green)' : 'var(--surface3)' }} />
              ))}
            </div>
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
              Passo {step} de {TOTAL}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-black text-lg" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>
              H<span style={{ color: 'var(--heh-green)' }}>é</span>H
            </span>
            <span style={{ color: 'var(--heh-green)', fontSize: 9 }}>✦</span>
          </div>
        </div>

        {/* ── STEP 1: QUEM ÉS TU ── */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>
              Quem és tu?
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Vamos criar o teu perfil de atleta.
            </p>

            {/* Strava */}
            {!stravaPrefill ? (
              <a href={STRAVA_REGISTER_URL}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm mb-6"
                style={{ background: '#FC4C02', color: 'white' }}>
                <StravaIcon size={16} />
                Continuar com Strava
              </a>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-2xl mb-6"
                style={{ background: 'rgba(252,76,2,0.10)', border: '1px solid rgba(252,76,2,0.25)' }}>
                {stravaPrefill.avatar_url && (
                  <img src={stravaPrefill.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                )}
                <div>
                  <p className="text-xs font-bold" style={{ color: '#FC4C02' }}>Ligado ao Strava</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{stravaPrefill.name}</p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={s.label}>Nome completo</label>
                <input style={s.input} value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="O teu nome"
                  onFocus={e => e.target.style.borderColor='var(--heh-green)'}
                  onBlur={e => e.target.style.borderColor='var(--border)'} />
              </div>

              <div>
                <label style={s.label}>Sexo</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[{v:'M',l:'Masculino'},{v:'F',l:'Feminino'}].map(({v,l}) => (
                    <button key={v} type="button" onClick={() => set('sex', v)}
                      style={{
                        flex: 1, padding: '13px 0', borderRadius: 14, fontSize: 14, fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.15s',
                        background: form.sex===v ? 'rgba(184,255,0,0.12)' : 'var(--surface2)',
                        color: form.sex===v ? 'var(--heh-green)' : 'var(--text-muted)',
                        border: form.sex===v ? '1.5px solid rgba(184,255,0,0.5)' : '1px solid var(--border)',
                      }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={s.label}>Data de nascimento</label>
                <input type="date" style={s.input} value={form.date_of_birth}
                  onChange={e => set('date_of_birth', e.target.value)}
                  onFocus={e => e.target.style.borderColor='var(--heh-green)'}
                  onBlur={e => e.target.style.borderColor='var(--border)'} />
              </div>

              <div>
                <label style={s.label}>País</label>
                <select style={{ ...s.input, appearance: 'none' }}
                  value={form.country} onChange={e => set('country', e.target.value)}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={s.label}>Email</label>
                <input type="email" style={s.input} value={form.email}
                  onChange={e => set('email', e.target.value)} placeholder="o.teu@email.pt"
                  onFocus={e => e.target.style.borderColor='var(--heh-green)'}
                  onBlur={e => e.target.style.borderColor='var(--border)'} />
              </div>

              <div>
                <label style={s.label}>Palavra-passe</label>
                <input type="password" style={s.input} value={form.password}
                  onChange={e => set('password', e.target.value)} placeholder="mínimo 6 caracteres"
                  onFocus={e => e.target.style.borderColor='var(--heh-green)'}
                  onBlur={e => e.target.style.borderColor='var(--border)'} />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: DESPORTO ── */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>
              O teu atletismo
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
              Conta-nos mais sobre o que gostas de fazer.
            </p>

            {/* Experiência */}
            <div className="mb-8">
              <p className="text-base font-bold mb-3" style={{ color: 'var(--text)' }}>
                Tens experiência em corrida ou atletismo?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { v: 'runner', l: 'Sim, já pratico', d: 'Tenho experiência ou pratico desporto regularmente' },
                  { v: 'beginner', l: 'Estou a começar', d: 'Nunca pratiquei ou quero recomeçar do zero' },
                ].map(({ v, l, d }) => (
                  <button key={v} type="button" onClick={() => set('experience', v)}
                    style={{
                      padding: '16px 18px', borderRadius: 16, textAlign: 'left', cursor: 'pointer',
                      background: form.experience===v ? 'rgba(184,255,0,0.10)' : 'var(--surface)',
                      border: form.experience===v ? '2px solid rgba(184,255,0,0.5)' : '1.5px solid var(--border)',
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: form.experience===v ? 'var(--heh-green)' : 'var(--text)' }}>{l}</span>
                      {form.experience===v && <Check size={16} style={{ color: 'var(--heh-green)' }} />}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>{d}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Provas — só se tiver experiência */}
            {form.experience === 'runner' && (
              <div className="mb-8">
                <p className="text-base font-bold mb-3" style={{ color: 'var(--text)' }}>
                  Em que provas te especializas?
                </p>
                {EVENT_GROUPS.map(({ label, events }) => (
                  <div key={label} className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider mb-2"
                      style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{label}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {events.map(ev => {
                        const sel = form.events.includes(ev)
                        return (
                          <button key={ev} type="button" onClick={() => toggleEvent(ev)}
                            style={{
                              padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                              cursor: 'pointer', transition: 'all 0.15s',
                              background: sel ? 'rgba(184,255,0,0.12)' : 'var(--surface2)',
                              color: sel ? 'var(--heh-green)' : 'var(--text-muted)',
                              border: sel ? '1.5px solid rgba(184,255,0,0.45)' : '1px solid var(--border)',
                            }}>
                            {ev}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Objetivo */}
            {form.experience && (
              <div className="mb-8">
                <p className="text-base font-bold mb-3" style={{ color: 'var(--text)' }}>
                  Qual é o teu objetivo?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {GOALS.map(({ id, label, icon }) => {
                    const sel = form.goal === id
                    return (
                      <button key={id} type="button" onClick={() => set('goal', id)}
                        style={{
                          padding: '14px 18px', borderRadius: 14, textAlign: 'left',
                          cursor: 'pointer', transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: sel ? 'rgba(184,255,0,0.10)' : 'var(--surface)',
                          border: sel ? '2px solid rgba(184,255,0,0.5)' : '1.5px solid var(--border)',
                        }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: sel ? 'var(--heh-green)' : 'var(--text)' }}>
                          {icon} {label}
                        </span>
                        {sel && <Check size={16} style={{ color: 'var(--heh-green)' }} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Melhor tempo 10k */}
            {needsPR && (
              <div className="mb-4">
                <p className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>
                  Qual é o teu melhor tempo nos 10k?
                </p>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                  Serve para colocar-te no grupo certo. Não há problema em não saberes.
                </p>
                {!form.no_pr && (
                  <input style={{ ...s.input, marginBottom: 10 }}
                    value={form.pr_10km} onChange={e => set('pr_10km', e.target.value)}
                    placeholder="Ex: 45:30"
                    onFocus={e => e.target.style.borderColor='var(--heh-green)'}
                    onBlur={e => e.target.style.borderColor='var(--border)'} />
                )}
                <button type="button" onClick={() => set('no_pr', !form.no_pr)}
                  style={{
                    padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: form.no_pr ? 'rgba(184,255,0,0.10)' : 'var(--surface2)',
                    color: form.no_pr ? 'var(--heh-green)' : 'var(--text-muted)',
                    border: form.no_pr ? '1.5px solid rgba(184,255,0,0.45)' : '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                  {form.no_pr && <Check size={14} />}
                  Nunca fiz / Não sei o tempo
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: TREINADOR + CONTA ── */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>
              Quase lá!
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
              Escolhe o teu treinador e cria a conta.
            </p>

            {/* Coach */}
            {coaches.length > 0 && (
              <div className="mb-8">
                <p className="text-base font-bold mb-3" style={{ color: 'var(--text)' }}>
                  Escolhe o teu treinador
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {coaches.map(coach => {
                    const sel = form.coach_id === coach.id
                    return (
                      <button key={coach.id} type="button" onClick={() => set('coach_id', coach.id)}
                        style={{
                          padding: '14px 16px', borderRadius: 16, textAlign: 'left', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.15s',
                          background: sel ? 'rgba(184,255,0,0.10)' : 'var(--surface)',
                          border: sel ? '2px solid rgba(184,255,0,0.5)' : '1.5px solid var(--border)',
                        }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                          background: sel ? 'rgba(184,255,0,0.15)' : 'var(--surface2)',
                          color: sel ? 'var(--heh-green)' : 'var(--text-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 900, fontSize: 18,
                        }}>
                          {coach.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 700, fontSize: 14, color: sel ? 'var(--heh-green)' : 'var(--text)' }}>{coach.name}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{coach.email}</p>
                        </div>
                        {sel && <Check size={16} style={{ color: 'var(--heh-green)' }} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* GDPR */}
            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
              padding: '14px', borderRadius: 14, marginBottom: 24,
              background: form.gdpr_consent ? 'rgba(184,255,0,0.08)' : 'var(--surface)',
              border: form.gdpr_consent ? '1.5px solid rgba(184,255,0,0.4)' : '1.5px solid var(--border)',
            }}>
              <input type="checkbox" checked={form.gdpr_consent}
                onChange={e => set('gdpr_consent', e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 1, accentColor: 'var(--heh-green)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Autorizo a <strong style={{ color: 'var(--text)' }}>Hoje é Hoje</strong> a recolher e tratar os meus dados pessoais
                exclusivamente para fins de gestão de treinos e análise de desempenho desportivo,
                em conformidade com o RGPD.
              </span>
            </label>

            {error && (
              <div style={{ background: 'rgba(255,69,58,0.12)', color: '#FF453A', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}
          </div>
        )}

        {/* ── BOTÃO AVANÇAR / CRIAR CONTA ── */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px 32px', background: 'linear-gradient(to top, var(--dark) 70%, transparent)', maxWidth: 390, margin: '0 auto' }}>
          {step < TOTAL ? (
            <button
              onClick={() => { setError(''); setStep(s => s + 1) }}
              disabled={!canAdvance[step]}
              style={{
                width: '100%', padding: '16px', borderRadius: 16, fontWeight: 900, fontSize: 15,
                border: 'none', cursor: canAdvance[step] ? 'pointer' : 'not-allowed',
                background: canAdvance[step] ? 'var(--heh-green)' : 'var(--surface2)',
                color: canAdvance[step] ? '#080808' : 'var(--text-muted)',
                transition: 'all 0.15s', letterSpacing: '-0.01em',
              }}>
              Próximo →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !canAdvance[3]}
              style={{
                width: '100%', padding: '16px', borderRadius: 16, fontWeight: 900, fontSize: 15,
                border: 'none', cursor: 'pointer',
                background: canAdvance[3] ? 'var(--heh-green)' : 'var(--surface2)',
                color: canAdvance[3] ? '#080808' : 'var(--text-muted)',
                opacity: loading ? 0.7 : 1, transition: 'all 0.15s',
              }}>
              {loading ? 'A criar conta...' : 'Criar conta'}
            </button>
          )}
          {step === 1 && (
            <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
              Já tens conta? <Link to="/login" style={{ color: 'var(--heh-green)', fontWeight: 700 }}>Entrar</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
