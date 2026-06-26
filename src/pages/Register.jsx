import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { parseTime } from '../utils/pace'
import { assignGroup, MODALITIES, SPECIALIZATIONS } from '../utils/groupAssignment'
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'

const STRAVA_REGISTER_URL = `https://www.strava.com/oauth/authorize?client_id=261127&redirect_uri=${encodeURIComponent('https://run-blush.vercel.app/strava/register-callback')}&response_type=code&scope=read,activity:read_all&approval_prompt=auto`

function StravaIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  )
}

const inputStyle = {
background: 'var(--surface2)',
border: '1px solid var(--border)',
color: 'var(--text)',
borderRadius: 12,
padding: '12px 16px',
fontSize: 14,
width: '100%',
outline: 'none',
}
const labelStyle = {
display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 6,
}

function MultiSelect({ options, value, onChange, columns = 2 }) {
return (
<div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
{options.map(opt => {
const selected = value.includes(opt)
return (
<button key={opt} type="button"
onClick={() => onChange(selected ? value.filter(v => v !== opt) : [...value, opt])}
style={{
padding: '8px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600,
textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
background: selected ? 'rgba(252,76,2,0.15)' : 'var(--surface2)',
color: selected ? 'var(--orange)' : 'var(--text-muted)',
border: selected ? '1px solid rgba(252,76,2,0.4)' : '1px solid var(--border)',
}}>
{selected ? '✓ ' : ''}{opt}
</button>
)
})}
</div>
)
}

