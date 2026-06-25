import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { calculateZones, formatZoneRange, formatTime, parseTime } from '../../utils/pace'

const GROUP_COLORS = {
  G1: '#FF6B35', G2: '#F7C59F', G3: '#c8c89e',
  G4: '#4d9fd6', G5: '#1A936F', G6: '#88D498',
}

const ZONE_CONFIG = [
  { key: 'CCL', label: 'CCL', bg: 'rgba(48,209,88,0.12)', text: '#30D158' },
  { key: 'CCN', label: 'CCN', bg: 'rgba(255,214,10,0.12)', text: '#FFD60A' },
  { key: 'CCR', label: 'CCR', bg: 'rgba(255,69,58,0.12)', text: '#FF453A' },
]

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
      <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, maxWidth: '60%', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

export default function MyProfile() {
  const { athlete, signOut, refreshAthlete } = useAuth()
  const navigate = useNavigate()
  const [pr10, setPr10] = useState(athlete?.pr_10km ? formatTime(athlete.pr_10km) : '')
  const [pr5, setPr5] = useState(athlete?.pr_5km ? formatTime(athlete.pr_5km) : '')
  const [strava, setStrava] = useState(athlete?.strava_url || '')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)

  if (!athlete) return null

  const gc = GROUP_COLORS[athlete.group] || 'var(--text-muted)'
  const zones10 = athlete.pr_10km ? calculateZones(athlete.pr_10km, 10) : null
  const zones5 = athlete.pr_5km ? calculateZones(athlete.pr_5km, 5) : null

  async function handleSave() {
    const pr10s = pr10 ? parseTime(pr10) : null
    const pr5s = pr5 ? parseTime(pr5) : null
    if (pr10 && !pr10s) { setStatus({ ok: false, msg: 'Formato inválido. Use MM:SS' }); return }
    setSaving(true)
    const { error } = await supabase.from('athletes')
      .update({ pr_10km: pr10s, pr_5km: pr5s, strava_url: strava })
      .eq('id', athlete.id)
    setSaving(false)
    if (error) { setStatus({ ok: false, msg: error.message }); return }
    setStatus({ ok: true, msg: 'Guardado!' })
    await refreshAthlete()
    setTimeout(() => setStatus(null), 3000)
  }

  const inp = { style: { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '10px 12px', width: '100%', fontSize: 14, boxSizing: 'border-box' } }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px 100px' }}>
      {/* Avatar */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: gc + '33', border: `3px solid ${gc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28, fontWeight: 800, color: gc }}>
          {athlete.name?.[0]?.toUpperCase()}
        </div>
        <h2 style={{ color: 'var(--text)', fontWeight: 800, fontSize: 20 }}>{athlete.name}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{athlete.email}</p>
        <span style={{ display: 'inline-block', marginTop: 8, background: gc + '22', color: gc, fontWeight: 800, padding: '4px 14px', borderRadius: 20, fontSize: 13 }}>{athlete.group}</span>
      </div>

      {/* Dados pessoais */}
      <div className="feed-card p-4 mb-4">
        <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Dados pessoais</p>
        <InfoRow label="Sexo" value={athlete.sex === 'M' ? 'Masculino' : athlete.sex === 'F' ? 'Feminino' : null} />
        <InfoRow label="Data de nascimento" value={athlete.date_of_birth} />
        <InfoRow label="Nacionalidade" value={athlete.nationality} />
        <InfoRow label="Localidade" value={athlete.location} />
        <InfoRow label="Modalidades" value={athlete.modalities?.join(', ')} />
        <InfoRow label="Especializações" value={athlete.specializations?.join(', ')} />
        <InfoRow label="RGPD" value={athlete.gdpr_consent ? 'Aceite' : null} />
      </div>

      {/* Zonas de ritmo */}
      {(zones10 || zones5) && (
        <div className="feed-card p-4 mb-4">
          <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Zonas de ritmo</p>
          {[
            { zones: zones10, label: `10km (${formatTime(athlete.pr_10km)})` },
            { zones: zones5, label: `5km (${formatTime(athlete.pr_5km)})` },
          ].filter(x => x.zones).map(({ zones, label }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 8 }}>{label}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {ZONE_CONFIG.map(({ key, label: l, bg, text }) => (
                  <div key={key} style={{ background: bg, borderRadius: 10, padding: 10, textAlign: 'center' }}>
                    <p style={{ color: text, fontWeight: 800, fontSize: 11, marginBottom: 3 }}>{l}</p>
                    <p style={{ color: 'var(--text)', fontSize: 11, fontFamily: 'monospace' }}>{formatZoneRange(zones[key])}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editar */}
      <div className="feed-card p-4 mb-4">
        <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Atualizar dados</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 4 }}>PR 10km</label>
            <input {...inp} placeholder="35:00" value={pr10} onChange={e => setPr10(e.target.value)} />
          </div>
          <div>
            <label style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 4 }}>PR 5km</label>
            <input {...inp} placeholder="17:00" value={pr5} onChange={e => setPr5(e.target.value)} />
          </div>
        </div>
        <input {...inp} placeholder="URL Strava" value={strava} onChange={e => setStrava(e.target.value)} style={{ ...inp.style, marginBottom: 14 }} />
        {status && <p style={{ color: status.ok ? '#30D158' : '#FF453A', fontSize: 13, marginBottom: 10 }}>{status.msg}</p>}
        <button onClick={handleSave} disabled={saving}
          style={{ width: '100%', padding: 12, background: 'var(--orange)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'A guardar…' : 'Guardar alterações'}
        </button>
      </div>

      <button onClick={async () => { await signOut(); navigate('/') }}
        style={{ width: '100%', padding: 12, background: 'none', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-muted)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
        Terminar sessão
      </button>
    </div>
  )
}
