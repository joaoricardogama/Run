import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { assignGroup } from '../utils/groupAssignment'
import { getEscalao, escalaoColor } from '../utils/escalao'
import { AlertCircle, ChevronLeft, Check } from 'lucide-react'

const STRAVA_REGISTER_URL = `https://www.strava.com/oauth/authorize?client_id=261127&redirect_uri=${encodeURIComponent('https://run-blush.vercel.app/strava/register-callback')}&response_type=code&scope=read,activity:read_all&approval_prompt=auto`

const COUNTRIES = [
  'Portugal','Brasil','Angola','Moçambique','Cabo Verde','Guiné-Bissau',
  'Espanha','França','Alemanha','Reino Unido','Itália','Suíça','Suécia',
  'Estados Unidos','Canadá','Outro',
]

const EVENT_GROUPS = [
  { label: 'Estrada',    events: ['5k','10k','Meia Maratona','Maratona'] },
  { label: 'Trail',      events: ['Trail Curto','Trail Médio','Ultra Trail'] },
  { label: 'Pista',      events: ['100m','200m','400m','800m','1500m','3000m','5000m','10000m'] },
  { label: 'Campo',      events: ['Salto em Comprimento','Salto em Altura','Salto com Vara','Triplo Salto','Lançamento do Dardo','Lançamento do Martelo','Lançamento do Disco','Lançamento do Peso'] },
]

const RUNNING_EVENTS = ['5k','10k','Meia Maratona','Maratona','Trail Curto','Trail Médio','Ultra Trail','800m','1500m','3000m','5000m','10000m']

const GROUP_INFO = {
  G1: { label: 'Elite', color: '#30D158' },
  G2: { label: 'Avançado', color: '#0A84FF' },
  G3: { label: 'Intermédio+', color: '#FFD60A' },
  G4: { label: 'Intermédio', color: '#FF9F0A' },
  G5: { label: 'Iniciante+', color: '#FF6B35' },
  G6: { label: 'Iniciante', color: '#BF5AF2' },
}

function StravaIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  )
}

// ── Time Picker (cronómetro estilo) ──────────────────────────────
function TimePicker({ minutes, seconds, onChange }) {
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }
  function setMin(v) { onChange(clamp(v, 0, 99), seconds) }
  function setSec(v) { onChange(minutes, clamp(v, 0, 59)) }

  const btnStyle = (active) => ({
    width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
    background: 'var(--surface3)', color: 'var(--text)', fontSize: 22, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  })

  const numStyle = {
    fontSize: 56, fontWeight: 900, color: 'var(--text)',
    letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums',
    minWidth: 80, textAlign: 'center', lineHeight: 1,
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {/* Minutos */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <button style={btnStyle()} onPointerDown={() => setMin(minutes + 1)}>+</button>
        <div>
          <div style={numStyle}>{String(minutes).padStart(2,'0')}</div>
          <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>min</div>
        </div>
        <button style={btnStyle()} onPointerDown={() => setMin(minutes - 1)}>−</button>
      </div>

      {/* Separador */}
      <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1 }}>:</div>

      {/* Segundos */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <button style={btnStyle()} onPointerDown={() => setSec(seconds + 1)}>+</button>
        <div>
          <div style={numStyle}>{String(seconds).padStart(2,'0')}</div>
          <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>seg</div>
        </div>
        <button style={btnStyle()} onPointerDown={() => setSec(seconds - 1)}>−</button>
      </div>
    </div>
  )
}