function SpecializationsSection({ modalities, value, onChange }) {
const [open, setOpen] = useState({})
if (!modalities.length) return null

const relevantMods = modalities.filter(m => SPECIALIZATIONS[m])
if (!relevantMods.length) return null

return (
<div className="space-y-3">
{relevantMods.map(mod => (
<div key={mod}>
<p className="text-xs font-bold mb-2" style={{ color: 'var(--text)' }}>{mod} — Especialização</p>
{SPECIALIZATIONS[mod].map(({ group, items }) => (
<div key={group} className="mb-2">
<button type="button" onClick={() => setOpen(p => ({ ...p, [mod+group]: !p[mod+group] }))}
className="flex items-center justify-between w-full mb-1.5"
style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>
<span>{group}</span>
{open[mod+group] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
</button>
{(open[mod+group] || modalities.length === 1) && (
<MultiSelect options={items} value={value} onChange={onChange} columns={2} />
)}
</div>
))}
</div>
))}
</div>
)
}

function GroupBadge({ group }) {
const colors = {
G1: { bg: 'rgba(48,209,88,0.15)', text: '#30D158' },
G2: { bg: 'rgba(10,132,255,0.15)', text: '#0A84FF' },
G3: { bg: 'rgba(255,214,10,0.15)', text: '#FFD60A' },
G4: { bg: 'rgba(255,159,10,0.15)', text: '#FF9F0A' },
G5: { bg: 'rgba(255,69,58,0.15)', text: '#FF453A' },
G6: { bg: 'rgba(191,90,242,0.15)', text: '#BF5AF2' },
}
if (!group) return null
const clr = colors[group] || colors.G6
return (
<div className="rounded-2xl p-4 text-center"
style={{ background: clr.bg, border: `1px solid ${clr.text}33` }}>
<p className="text-xs font-bold mb-1" style={{ color: clr.text }}>Grupo atribuído</p>
<p className="text-4xl font-black" style={{ color: clr.text }}>{group}</p>
</div>
)
}

const STEPS = ['Pessoal', 'Desporto', 'Treinador', 'Conta']

export default function Register() {
const navigate = useNavigate()
const [step, setStep] = useState(0)
const [coaches, setCoaches] = useState([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')
const [stravaPrefill, setStravaPrefill] = useState(null)

// Form state
const [form, setForm] = useState({
name: '', email: '', password: '',
date_of_birth: '', sex: '', nationality: 'Portuguesa', location: '',
postal_code: '', nif: '',
modalities: [], specializations: [],
pr_10km: '', pr_5km: '', coach_id: '',
gdpr_consent: false,
})

function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

useEffect(() => {
supabase.from('coaches').select('id, name, email').order('name').then(({ data }) => {
if (data) setCoaches(data)
})
// Pré-preencher com dados do Strava se vieram do OAuth
const raw = sessionStorage.getItem('strava_prefill')
if (raw) {
  try {
    const prefill = JSON.parse(raw)
    setStravaPrefill(prefill)
    setForm(p => ({
      ...p,
      name:     prefill.name     || p.name,
      sex:      prefill.sex      || p.sex,
      location: prefill.location || p.location,
    }))
  } catch { /* ignorar JSON inválido */ }
}
}, [])

const pr10Seconds = parseTime(form.pr_10km)
const autoGroup = form.sex && pr10Seconds ? assignGroup(form.sex, pr10Seconds) : null

async function handleSubmit(e) {
e.preventDefault()
setLoading(true)
setError('')

const pr10 = parseTime(form.pr_10km)
const pr5 = parseTime(form.pr_5km)

if (!pr10) { setError('Formato de PR 10km inválido (use MM:SS ou HH:MM:SS)'); setLoading(false); return }

// 1. Create auth user (or sign in if already exists)
const { data: authData, error: authErr } = await supabase.auth.signUp({
email: form.email,
password: form.password,
options: { data: { name: form.name } },
})

// If any error other than "already exists", abort
if (authErr && authErr.code !== 'user_already_exists') {
setError(authErr.message || 'Erro ao criar conta. Tenta novamente.')
setLoading(false)
return
}

// Ensure we have an active session (sign in if user already existed)
let session = authData?.session
if (!session) {
const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
email: form.email,
password: form.password,
})
if (signInErr || !signInData.session) {
setError('Confirma o teu email ou verifica a palavra-passe.')
setLoading(false)
return
}
session = signInData.session
}
await supabase.auth.setSession(session)

// 2. Create athlete record via RPC (bypasses RLS safely)
const group = assignGroup(form.sex, pr10)
const { error: insErr } = await supabase.rpc('register_athlete', {
p_name: form.name,
p_email: form.email,
p_group: group,
p_sex: form.sex || null,
p_date_of_birth: form.date_of_birth || null,
p_nationality: form.nationality || null,
p_location: form.location || null,
p_postal_code: form.postal_code || null,
p_nif: form.nif || null,
p_modalities: form.modalities,
p_specializations: form.specializations,
p_pr_10km: pr10 || null,
p_pr_5km: pr5 || null,
p_coach_id: form.coach_id || null,
p_gdpr_consent: form.gdpr_consent,
})
if (insErr) {
setError(`Erro ao criar perfil: ${insErr.message || insErr.details || insErr.code || 'Erro desconhecido'}`)
setLoading(false)
return
}

// Guardar tokens Strava se o registo veio do OAuth
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
}

const canNext = [
form.name && form.sex && form.date_of_birth,
form.modalities.length > 0 && form.pr_10km,
form.coach_id,
form.email && form.password && form.password.length >= 6 && form.gdpr_consent,
]

return (
<div className="min-h-screen flex flex-col" style={{ background: 'var(--dark)' }}>
<div className="max-w-sm w-full mx-auto px-5 pt-10 pb-16 flex-1">

{/* Logo */}
<div className="mb-8 text-center">
<div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
style={{ background: 'var(--orange)' }}>
<svg width="28" height="28" viewBox="0 0 24 24" fill="white">
<path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/>
</svg>
</div>
<h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>
Criar conta <span style={{ color: 'var(--orange)' }}>RunTejo</span>
</h1>
<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>v4</p>
</div>

{/* Botão Registar com Strava (só se ainda não veio do Strava) */}
{!stravaPrefill && (
  <div className="mb-6">
    <a href={STRAVA_REGISTER_URL}
      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm"
      style={{ background: '#FC4C02', color: 'white' }}>
      <StravaIcon size={18} />
      Registar com Strava
    </a>
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>ou preenche manualmente</span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  </div>
)}

{/* Badge Strava se pré-preenchido */}
{stravaPrefill && (
  <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl"
    style={{ background: 'rgba(252,76,2,0.10)', border: '1px solid rgba(252,76,2,0.25)' }}>
    {stravaPrefill.avatar_url && (
      <img src={stravaPrefill.avatar_url} alt="Strava" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
    )}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span style={{ color: '#FC4C02' }}><StravaIcon size={13} /></span>
        <span className="text-xs font-bold" style={{ color: '#FC4C02' }}>Ligado ao Strava</span>
      </div>
      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{stravaPrefill.name}</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Dados pré-preenchidos — revê e confirma</p>
    </div>
  </div>
)}

{/* Step indicator */}
<div className="flex items-center gap-2 mb-8">
{STEPS.map((s, i) => (
<div key={s} className="flex-1 flex flex-col items-center gap-1">
<div className="h-1 w-full rounded-full transition-all"
style={{ background: i <= step ? 'var(--orange)' : 'var(--surface3)' }} />
<span className="text-xs font-medium" style={{ color: i === step ? 'var(--orange)' : 'var(--text-muted)' }}>
{s}
</span>
</div>
))}
</div>

<form onSubmit={handleSubmit}>

{/* STEP 0 — Dados pessoais */}
{step === 0 && (
<div className="space-y-4">
<div>
<label style={labelStyle}>Nome completo</label>
<input value={form.name} onChange={e => set('name', e.target.value)} required
placeholder="João Silva" style={inputStyle}
onFocus={e => e.target.style.borderColor = 'var(--orange)'}
onBlur={e => e.target.style.borderColor = 'var(--border)'} />
</div>
<div className="grid grid-cols-2 gap-3">
<div>
<label style={labelStyle}>Sexo</label>
<div className="flex gap-2">
{[{ v: 'M', l: 'Masc.' }, { v: 'F', l: 'Fem.' }].map(({ v, l }) => (
<button key={v} type="button" onClick={() => set('sex', v)}
className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
style={{
background: form.sex === v ? 'rgba(252,76,2,0.15)' : 'var(--surface2)',
color: form.sex === v ? 'var(--orange)' : 'var(--text-muted)',
border: form.sex === v ? '1px solid rgba(252,76,2,0.4)' : '1px solid var(--border)',
}}>{l}</button>
))}
</div>
</div>
<div>
<label style={labelStyle}>Data de nascimento</label>
<input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)}
style={inputStyle}
onFocus={e => e.target.style.borderColor = 'var(--orange)'}
onBlur={e => e.target.style.borderColor = 'var(--border)'} />
</div>
</div>
<div>
<label style={labelStyle}>Nacionalidade</label>
<input value={form.nationality} onChange={e => set('nationality', e.target.value)}
placeholder="Portuguesa" style={inputStyle}
onFocus={e => e.target.style.borderColor = 'var(--orange)'}
onBlur={e => e.target.style.borderColor = 'var(--border)'} />
</div>
<div>
<label style={labelStyle}>Localidade</label>
<input value={form.location} onChange={e => set('location', e.target.value)}
placeholder="Lisboa" style={inputStyle}
onFocus={e => e.target.style.borderColor = 'var(--orange)'}
onBlur={e => e.target.style.borderColor = 'var(--border)'} />
</div>
<div className="grid grid-cols-2 gap-3">
<div>
<label style={labelStyle}>Código Postal</label>
<input value={form.postal_code} onChange={e => set('postal_code', e.target.value)}
placeholder="1000-001" style={inputStyle}
onFocus={e => e.target.style.borderColor = 'var(--orange)'}
onBlur={e => e.target.style.borderColor = 'var(--border)'} />
</div>
<div>
<label style={labelStyle}>NIF</label>
<input value={form.nif} onChange={e => set('nif', e.target.value)}
placeholder="123456789" maxLength={9} style={inputStyle}
onFocus={e => e.target.style.borderColor = 'var(--orange)'}
onBlur={e => e.target.style.borderColor = 'var(--border)'} />
</div>
</div>
</div>
)}

{/* STEP 1 — Desporto */}
{step === 1 && (
<div className="space-y-5">
<div>
<label style={labelStyle}>Modalidade(s)</label>
<MultiSelect options={MODALITIES} value={form.modalities}
onChange={v => { set('modalities', v); set('specializations', []) }}
columns={3} />
</div>

{form.modalities.length > 0 && (
<SpecializationsSection
modalities={form.modalities}
value={form.specializations}
onChange={v => set('specializations', v)} />
)}

<div>
<label style={labelStyle}>PR 10km (MM:SS)</label>
<input value={form.pr_10km} onChange={e => set('pr_10km', e.target.value)}
placeholder="48:30" className="pace-mono" style={inputStyle}
onFocus={e => e.target.style.borderColor = 'var(--orange)'}
onBlur={e => e.target.style.borderColor = 'var(--border)'} />
<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
Usado para determinar o teu grupo de treino
</p>
</div>

<div>
<label style={labelStyle}>PR 5km (MM:SS) — opcional</label>
<input value={form.pr_5km} onChange={e => set('pr_5km', e.target.value)}
placeholder="22:30" className="pace-mono" style={inputStyle}
onFocus={e => e.target.style.borderColor = 'var(--orange)'}
onBlur={e => e.target.style.borderColor = 'var(--border)'} />
</div>

{autoGroup && (
<GroupBadge group={autoGroup} />
)}
</div>
)}

{/* STEP 2 — Treinador */}
{step === 2 && (
<div className="space-y-3">
<label style={labelStyle}>Seleciona o teu treinador</label>
{coaches.length === 0 ? (
<p className="text-sm" style={{ color: 'var(--text-muted)' }}>A carregar treinadores...</p>
) : (
coaches.map(coach => (
<button key={coach.id} type="button"
onClick={() => set('coach_id', coach.id)}
className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
style={{
background: form.coach_id === coach.id ? 'rgba(252,76,2,0.12)' : 'var(--surface)',
border: form.coach_id === coach.id ? '1px solid rgba(252,76,2,0.4)' : '1px solid var(--border)',
}}>
<div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0"
style={{ background: 'rgba(252,76,2,0.15)', color: 'var(--orange)' }}>
{coach.name.charAt(0)}
</div>
<div className="flex-1">
<p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{coach.name}</p>
<p className="text-xs" style={{ color: 'var(--text-muted)' }}>{coach.email}</p>
</div>
{form.coach_id === coach.id && (
<CheckCircle2 size={20} style={{ color: 'var(--orange)', flexShrink: 0 }} />
)}
</button>
))
)}
</div>
)}

{/* STEP 3 — Conta */}
{step === 3 && (
<div className="space-y-4">
<div>
<label style={labelStyle}>Email</label>
<input type="email" value={form.email} onChange={e => set('email', e.target.value)} required
placeholder="o.teu@email.pt" style={inputStyle}
onFocus={e => e.target.style.borderColor = 'var(--orange)'}
onBlur={e => e.target.style.borderColor = 'var(--border)'} />
</div>
<div>
<label style={labelStyle}>Palavra-passe</label>
<input type="password" value={form.password} onChange={e => set('password', e.target.value)} required
placeholder="••••••••" minLength={6} style={inputStyle}
onFocus={e => e.target.style.borderColor = 'var(--orange)'}
onBlur={e => e.target.style.borderColor = 'var(--border)'} />
<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Mínimo 6 caracteres</p>
</div>

{/* Summary */}
<div className="rounded-2xl p-4 space-y-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
<p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Resumo</p>
{[
{ l: 'Nome', v: form.name },
{ l: 'Sexo', v: form.sex === 'M' ? 'Masculino' : 'Feminino' },
{ l: 'Modalidades', v: form.modalities.join(', ') },
{ l: 'PR 10km', v: form.pr_10km },
{ l: 'Grupo', v: autoGroup || '—' },
{ l: 'Treinador', v: coaches.find(c => c.id === form.coach_id)?.name || '—' },
].map(({ l, v }) => (
<div key={l} className="flex justify-between text-sm">
<span style={{ color: 'var(--text-muted)' }}>{l}</span>
<span className="font-semibold" style={{ color: l === 'Grupo' ? 'var(--orange)' : 'var(--text)' }}>{v}</span>
</div>
))}
</div>

{/* GDPR Consent */}
<div className="rounded-2xl p-4" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
<label className="flex items-start gap-3 cursor-pointer">
<input type="checkbox" checked={form.gdpr_consent} onChange={e => set('gdpr_consent', e.target.checked)}
className="mt-0.5 flex-shrink-0" style={{ accentColor: 'var(--orange)', width: 18, height: 18 }} />
<div>
<p className="text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>
Consentimento de utilização de dados
</p>
<p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
Autorizo o Run Tejo a recolher e tratar os meus dados pessoais (nome, email, NIF, data de nascimento, localização e dados desportivos) exclusivamente para fins de gestão de treinos, comunicação e análise de desempenho desportivo, em conformidade com o{' '}
<strong style={{ color: 'var(--text)' }}>Regulamento (UE) 2016/679 (RGPD)</strong> e a{' '}
<strong style={{ color: 'var(--text)' }}>Lei n.º 58/2019</strong>. Os dados não serão partilhados com terceiros sem consentimento explícito. Posso exercer os meus direitos de acesso, retificação e eliminação através do contacto com o clube.
</p>
</div>
</label>
</div>

{error && (
<div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
style={{ background: 'rgba(255,69,58,0.12)', color: '#FF453A' }}>
<AlertCircle size={15} /> {error}
</div>
)}
</div>
)}

{/* Navigation */}
<div className="flex gap-3 mt-8">
{step > 0 && (
<button type="button" onClick={() => setStep(s => s - 1)}
className="flex-1 py-4 rounded-xl text-sm font-bold"
style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}>
← Voltar
</button>
)}
{step < STEPS.length - 1 ? (
<button type="button"
onClick={() => canNext[step] && setStep(s => s + 1)}
className="flex-1 py-4 rounded-xl text-sm font-bold transition-all"
style={{
background: canNext[step] ? 'var(--orange)' : 'var(--surface)',
color: canNext[step] ? 'white' : 'var(--text-muted)',
border: canNext[step] ? 'none' : '1px solid var(--border)',
}}>
Continuar →
</button>
) : (
<button type="submit" disabled={loading || !canNext[step]}
className="flex-1 py-4 rounded-xl text-sm font-bold disabled:opacity-50"
style={{ background: 'var(--orange)', color: 'white' }}>
{loading ? 'A criar conta...' : 'Criar conta'}
</button>
)}
</div>
</form>

<p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
Já tens conta?{' '}
<Link to="/login" style={{ color: 'var(--orange)', fontWeight: 700 }}>Entrar</Link>
</p>
</div>
</div>
)
}
