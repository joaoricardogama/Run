import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { getValidStravaToken, fetchStravaActivity } from '../../lib/strava'
import { ChevronLeft, MessageCircle, Send, ExternalLink, Heart, Zap, Clock, TrendingUp, Thermometer, Wind } from 'lucide-react'

// ── Polyline decoder ──────────────────────────────────────────
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

// ── Mapa da rota ──────────────────────────────────────────────
function RouteMap({ polyline }) {
  const coords = decodePolyline(polyline)
  if (coords.length < 2) return null
  const lats = coords.map(c => c[0]), lngs = coords.map(c => c[1])
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
  const W = 800, H = 380, pad = 40
  const toX = lng => pad + ((lng - minLng) / (maxLng - minLng || 0.001)) * (W - 2 * pad)
  const toY = lat => H - pad - ((lat - minLat) / (maxLat - minLat || 0.001)) * (H - 2 * pad)
  const d = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${toX(c[1]).toFixed(1)},${toY(c[0]).toFixed(1)}`).join(' ')
  const sx = toX(coords[0][1]).toFixed(1), sy = toY(coords[0][0]).toFixed(1)
  const ex = toX(coords[coords.length-1][1]).toFixed(1), ey = toY(coords[coords.length-1][0]).toFixed(1)
  return (
    <div style={{ background: 'linear-gradient(180deg,#0d1117,#111827)', borderRadius: 18, overflow: 'hidden', marginBottom: 20 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
        {/* Grid */}
        <defs>
          <pattern id="g2" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M50 0L0 0 0 50" fill="none" stroke="#fff" strokeWidth="0.4" opacity="0.04" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#g2)" />
        {/* Glow */}
        <path d={d} fill="none" stroke="rgba(184,255,0,0.12)" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke="rgba(184,255,0,0.3)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Rota */}
        <path d={d} fill="none" stroke="#B8FF00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Início */}
        <circle cx={sx} cy={sy} r="9" fill="#0d1117" stroke="#B8FF00" strokeWidth="3" />
        <circle cx={sx} cy={sy} r="4" fill="#B8FF00" />
        {/* Fim */}
        <circle cx={ex} cy={ey} r="9" fill="#0d1117" stroke="#FC4C02" strokeWidth="3" />
        <circle cx={ex} cy={ey} r="4" fill="#FC4C02" />
      </svg>
    </div>
  )
}

// ── Gráfico de barras (pace ou FC por km) ─────────────────────
function SplitChart({ splits, dataKey, color, label, fmt }) {
  if (!splits?.length) return null
  const values = splits.map(s => s[dataKey]).filter(Boolean)
  if (!values.length) return null
  const max = Math.max(...values), min = Math.min(...values)
  const range = max - min || 1
  const H = 80
  return (
    <div style={{ marginBottom: 4 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: H }}>
        {splits.map((s, i) => {
          const val = s[dataKey]
          if (!val) return null
          const h = Math.max(8, ((val - min) / range) * (H - 20) + 20)
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: 8, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{fmt(val)}</span>
              <div style={{ width: '100%', height: h, background: color, borderRadius: '4px 4px 2px 2px', opacity: 0.85 }} />
              <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>{i + 1}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────
const fmtPace = sec => sec ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}/km` : '–'
const fmtPaceShort = sec => sec ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : '–'
const fmtDuration = s => {
  if (!s) return '–'
  const m = Math.floor(s / 60), sec = s % 60
  if (m >= 60) return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}
const fmtTime = s => {
  if (!s) return '–'
  const m = Math.floor(s / 60), sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}
const fmtDate = str => {
  if (!str) return ''
  return new Date(str).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
const timeAgo = ts => {
  const diff = (Date.now() - new Date(ts)) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

// ── Stat grande ───────────────────────────────────────────────
function HeroStat({ value, unit, label, color = 'var(--text)' }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
      <p style={{ fontSize: 26, fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1, marginBottom: 2 }}>
        {value}
        {unit && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginLeft: 2 }}>{unit}</span>}
      </p>
      <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
    </div>
  )
}