// ── Wrapper com fade/slide animado ────────────────────────────────
function AnimatedQ({ children, qKey }) {
  const [visible, setVisible] = useState(false)
  const prev = useRef(qKey)

  useEffect(() => {
    if (prev.current !== qKey) { setVisible(false); setTimeout(() => { prev.current = qKey; setVisible(true) }, 80) }
    else setVisible(true)
  }, [qKey])

  return (
    <div style={{ transition: 'opacity 0.25s, transform 0.25s', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)' }}>
      {children}
    </div>
  )
}

// ── Opção grande seleccionável ────────────────────────────────────
function BigOption({ label, sub, selected, onSelect }) {
  return (
    <button type="button" onClick={onSelect}
      style={{
        width: '100%', padding: '16px 18px', borderRadius: 16, textAlign: 'left', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: selected ? 'rgba(184,255,0,0.10)' : 'var(--surface)',
        border: selected ? '2px solid rgba(184,255,0,0.5)' : '1.5px solid var(--border)',
        transition: 'all 0.15s',
      }}>
      <div>
        <p style={{ fontWeight: 700, fontSize: 15, color: selected ? 'var(--heh-green)' : 'var(--text)' }}>{label}</p>
        {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</p>}
      </div>
      {selected && <Check size={16} style={{ color: 'var(--heh-green)', flexShrink: 0 }} />}
    </button>
  )
}

const inputStyle = {
  width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 14, padding: '14px 16px', fontSize: 15, color: 'var(--text)', outline: 'none',
  boxSizing: 'border-box',
}
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8,
}

