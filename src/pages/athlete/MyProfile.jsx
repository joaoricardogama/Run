import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { calculateZones, formatZoneRange, formatTime, parseTime } from '../../utils/pace'
import { CheckCircle2, AlertCircle, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const GROUP_COLORS = {
  G1: { bg: 'rgba(48,209,88,0.12)',  text: '#30D158' },
  G2: { bg: 'rgba(10,132,255,0.12)', text: '#0A84FF' },
  G3: { bg: 'rgba(255,214,10,0.12)', text: '#FFD60A' },
  G4: { bg: 'rgba(255,159,10,0.12)', text: '#FF9F0A' },
  G5: { bg: 'rgba(255,69,58,0.12)',  text: '#FF453A' },
  G6: { bg: 'rgba(191,90,242,0.12)', text: '#BF5AF2' },
}

const ZONE_CONFIG = [
  { key: 'CCL', label: 'CCL — Corrida Contínua Leve',   text: '#30D158', bg: 'rgba(48,209,88,0.08)' },
  { key: 'CCN', label: 'CCN — Corrida Contínua Normal', text: '#FFD60A', bg: 'rgba(255,214,10,0.08)' },
  { key: 'CCR', label: 'CCR — Corrida Contínua Rápida', text: '#FF453A', bg: 'rgba(255,69,58,0.08)' },
]

const inputStyle = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 14,
  width: '100%',
  outline: 'none',
}
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6,
}

function ZonesDisplay({ prSeconds, distanceKm, label }) {
  if (!prSeconds || !distanceKm) return null
  const zones = calculateZones(prSeconds, distanceKm)
  if (!zones) return null
  return (
    <div className="feed-card p-4">
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
        {label} — Zonas de ritmo
      </p>
      <div className="space-y-2">
        {ZONE_CONFIG.map(({ key, label: zLabel, text, bg }) => (
          <div key={key} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: bg }}>
            <span className="text-xs font-bold" style={{ color: text }}>{key}</span>
            <span className="pace-mono text-sm font-medium" style={{ color: 'var(--text)' }}>{formatZoneRange(zones[key])}</span>
          </div>
        ))}
      </div>
      <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
        Ritmo base: <span className="pace-mono">{formatTime(Math.round(zones.base))}/km</span>
      </p>
    </div>
  )
}

export default function MyProfile() {
  const { athlete, refreshAthlete, signOut } = useAuth()
  const navigate = useNavigate()
  const [pr5Field, setPr5Field] = useState(athlete?.pr_5km ? formatTime(athlete.pr_5km) : '')
  const [pr10Field, setPr10Field] = useState(athlete?.pr_10km ? formatTime(athlete.pr_10km) : '')
  const [stravaUrl, setStravaUrl] = useState(athlete?.strava_url || '')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)

  if (!athlete) return null

  const grpClr = GROUP_COLORS[athlete.group] || GROUP_COLORS.G1

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setStatus(null)
    const pr5 = parseTime(pr5Field)
    const pr10 = parseTime(pr10Field)
    if (pr5Field && !pr5) { setStatus({ type: 'error', msg: 'Formato inválido para PR 5km (use MM:SS)' }); setSaving(false); return }
    if (pr10Field && !pr10) { setStatus({ type: 'error', msg: 'Formato inválido para PR 10km (use MM:SS)' }); setSaving(false); return }
    const { error } = await supabase.from('athletes').update({ pr_5km: pr5 || null, pr_10km: pr10 || null, strava_url: stravaUrl || null }).eq('id', athlete.id)
    if (error) { setStatus({ type: 'error', msg: 'Erro ao guardar: ' + error.message }) }
    else { await refreshAthlete(); setStatus({ type: 'success', msg: 'Perfil guardado com sucesso!' }) }
    setSaving(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-28" style={{ background: 'var(--dark)', minHeight: '100vh' }}>
      <h2 className="text-xl font-black mb-5" style={{ color: 'var(--text)' }}>O Meu Perfil</h2>

      {/* Avatar card */}
      <div className="feed-card p-4 mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0"
          style={{ background: grpClr.bg, color: grpClr.text }}>
          {athlete.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-base" style={{ color: 'var(--text)' }}>{athlete.name}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{athlete.email}</p>
          <span className="inline-block mt-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: grpClr.bg, color: grpClr.text }}>
            Grupo {athlete.group || '—'}
          </span>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="feed-card p-4 mb-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>PR 5km (MM:SS)</label>
            <input type="text" value={pr5Field} onChange={e => setPr5Field(e.target.value)}
              placeholder="22:30" className="pace-mono" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          <div>
            <label style={labelStyle}>PR 10km (MM:SS)</label>
            <input type="text" value={pr10Field} onChange={e => setPr10Field(e.target.value)}
              placeholder="48:00" className="pace-mono" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Perfil Strava</label>
          <input type="url" value={stravaUrl} onChange={e => setStravaUrl(e.target.value)}
            placeholder="https://www.strava.com/athletes/..." style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--orange)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>

        {status && (
          <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3"
            style={{
              background: status.type === 'success' ? 'rgba(48,209,88,0.12)' : 'rgba(255,69,58,0.12)',
              color: status.type === 'success' ? '#30D158' : '#FF453A',
            }}>
            {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {status.msg}
          </div>
        )}

        <button type="submit" disabled={saving}
          className="w-full py-3.5 rounded-xl text-sm font-bold disabled:opacity-50"
          style={{ background: 'var(--orange)', color: 'white' }}>
          {saving ? 'A guardar...' : 'Guardar'}
        </button>
      </form>

      {/* Pace zones */}
      <div className="space-y-3 mb-5">
        {athlete.pr_5km && <ZonesDisplay prSeconds={athlete.pr_5km} distanceKm={5} label="PR 5km" />}
        {athlete.pr_10km && <ZonesDisplay prSeconds={athlete.pr_10km} distanceKm={10} label="PR 10km" />}
        {!athlete.pr_5km && !athlete.pr_10km && (
          <p className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>
            Introduz os teus PRs para ver as zonas de ritmo calculadas.
          </p>
        )}
      </div>

      {/* Sign out */}
      <button onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold"
        style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
        <LogOut size={16} /> Terminar sessão
      </button>
    </div>
  )
}