// ── Zona de FC ────────────────────────────────────────────────
function hrZone(hr, maxHR = 190) {
  const pct = (hr / maxHR) * 100
  if (pct < 60) return { zone: 1, name: 'Recuperação', color: '#34C759' }
  if (pct < 70) return { zone: 2, name: 'Aeróbico', color: '#30D158' }
  if (pct < 80) return { zone: 3, name: 'Tempo', color: '#FFD60A' }
  if (pct < 90) return { zone: 4, name: 'Limiar', color: '#FF9F0A' }
  return { zone: 5, name: 'VO2Max', color: '#FF453A' }
}

// ── Compliance treino ─────────────────────────────────────────
function ComplianceBadge({ plan, activity }) {
  if (!plan) return null
  const targetDist = plan.distance_km || 0
  const actualDist = Number(activity.distance_km) || 0
  const diff = targetDist > 0 ? Math.abs(actualDist - targetDist) / targetDist : 0
  const ok = diff <= 0.15 || targetDist === 0
  return (
    <div style={{
      background: ok ? 'rgba(52,199,89,0.10)' : 'rgba(255,159,10,0.10)',
      border: `1px solid ${ok ? 'rgba(52,199,89,0.25)' : 'rgba(255,159,10,0.25)'}`,
      borderRadius: 14, padding: '12px 14px', marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{ok ? '✅' : '⚠️'}</span>
        <p style={{ fontSize: 13, fontWeight: 800, color: ok ? '#34C759' : '#FF9F0A' }}>
          {ok ? 'Plano cumprido' : 'Desvio do plano'}
        </p>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
        📋 <strong style={{ color: 'var(--text)' }}>{plan.session_label}</strong>
        {plan.details ? ` — ${plan.details}` : ''}
      </p>
      {targetDist > 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Meta: <strong style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{targetDist} km</strong>
          {' · '}Feito: <strong style={{ color: ok ? '#34C759' : '#FF9F0A', fontFamily: 'monospace' }}>{actualDist.toFixed(2)} km</strong>
        </p>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function ActivityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { athlete, refreshAthlete } = useAuth()

  const [activity, setActivity] = useState(null)
  const [stravaDetail, setStravaDetail] = useState(null)
  const [plan, setPlan] = useState(null)
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showComments, setShowComments] = useState(false)

  useEffect(() => {
    if (!id || !athlete?.id) return
    async function load() {
      // 1. Carregar atividade da DB
      const { data: act } = await supabase
        .from('training_completions')
        .select('*')
        .eq('id', id)
        .eq('athlete_id', athlete.id)
        .single()

      if (!act) { navigate('/atividades'); return }
      setActivity(act)

      // 2. Plano do dia
      if (act.date) {
        const d = new Date(act.date + 'T00:00')
        const dayOfWeek = d.getDay() // 0=Dom
        const weekStart = new Date(d)
        weekStart.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
        const ws = weekStart.toISOString().split('T')[0]
        const { data: planData } = await supabase
          .from('athlete_weekly_plans')
          .select('*')
          .eq('athlete_id', athlete.id)
          .eq('week_start', ws)
          .eq('day_of_week', dayOfWeek === 0 ? 7 : dayOfWeek)
          .maybeSingle()
        setPlan(planData)
      }

      // 3. Comentários
      const { data: comms } = await supabase
        .from('training_comments')
        .select('*')
        .eq('completion_id', id)
        .order('created_at')
      setComments(comms || [])

      // 4. Strava detalhe (splits, calorias, etc.)
      if (act.strava_activity_id && athlete.strava_access_token) {
        try {
          const token = await getValidStravaToken(athlete, refreshAthlete)
          if (token) {
            const detail = await fetchStravaActivity(act.strava_activity_id, token)
            if (detail && !detail.errors) setStravaDetail(detail)
          }
        } catch (e) {
          console.warn('Strava fetch failed:', e)
        }
      }

      setLoading(false)
    }
    load()
  }, [id, athlete?.id])

  async function postComment() {
    if (!text.trim() || posting || !activity) return
    setPosting(true)
    await supabase.from('training_comments').insert({
      completion_id: activity.id,
      athlete_id: athlete.id,
      author_email: athlete.email,
      author_name: athlete.name || athlete.email,
      author_role: 'athlete',
      content: text.trim(),
    })
    setText('')
    const { data } = await supabase.from('training_comments').select('*').eq('completion_id', id).order('created_at')
    setComments(data || [])
    setPosting(false)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>A carregar…</p>
      </div>
    )
  }
  if (!activity) return null

  // Splits do Strava (splits_metric = por km)
  const splits = stravaDetail?.splits_metric || []
  // Converter splits para pace e fc por km
  const splitsEnriched = splits.map((s, i) => ({
    km: i + 1,
    time: s.moving_time,
    pace: s.average_speed > 0 ? Math.round(1000 / s.average_speed) : null,
    hr: s.average_heartrate ? Math.round(s.average_heartrate) : null,
    elev: s.elevation_difference ? Math.round(s.elevation_difference) : null,
    dist: s.distance,
  }))

  const hrZoneData = activity.hr_avg ? hrZone(activity.hr_avg) : null
  const maxHR = stravaDetail?.max_heartrate || null
  const calories = stravaDetail?.calories || stravaDetail?.kilojoules ? Math.round((stravaDetail.kilojoules || 0) * 0.239) : null
  const cadence = stravaDetail?.average_cadence ? Math.round(stravaDetail.average_cadence * 2) : null // spm
  const temp = stravaDetail?.weather_temperature || null
  const deviceName = stravaDetail?.device_name || null
  const startLocal = stravaDetail?.start_date_local || (activity.date + 'T00:00:00')
  const locationCity = stravaDetail?.location_city || stravaDetail?.start_latlng ? null : null

  return (
    <div style={{ padding: '0 0 100px', maxWidth: 480, margin: '0 auto' }}>
      {/* Header fixo */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--dark)', borderBottom: '1px solid var(--border)',
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text)', display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={22} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activity.strava_name || activity.session_label || 'Treino'}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {new Date(startLocal).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        {activity.strava_activity_id && (
          <a href={`https://www.strava.com/activities/${activity.strava_activity_id}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#FC4C02', background: 'rgba(252,76,2,0.10)', border: '1px solid rgba(252,76,2,0.2)', borderRadius: 8, padding: '5px 10px', textDecoration: 'none' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#FC4C02"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" /></svg>
            Strava
          </a>
        )}
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        {/* Hero stats */}
        <div style={{ display: 'flex', gap: 1, background: 'var(--surface)', borderRadius: 18, padding: '16px 8px', marginBottom: 20, border: '1px solid var(--border)' }}>
          <HeroStat value={activity.distance_km ? Number(activity.distance_km).toFixed(2) : '–'} unit="km" label="Distância" />
          <div style={{ width: 1, background: 'var(--border)' }} />
          <HeroStat value={fmtDuration(activity.duration_s)} label="Tempo" />
          <div style={{ width: 1, background: 'var(--border)' }} />
          <HeroStat value={fmtPaceShort(activity.pace_avg)} unit="/km" label="Ritmo" color="#B8FF00" />
          {activity.hr_avg && (
            <>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <HeroStat value={activity.hr_avg} unit="bpm" label="FC Média" color="#FF453A" />
            </>
          )}
        </div>

        {/* Mapa */}
        {activity.map_polyline && <RouteMap polyline={activity.map_polyline} />}

        {/* Compliance plano */}
        <ComplianceBadge plan={plan} activity={activity} />

        {/* Stats secundárias */}
        <div style={{ background: 'var(--surface)', borderRadius: 18, padding: 16, marginBottom: 20, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            ESTATÍSTICAS
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Elevação', value: activity.elevation_m > 0 ? `+${activity.elevation_m} m` : null, color: '#34C759' },
              { label: 'Calorias', value: calories ? `${calories} kcal` : null, color: 'var(--text)' },
              { label: 'FC Máxima', value: maxHR ? `${maxHR} bpm` : null, color: '#FF453A' },
              { label: 'Cadência', value: cadence ? `${cadence} spm` : null, color: 'var(--text)' },
              { label: 'Temperatura', value: temp != null ? `${temp}°C` : null, color: '#30D158' },
              { label: 'Dispositivo', value: deviceName || null, color: 'var(--text-muted)' },
            ].filter(s => s.value).map(s => (
              <div key={s.label} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{s.label}</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.value}</p>
              </div>
            ))}
            {hrZoneData && (
              <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Zona FC</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: hrZoneData.color, fontFamily: 'monospace' }}>
                  Z{hrZoneData.zone} <span style={{ fontSize: 11, fontWeight: 600 }}>{hrZoneData.name}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Gráficos de splits */}
        {splitsEnriched.length > 0 && (
          <div style={{ background: 'var(--surface)', borderRadius: 18, padding: 16, marginBottom: 20, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
              RITMO POR KM
            </p>
            <SplitChart
              splits={splitsEnriched}
              dataKey="pace"
              color="#B8FF00"
              label=""
              fmt={v => `${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`}
            />
            {splitsEnriched.some(s => s.hr) && (
              <>
                <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
                <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                  FC POR KM
                </p>
                <SplitChart
                  splits={splitsEnriched}
                  dataKey="hr"
                  color="#FF453A"
                  label=""
                  fmt={v => `${v}`}
                />
              </>
            )}
          </div>
        )}

        {/* Tabela de splits */}
        {splitsEnriched.length > 0 && (
          <div style={{ background: 'var(--surface)', borderRadius: 18, overflow: 'hidden', marginBottom: 20, border: '1px solid var(--border)' }}>
            <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1 }}>PARCIAIS</p>
            </div>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr 1fr 1fr', gap: 0, padding: '8px 16px', background: 'var(--surface2)' }}>
              {['KM','TEMPO','RITMO','FC','ELEV.'].map(h => (
                <p key={h} style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: h === 'KM' ? 'left' : 'right' }}>{h}</p>
              ))}
            </div>
            {splitsEnriched.map((s, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '30px 1fr 1fr 1fr 1fr', gap: 0,
                padding: '10px 16px', borderTop: '1px solid var(--border)',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
              }}>
                <p style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-muted)' }}>{s.km}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace', textAlign: 'right' }}>{fmtTime(s.time)}</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#B8FF00', fontFamily: 'monospace', textAlign: 'right' }}>{fmtPaceShort(s.pace)}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: s.hr ? '#FF453A' : 'var(--text-muted)', fontFamily: 'monospace', textAlign: 'right' }}>{s.hr || '–'}</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: s.elev > 0 ? '#34C759' : s.elev < 0 ? '#FF453A' : 'var(--text-muted)', fontFamily: 'monospace', textAlign: 'right' }}>
                  {s.elev != null ? (s.elev > 0 ? `+${s.elev}` : s.elev) : '–'}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Comentários */}
        <div style={{ background: 'var(--surface)', borderRadius: 18, overflow: 'hidden', marginBottom: 20, border: '1px solid var(--border)' }}>
          <button onClick={() => setShowComments(o => !o)} style={{
            width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontSize: 13, fontWeight: 700,
          }}>
            <MessageCircle size={15} color="#5E5CE6" />
            Comentários do treinador
            {comments.length > 0 && (
              <span style={{ fontSize: 10, background: '#5E5CE6', color: '#fff', borderRadius: 8, padding: '2px 7px', fontWeight: 800 }}>
                {comments.length}
              </span>
            )}
          </button>

          {showComments && (
            <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)' }}>
              {comments.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '12px 0', fontStyle: 'italic' }}>
                  O teu treinador pode deixar feedback aqui.
                </p>
              )}
              {comments.map(c => (
                <div key={c.id} style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: c.author_role === 'coach' ? 'rgba(94,92,230,0.15)' : 'rgba(184,255,0,0.10)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 900,
                    color: c.author_role === 'coach' ? '#5E5CE6' : 'var(--orange)',
                  }}>
                    {c.author_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: c.author_role === 'coach' ? '#5E5CE6' : 'var(--orange)' }}>
                        {c.author_role === 'coach' ? '🏅 ' : ''}{c.author_name}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{timeAgo(c.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>{c.content}</p>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <input
                  value={text} onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && postComment()}
                  placeholder="Responder…"
                  style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none' }}
                />
                <button onClick={postComment} disabled={!text.trim() || posting} style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: text.trim() ? '#5E5CE6' : 'var(--surface2)',
                  border: 'none', cursor: text.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Send size={14} color={text.trim() ? '#fff' : 'var(--text-muted)'} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