// Sub-passos do passo 2 (pergunta a pergunta)
const SUB_STEPS = ['experience', 'goal', 'events', 'time']

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep]       = useState(1)
  const [subStep, setSubStep] = useState(0)  // só usado no passo 2
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [coaches, setCoaches] = useState([])
  const [stravaPrefill, setStravaPrefill] = useState(null)

  const [form, setForm] = useState({
    name: '', sex: '', date_of_birth: '', country: 'Portugal',
    email: '', password: '',
    experience: '',
    events: [],
    goal: '',
    pr_min: 45, pr_sec: 0,
    no_pr: false,
    coach_id: '',
    gdpr_consent: false,
  })

  useEffect(() => {
    const prefill = sessionStorage.getItem('strava_prefill')
    if (prefill) {
      const p = JSON.parse(prefill)
      setStravaPrefill(p)
      setForm(f => ({ ...f, name: p.name || '', sex: p.sex === 'M' ? 'M' : p.sex === 'F' ? 'F' : '' }))
    }
    supabase.from('athletes').select('id,name,email').eq('is_coach', true)
      .then(({ data }) => { if (data) setCoaches(data) })
  }, [])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function toggleEvent(ev) {
    setForm(f => ({
      ...f, events: f.events.includes(ev) ? f.events.filter(e => e !== ev) : [...f.events, ev],
    }))
  }

  const hasRunningEvent = form.events.some(e => RUNNING_EVENTS.includes(e))
  const isRunner = form.experience === 'runner'

  // Calcula o grupo em tempo real baseado no tempo 10k
  const pr10Seconds = form.pr_min * 60 + form.pr_sec
  const liveGroup = form.no_pr || !isRunner
    ? 'G6'
    : (assignGroup(form.sex, pr10Seconds) || 'G6')

  // Sequência de sub-perguntas no passo 2
  const subFlow = ['experience', 'goal']
  if (isRunner) subFlow.push('events')
  if (isRunner && (hasRunningEvent || form.events.length === 0)) subFlow.push('time')

  const currentSub = subFlow[subStep] || 'time'

  function advanceSub() {
    if (subStep < subFlow.length - 1) {
      setSubStep(s => s + 1)
    } else {
      setStep(3)
      setSubStep(0)
    }
  }

  function canAdvanceSub() {
    if (currentSub === 'experience') return !!form.experience
    if (currentSub === 'goal')       return !!form.goal
    if (currentSub === 'events')     return form.events.length > 0
    if (currentSub === 'time')       return true
    return false
  }

  const step1Valid = form.name && form.sex && form.date_of_birth && form.country && form.email && form.password.length >= 6

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email: form.email, password: form.password })
      let session = signUpData?.session

      if (signUpErr?.message?.includes('already registered')) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
        if (signInErr || !signInData.session) { setError('Email já registado. Verifica a password.'); setLoading(false); return }
        session = signInData.session
      }

      await supabase.auth.setSession(session)

      const pr10 = form.no_pr ? null : pr10Seconds
      const group = form.experience === 'beginner' || form.experience === 'walker'
        ? 'G6'
        : (assignGroup(form.sex, pr10) || 'G6')

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

      if (insErr) { setError('Erro ao criar perfil: ' + (insErr.message || insErr.code)); setLoading(false); return }

      // Guardar escalão FPA
      const escalao = getEscalao(form.date_of_birth, form.sex)
      if (escalao) {
        await supabase.from('athletes').update({ escalao }).eq('email', form.email)
      }

      if (stravaPrefill?.access_token) {
        await supabase.from('athletes').update({
          avatar_url: stravaPrefill.avatar_url,
          strava_athlete_id: stravaPrefill.strava_athlete_id,
          strava_access_token: stravaPrefill.access_token,
          strava_refresh_token: stravaPrefill.refresh_token,
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

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--dark)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: 420, width: '100%', margin: '0 auto', padding: '0 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 40, paddingBottom: 28 }}>
          <button onClick={() => {
            if (step === 2 && subStep > 0) setSubStep(s => s - 1)
            else if (step > 1) { setStep(s => s - 1); setSubStep(0) }
            else navigate('/')
          }}
            style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface2)', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
            <ChevronLeft size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ height: 3, flex: 1, borderRadius: 4, background: i <= step ? 'var(--heh-green)' : 'var(--surface3)', transition: 'background 0.3s' }} />
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Passo {step} de 3</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--text)', letterSpacing: '-0.03em' }}>
              H<span style={{ color: 'var(--heh-green)' }}>é</span>H
            </span>
            <span style={{ color: 'var(--heh-green)', fontSize: 9 }}>✦</span>
          </div>
        </div>

        {/* ── PASSO 1: QUEM ÉS TU ── */}
        {step === 1 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontWeight: 900, fontSize: 26, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 4 }}>Quem és tu?</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Vamos criar o teu perfil de atleta.</p>

            {/* Strava */}
            {!stravaPrefill ? (
              <a href={STRAVA_REGISTER_URL}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 16, fontWeight: 700, fontSize: 14, background: '#FC4C02', color: 'white', textDecoration: 'none', marginBottom: 20 }}>
                <StravaIcon size={16} />Continuar com Strava
              </a>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, background: 'rgba(252,76,2,0.10)', border: '1px solid rgba(252,76,2,0.25)', marginBottom: 20 }}>
                {stravaPrefill.avatar_url && <img src={stravaPrefill.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#FC4C02' }}>Ligado ao Strava</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{stravaPrefill.name}</p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nome completo</label>
                <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="O teu nome" />
              </div>

              <div>
                <label style={labelStyle}>Sexo</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[{v:'M',l:'Masculino'},{v:'F',l:'Feminino'}].map(({v,l}) => (
                    <button key={v} type="button" onClick={() => set('sex', v)}
                      style={{ flex: 1, padding: '13px', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: form.sex===v ? '1.5px solid rgba(184,255,0,0.5)' : '1px solid var(--border)', background: form.sex===v ? 'rgba(184,255,0,0.12)' : 'var(--surface2)', color: form.sex===v ? 'var(--heh-green)' : 'var(--text-muted)', transition: 'all 0.15s' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Data de nascimento</label>
                <input type="date" style={inputStyle} value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
                {/* Preview de escalão em tempo real */}
                {form.date_of_birth && form.sex && (() => {
                  const esc = getEscalao(form.date_of_birth, form.sex)
                  const clr = escalaoColor(esc)
                  return esc ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '8px 12px', borderRadius: 10, background: clr + '18', border: `1px solid ${clr}44` }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: clr }}>{esc}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· escalão FPA atribuído automaticamente</span>
                    </div>
                  ) : null
                })()}
              </div>

              <div>
                <label style={labelStyle}>País</label>
                <select style={{ ...inputStyle, appearance: 'none' }} value={form.country} onChange={e => set('country', e.target.value)}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} placeholder="o.teu@email.pt" />
              </div>

              <div>
                <label style={labelStyle}>Palavra-passe</label>
                <input type="password" style={inputStyle} value={form.password} onChange={e => set('password', e.target.value)} placeholder="mínimo 6 caracteres" />
              </div>
            </div>

            <div style={{ marginTop: 28, paddingBottom: 32 }}>
              <button onClick={() => { setError(''); setStep(2) }} disabled={!step1Valid}
                style={{ width: '100%', padding: '16px', borderRadius: 16, fontWeight: 900, fontSize: 15, border: 'none', cursor: step1Valid ? 'pointer' : 'not-allowed', background: step1Valid ? 'var(--heh-green)' : 'var(--surface2)', color: step1Valid ? '#080808' : 'var(--text-muted)', transition: 'all 0.15s' }}>
                Próximo →
              </button>
              <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-muted)' }}>
                Já tens conta? <Link to="/login" style={{ color: 'var(--heh-green)', fontWeight: 700 }}>Entrar</Link>
              </p>
            </div>
          </div>
        )}

        {/* ── PASSO 2: DESPORTO (sub-perguntas) ── */}
        {step === 2 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

            {/* ── 2a: Experiência ── */}
            {currentSub === 'experience' && (
              <AnimatedQ qKey="experience">
                <h2 style={{ fontWeight: 900, fontSize: 24, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 8 }}>
                  Tens experiência em corrida ou atletismo?
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Conta-nos um pouco sobre ti.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <BigOption label="Sim, sou corredor" sub="Pratico corrida ou atletismo regularmente" selected={form.experience==='runner'} onSelect={() => { set('experience','runner'); setTimeout(advanceSub, 280) }} />
                  <BigOption label="Estou a começar" sub="Nunca treinei ou quero recomeçar do zero" selected={form.experience==='beginner'} onSelect={() => { set('experience','beginner'); setTimeout(advanceSub, 280) }} />
                  <BigOption label="Faço caminhada" sub="Caminho regularmente, não corro" selected={form.experience==='walker'} onSelect={() => { set('experience','walker'); setTimeout(advanceSub, 280) }} />
                </div>
              </AnimatedQ>
            )}

            {/* ── 2b: Objetivo ── */}
            {currentSub === 'goal' && (
              <AnimatedQ qKey="goal">
                <h2 style={{ fontWeight: 900, fontSize: 24, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 8 }}>
                  Qual é o teu objetivo?
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Escolhe o que mais te representa.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { v:'improve', l:'Melhorar os meus tempos',   s:'Quero ser mais rápido e bater PRs' },
                    { v:'compete', l:'Competir a alto nível',      s:'Quero representar o clube em provas' },
                    { v:'health',  l:'Manter-me saudável',         s:'O desporto faz-me bem, quero continuar' },
                  ].map(({ v, l, s }) => (
                    <BigOption key={v} label={l} sub={s} selected={form.goal===v} onSelect={() => { set('goal', v); setTimeout(advanceSub, 280) }} />
                  ))}
                </div>
              </AnimatedQ>
            )}

            {/* ── 2c: Provas ── */}
            {currentSub === 'events' && (
              <AnimatedQ qKey="events">
                <h2 style={{ fontWeight: 900, fontSize: 24, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 8 }}>
                  Em que provas te especializas?
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Podes escolher várias.</p>
                <div style={{ flex: 1 }}>
                  {EVENT_GROUPS.map(({ label, events }) => (
                    <div key={label} style={{ marginBottom: 18 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>{label}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {events.map(ev => {
                          const sel = form.events.includes(ev)
                          return (
                            <button key={ev} type="button" onClick={() => toggleEvent(ev)}
                              style={{ padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: sel ? 'rgba(184,255,0,0.12)' : 'var(--surface2)', color: sel ? 'var(--heh-green)' : 'var(--text-muted)', border: sel ? '1.5px solid rgba(184,255,0,0.45)' : '1px solid var(--border)', transition: 'all 0.15s' }}>
                              {ev}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ paddingTop: 16, paddingBottom: 32 }}>
                  <button onClick={advanceSub} disabled={form.events.length === 0}
                    style={{ width: '100%', padding: '16px', borderRadius: 16, fontWeight: 900, fontSize: 15, border: 'none', cursor: form.events.length > 0 ? 'pointer' : 'not-allowed', background: form.events.length > 0 ? 'var(--heh-green)' : 'var(--surface2)', color: form.events.length > 0 ? '#080808' : 'var(--text-muted)', transition: 'all 0.15s' }}>
                    Próximo →
                  </button>
                </div>
              </AnimatedQ>
            )}

            {/* ── 2d: Tempo 10k ── */}
            {currentSub === 'time' && (
              <AnimatedQ qKey="time">
                <h2 style={{ fontWeight: 900, fontSize: 24, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 8 }}>
                  Qual é o teu melhor tempo nos 10k?
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
                  Serve para te colocar no grupo certo. Não é um problema não saberes.
                </p>

                {!form.no_pr && (
                  <>
                    <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '28px 20px', marginBottom: 20, border: '1px solid var(--border)' }}>
                      <TimePicker
                        minutes={form.pr_min}
                        seconds={form.pr_sec}
                        onChange={(m, s) => setForm(f => ({ ...f, pr_min: m, pr_sec: s }))}
                      />
                    </div>

                    {/* Grupo estimado em tempo real */}
                    {liveGroup && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px', borderRadius: 14, background: 'rgba(184,255,0,0.06)', border: '1px solid rgba(184,255,0,0.15)', marginBottom: 20 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: GROUP_INFO[liveGroup]?.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: GROUP_INFO[liveGroup]?.color }}>
                          {liveGroup}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                            Grupo {liveGroup} · {GROUP_INFO[liveGroup]?.label}
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>grupo atribuído com base no teu tempo</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <button type="button" onClick={() => set('no_pr', !form.no_pr)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: form.no_pr ? 'rgba(184,255,0,0.10)' : 'var(--surface2)', color: form.no_pr ? 'var(--heh-green)' : 'var(--text-muted)', border: form.no_pr ? '1.5px solid rgba(184,255,0,0.45)' : '1px solid var(--border)', width: '100%', marginBottom: 24 }}>
                  {form.no_pr && <Check size={14} />}
                  Nunca fiz 10k / Não sei o tempo {form.no_pr && '— vais para o G6'}
                </button>

                <div style={{ paddingBottom: 32 }}>
                  <button onClick={() => { setStep(3); setSubStep(0) }}
                    style={{ width: '100%', padding: '16px', borderRadius: 16, fontWeight: 900, fontSize: 15, border: 'none', cursor: 'pointer', background: 'var(--heh-green)', color: '#080808' }}>
                    Próximo →
                  </button>
                </div>
              </AnimatedQ>
            )}
          </div>
        )}

        {/* ── PASSO 3: TREINADOR + GDPR ── */}
        {step === 3 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontWeight: 900, fontSize: 26, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 4 }}>Quase lá!</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Escolhe o teu treinador e cria a conta.</p>

            {coaches.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Treinador</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {coaches.map(coach => {
                    const sel = form.coach_id === coach.id
                    return (
                      <button key={coach.id} type="button" onClick={() => set('coach_id', coach.id)}
                        style={{ padding: '14px 16px', borderRadius: 16, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: sel ? 'rgba(184,255,0,0.10)' : 'var(--surface)', border: sel ? '2px solid rgba(184,255,0,0.5)' : '1.5px solid var(--border)', transition: 'all 0.15s' }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: sel ? 'rgba(184,255,0,0.15)' : 'var(--surface2)', color: sel ? 'var(--heh-green)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, flexShrink: 0 }}>
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

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '14px', borderRadius: 14, marginBottom: 20, background: form.gdpr_consent ? 'rgba(184,255,0,0.08)' : 'var(--surface)', border: form.gdpr_consent ? '1.5px solid rgba(184,255,0,0.4)' : '1.5px solid var(--border)' }}>
              <input type="checkbox" checked={form.gdpr_consent} onChange={e => set('gdpr_consent', e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 1, accentColor: 'var(--heh-green)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Autorizo a <strong style={{ color: 'var(--text)' }}>Hoje é Hoje</strong> a recolher e tratar os meus dados pessoais para gestão de treinos e análise de desempenho, em conformidade com o RGPD.
              </span>
            </label>

            {error && (
              <div style={{ background: 'rgba(255,69,58,0.12)', color: '#FF453A', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <div style={{ paddingBottom: 32 }}>
              <button onClick={handleSubmit} disabled={loading || !form.gdpr_consent}
                style={{ width: '100%', padding: '16px', borderRadius: 16, fontWeight: 900, fontSize: 15, border: 'none', cursor: 'pointer', background: form.gdpr_consent ? 'var(--heh-green)' : 'var(--surface2)', color: form.gdpr_consent ? '#080808' : 'var(--text-muted)', opacity: loading ? 0.7 : 1, transition: 'all 0.15s' }}>
                {loading ? 'A criar conta...' : 'Criar conta'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
