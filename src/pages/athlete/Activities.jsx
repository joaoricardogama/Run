import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { ChevronRight, Filter } from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────
function decodePolyline(str) {
  if (!str) return []
  let index = 0, lat = 0, lng = 0
  const result = []
  while (index < str.length) {
    let b, shift = 0, res = 0
    do { b = str.charCodeAt(index++) - 63; res |= (b & 0x1f) << shift; shift += 5 } while (b >= 32)
    lat += (res & 1) ? ~(res >> 1) : (res >> 1)
    shift = 0; res = 0
    do { b = str.charCodeAt(index++) - 63; res |= (b & 0x1f) << shift; shift += 5 } while (b >= 32)
    lng += (res & 1) ? ~(res >> 1) : (res >> 1)
    result.push([lat / 1e5, lng / 1e5])
  }
  return result
}

function RouteThumb({ polyline }) {
  const coords = decodePolyline(polyline)
  if (coords.length < 2) {
    return (
      <div style={{ width: 64, height: 64, borderRadius: 12, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 24 }}>🏃</span>
      </div>
    )
  }
  const lats = coords.map(c => c[0]), lngs = coords.map(c => c[1])
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
  const W = 200, H = 200, pad = 16
  const toX = lng => pad + ((lng - minLng) / (maxLng - minLng || 0.001)) * (W - 2 * pad)
  const toY = lat => H - pad - ((lat - minLat) / (maxLat - minLat || 0.001)) * (H - 2 * pad)
  const d = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${toX(c[1]).toFixed(1)},${toY(c[0]).toFixed(1)}`).join(' ')
  return (
    <div style={{ width: 64, height: 64, borderRadius: 12, background: '#0d1117', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(184,255,0,0.15)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
        <path d={d} fill="none" stroke="rgba(184,255,0,0.25)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke="#B8FF00" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function fmtPace(sec) {
  if (!sec) return '–'
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}/km`
}
function fmtDuration(s) {
  if (!s) return '–'
  const m = Math.floor(s / 60)
  if (m >= 60) return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`
  return `${m}min`
}
function fmtDate(str) {
  if (!str) return ''
  const d = new Date(str + 'T00:00')
  return d.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
function sportIcon(type) {
  const map = { Run: '🏃', TrailRun: '🏔️', Walk: '🚶', Ride: '🚴', Swim: '🏊', Workout: '💪' }
  return map[type] || '🏃'
}

const PERIODS = [
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
  { label: 'Tudo', days: 9999 },
]

export default function Activities() {
  const { athlete } = useAuth()
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)

  useEffect(() => {
    if (!athlete?.id) return
    setLoading(true)
    const since = new Date(Date.now() - period * 86400000).toISOString().split('T')[0]
    supabase
      .from('training_completions')
      .select('*')
      .eq('athlete_id', athlete.id)
      .gte('date', since)
      .order('date', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setActivities(data || [])
        setLoading(false)
      })
  }, [athlete?.id, period])

  // Totais do período
  const totals = activities.reduce((acc, a) => ({
    km: acc.km + (Number(a.distance_km) || 0),
    time: acc.time + (a.duration_s || 0),
    count: acc.count + 1,
  }), { km: 0, time: 0, count: 0 })

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>Atividades</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        {athlete?.name || 'Atleta'} · {activities.length} treinos
      </p>

      {/* Filtro período */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {PERIODS.map(p => (
          <button key={p.days} onClick={() => setPeriod(p.days)} style={{
            flex: 1, padding: '7px 4px', borderRadius: 10, fontSize: 11, fontWeight: 700,
            border: `1px solid ${period === p.days ? 'var(--orange)' : 'var(--border)'}`,
            background: period === p.days ? 'rgba(184,255,0,0.10)' : 'var(--surface)',
            color: period === p.days ? 'var(--orange)' : 'var(--text-muted)',
            cursor: 'pointer',
          }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Totais */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'Treinos', value: totals.count },
          { label: 'Distância', value: `${totals.km.toFixed(1)} km` },
          { label: 'Tempo', value: fmtDuration(totals.time) },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: 'var(--surface)', borderRadius: 12, padding: '12px 8px', textAlign: 'center', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--orange)', marginBottom: 2 }}>{s.value}</p>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>A carregar…</p>
      ) : activities.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40, fontSize: 14 }}>
          Nenhuma atividade neste período.<br />Sincroniza o Strava no Dashboard.
        </p>
      ) : (
        activities.map(act => (
          <div key={act.id}
            onClick={() => navigate(`/atividades/${act.id}`)}
            style={{
              display: 'flex', gap: 12, alignItems: 'center',
              background: 'var(--surface)', borderRadius: 14, padding: 12, marginBottom: 10,
              border: '1px solid var(--border)', cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(184,255,0,0.3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <RouteThumb polyline={act.map_polyline} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 13 }}>{sportIcon(act.strava_type)}</span>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {act.strava_name || act.session_label || 'Treino'}
                </p>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{fmtDate(act.date)}</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {act.distance_km && (
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', fontFamily: 'monospace' }}>
                    {Number(act.distance_km).toFixed(2)} <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>km</span>
                  </span>
                )}
                {act.pace_avg && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#B8FF00', fontFamily: 'monospace' }}>
                    {fmtPace(act.pace_avg)}
                  </span>
                )}
                {act.hr_avg && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#FF453A', fontFamily: 'monospace' }}>
                    ♥ {act.hr_avg}
                  </span>
                )}
              </div>
            </div>

            <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          </div>
        ))
      )}
    </div>
  )
}
