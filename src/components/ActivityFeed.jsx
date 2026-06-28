import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MessageCircle, Send, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react'

// ── Strava polyline decoder ───────────────────────────────────
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

// ── Route preview (SVG, sem dependências externas) ───────────
function RoutePreview({ polyline }) {
  const coords = decodePolyline(polyline)
  if (coords.length < 2) return null

  const lats = coords.map(c => c[0])
  const lngs = coords.map(c => c[1])
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)

  const W = 800, H = 320
  const pad = 30

  // Manter proporção real da rota
  const latRange = maxLat - minLat || 0.001
  const lngRange = maxLng - minLng || 0.001
  const aspectRatio = lngRange / latRange
  const drawW = W - 2 * pad
  const drawH = H - 2 * pad

  const toX = lng => pad + ((lng - minLng) / lngRange) * drawW
  const toY = lat => H - pad - ((lat - minLat) / latRange) * drawH

  const d = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${toX(c[1]).toFixed(1)},${toY(c[0]).toFixed(1)}`)
    .join(' ')

  const startX = toX(coords[0][1]), startY = toY(coords[0][0])
  const endX = toX(coords[coords.length - 1][1]), endY = toY(coords[coords.length - 1][0])

  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(180deg, #0d1117 0%, #111827 100%)',
      borderRadius: '16px 16px 0 0',
      overflow: 'hidden',
      height: 160,
    }}>
      {/* Grid decorativo */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04 }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Rota */}
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {/* Glow */}
        <path d={d} fill="none" stroke="rgba(184,255,0,0.15)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke="rgba(184,255,0,0.35)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        {/* Linha principal */}
        <path d={d} fill="none" stroke="#B8FF00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Início */}
        <circle cx={startX.toFixed(1)} cy={startY.toFixed(1)} r="7" fill="#1a1a2e" stroke="#B8FF00" strokeWidth="3" />
        <circle cx={startX.toFixed(1)} cy={startY.toFixed(1)} r="3" fill="#B8FF00" />
        {/* Fim */}
        <circle cx={endX.toFixed(1)} cy={endY.toFixed(1)} r="7" fill="#1a1a2e" stroke="#FC4C02" strokeWidth="3" />
        <circle cx={endX.toFixed(1)} cy={endY.toFixed(1)} r="3" fill="#FC4C02" />
      </svg>

      {/* Badge Strava no canto */}
      <div style={{
        position: 'absolute', top: 10, right: 10,
        background: 'rgba(252,76,2,0.85)', backdropFilter: 'blur(8px)',
        borderRadius: 8, padding: '3px 8px',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <StravaIcon size={11} />
        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>STRAVA</span>
      </div>
    </div>
  )
}

// ── Ícone Strava ──────────────────────────────────────────────
function StravaIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FC4C02">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  )
}

// ── Formatters ────────────────────────────────────────────────
function fmtPace(secPerKm) {
  if (!secPerKm) return null
  return `${Math.floor(secPerKm / 60)}:${String(secPerKm % 60).padStart(2, '0')}`
}
function fmtDuration(s) {
  if (!s) return null
  const m = Math.floor(s / 60), sec = s % 60
  if (m >= 60) return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}
function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00')
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return d.toLocaleDateString('pt-PT', { weekday: 'long' })
  return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
}
function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}
function sportLabel(type) {
  const map = { Run: 'Corrida', TrailRun: 'Trail', Walk: 'Caminhada', Ride: 'Ciclismo', Swim: 'Natação', VirtualRun: 'Virtual', Workout: 'Treino' }
  return map[type] || type || 'Treino'
}

// ── Stat chip ─────────────────────────────────────────────────
function Stat({ icon, label, value, unit, color = 'var(--text)' }) {
  if (!value) return null
  return (
    <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 2 }}>
        {icon}
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</span>
      </div>
      <p style={{ fontSize: 15, fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1 }}>
        {value}
        {unit && <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', marginLeft: 1 }}>{unit}</span>}
      </p>
    </div>
  )
}

// ── Activity card ─────────────────────────────────────────────
function ActivityCard({ activity, athlete, authorName, onClick }) {
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState([])
  const [loadingC, setLoadingC] = useState(false)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

  async function loadComments() {
    if (loadingC) return
    setLoadingC(true)
    const { data } = await supabase
      .from('training_comments')
      .select('*')
      .eq('completion_id', activity.id)
      .order('created_at')
    setComments(data || [])
    setLoadingC(false)
  }

  function toggleComments() {
    if (!open) loadComments()
    setOpen(o => !o)
  }

  async function postComment() {
    if (!text.trim() || posting) return
    setPosting(true)
    await supabase.from('training_comments').insert({
      completion_id: activity.id,
      athlete_id: athlete.id,
      author_email: athlete.email,
      author_name: authorName,
      author_role: 'athlete',
      content: text.trim(),
    })
    setText('')
    await loadComments()
    setPosting(false)
  }

  const hasMap = !!activity.map_polyline
  const hasStats = activity.distance_km || activity.pace_avg || activity.duration_s || activity.hr_avg || activity.elevation_m

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 18,
      border: '1px solid var(--border)',
      overflow: 'hidden',
      marginBottom: 14,
      cursor: onClick ? 'pointer' : 'default',
    }}>
      {/* Mapa da rota */}
      {hasMap && <div onClick={onClick}><RoutePreview polyline={activity.map_polyline} /></div>}

      {/* Header */}
      <div style={{ padding: '14px 16px 0' }} onClick={onClick}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
          {/* Ícone do desporto */}
          <div style={{
            width: 40, height: 40, borderRadius: 11, flexShrink: 0,
            background: hasMap ? 'rgba(252,76,2,0.12)' : 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {activity.confirmed_by_strava
              ? <StravaIcon size={20} />
              : <span style={{ fontSize: 20 }}>🏃</span>}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
              {activity.strava_name || activity.session_label || 'Treino'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(activity.date)}</span>
              {activity.strava_type && (
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#FC4C02',
                  background: 'rgba(252,76,2,0.10)', borderRadius: 6, padding: '2px 6px',
                }}>
                  {sportLabel(activity.strava_type)}
                </span>
              )}
            </div>
          </div>

          <span style={{
            fontSize: 11, fontWeight: 800, color: 'var(--orange)',
            background: 'rgba(184,255,0,0.10)', padding: '3px 9px', borderRadius: 8, flexShrink: 0,
          }}>
            +{activity.points} pts
          </span>
        </div>

        {/* Stats */}
        {hasStats && (
          <div style={{
            display: 'flex', gap: 4, marginBottom: 14,
            background: 'var(--surface2)', borderRadius: 12, padding: '12px 8px',
          }}>
            <Stat
              label="Distância"
              value={activity.distance_km ? Number(activity.distance_km).toFixed(2) : null}
              unit="km"
              color="var(--text)"
            />
            {(activity.distance_km || activity.pace_avg) && <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />}
            <Stat
              label="Ritmo"
              value={fmtPace(activity.pace_avg)}
              unit="/km"
              color="#B8FF00"
            />
            {activity.duration_s && <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />}
            <Stat
              label="Tempo"
              value={fmtDuration(activity.duration_s)}
              color="var(--text)"
            />
            {activity.hr_avg && <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />}
            <Stat
              label="FC"
              value={activity.hr_avg}
              unit="bpm"
              color="#FF453A"
            />
            {activity.elevation_m > 0 && <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />}
            <Stat
              label="Elev."
              value={activity.elevation_m > 0 ? `+${activity.elevation_m}` : null}
              unit="m"
              color="#34C759"
            />
          </div>
        )}
      </div>

      {/* Último comentário do treinador */}
      {!open && activity._latestCoachComment && (
        <div style={{
          margin: '0 16px 12px',
          padding: '10px 12px',
          background: 'rgba(94,92,230,0.08)',
          borderRadius: 10,
          border: '1px solid rgba(94,92,230,0.2)',
        }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: '#5E5CE6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
            🏅 Treinador
          </p>
          <p style={{ fontSize: 13, color: 'var(--text)', fontStyle: 'italic', lineHeight: 1.4 }}>
            "{activity._latestCoachComment}"
          </p>
        </div>
      )}

      {/* Toggle comentários */}
      <button onClick={toggleComments} style={{
        width: '100%', padding: '10px 16px',
        background: 'none', border: 'none', borderTop: '1px solid var(--border)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        color: 'var(--text-muted)', fontSize: 12, fontWeight: 600,
      }}>
        <MessageCircle size={13} />
        {open
          ? 'Fechar'
          : `Comentários${activity._commentCount > 0 ? ` (${activity._commentCount})` : ''}`}
        {open
          ? <ChevronUp size={13} style={{ marginLeft: 'auto' }} />
          : <ChevronDown size={13} style={{ marginLeft: 'auto' }} />}
      </button>

      {/* Secção de comentários */}
      {open && (
        <div style={{ padding: '0 16px 14px' }}>
          {loadingC
            ? <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>A carregar…</p>
            : (
              <>
                {comments.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '12px 0', fontStyle: 'italic' }}>
                    O teu treinador pode deixar feedback aqui.
                  </p>
                )}
                {comments.map(c => (
                  <div key={c.id} style={{ marginBottom: 10, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                      background: c.author_role === 'coach' ? 'rgba(94,92,230,0.15)' : 'rgba(255,107,53,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 900,
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
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && postComment()}
                    placeholder="Responder ao treinador…"
                    style={{
                      flex: 1, background: 'var(--surface2)',
                      border: '1px solid var(--border)', color: 'var(--text)',
                      borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none',
                    }}
                  />
                  <button onClick={postComment} disabled={!text.trim() || posting} style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: text.trim() ? 'var(--orange)' : 'var(--surface2)',
                    border: 'none', cursor: text.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Send size={14} color={text.trim() ? '#fff' : 'var(--text-muted)'} />
                  </button>
                </div>
              </>
            )}
        </div>
      )}
    </div>
  )
}

// ── Feed principal ────────────────────────────────────────────
export default function ActivityFeed({ athlete, limit = 3 }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!athlete?.id) return
    async function load() {
      const since = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]
      const { data } = await supabase
        .from('training_completions')
        .select('*')
        .eq('athlete_id', athlete.id)
        .gte('date', since)
        .order('date', { ascending: false })
        .limit(limit)

      if (!data?.length) { setActivities([]); setLoading(false); return }

      const ids = data.map(a => a.id)
      const { data: allComments } = await supabase
        .from('training_comments')
        .select('*')
        .in('completion_id', ids)
        .order('created_at')

      const enriched = data.map(act => {
        const actComments = (allComments || []).filter(c => c.completion_id === act.id)
        const coachComments = actComments.filter(c => c.author_role === 'coach')
        return {
          ...act,
          _commentCount: actComments.length,
          _latestCoachComment: coachComments[coachComments.length - 1]?.content || null,
        }
      })

      setActivities(enriched)
      setLoading(false)
    }
    load()
  }, [athlete?.id])

  if (loading || !activities.length) return null

  const authorName = athlete.name || athlete.email?.split('@')[0] || 'Atleta'

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          ATIVIDADES
        </p>
        <button onClick={() => navigate('/atividades')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 3,
          fontSize: 12, fontWeight: 700, color: 'var(--orange)',
        }}>
          Ver todas <ChevronRight size={13} />
        </button>
      </div>
      {activities.map(act => (
        <ActivityCard
          key={act.id}
          activity={act}
          athlete={athlete}
          authorName={authorName}
          onClick={() => navigate(`/atividades/${act.id}`)}
        />
      ))}
    </div>
  )
}
