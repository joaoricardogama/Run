import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MessageCircle, Send, ChevronDown, ChevronUp } from 'lucide-react'

function StravaIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FC4C02">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  )
}

function fmtPace(secPerKm) {
  if (!secPerKm) return null
  return `${Math.floor(secPerKm / 60)}:${String(secPerKm % 60).padStart(2, '0')}/km`
}
function fmtDuration(s) {
  if (!s) return null
  const m = Math.floor(s / 60), sec = s % 60
  if (m >= 60) {
    const h = Math.floor(m / 60)
    return `${h}h ${String(m % 60).padStart(2, '0')}m`
  }
  return `${m}m ${String(sec).padStart(2, '0')}s`
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

// ── Single activity card ──────────────────────────────────────
function ActivityCard({ activity, athlete, authorName, authorRole }) {
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
      author_role: authorRole,
      content: text.trim(),
    })
    setText('')
    await loadComments()
    setPosting(false)
  }

  const isStrava = activity.confirmed_by_strava || activity.source === 'strava'
  const hasStats = activity.distance_km || activity.duration_s || activity.pace_avg

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 12 }}>
      {/* Header */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: hasStats ? 12 : 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: isStrava ? 'rgba(252,76,2,0.12)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isStrava ? <StravaIcon size={20} /> : <span style={{ fontSize: 18 }}>🏃</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activity.strava_name || activity.session_label || 'Treino'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {fmtDate(activity.date)}
              {activity.strava_type && <span style={{ color: '#FC4C02', fontWeight: 600 }}>· {activity.strava_type}</span>}
            </p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', background: 'rgba(255,107,53,0.12)', padding: '3px 8px', borderRadius: 8, flexShrink: 0 }}>
            +{activity.points} pts
          </span>
        </div>

        {/* Stats row */}
        {hasStats && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {activity.distance_km && (
              <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '8px 14px', flex: 1, minWidth: 70, textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 1 }}>DIST.</p>
                <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', fontFamily: 'monospace' }}>{Number(activity.distance_km).toFixed(2)}<span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}> km</span></p>
              </div>
            )}
            {activity.pace_avg && (
              <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '8px 14px', flex: 1, minWidth: 70, textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 1 }}>RITMO</p>
                <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', fontFamily: 'monospace' }}>{fmtPace(activity.pace_avg)}</p>
              </div>
            )}
            {activity.duration_s && (
              <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '8px 14px', flex: 1, minWidth: 70, textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 1 }}>TEMPO</p>
                <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', fontFamily: 'monospace' }}>{fmtDuration(activity.duration_s)}</p>
              </div>
            )}
            {activity.elevation_m > 0 && (
              <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '8px 14px', flex: 1, minWidth: 60, textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 1 }}>ELEV.</p>
                <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', fontFamily: 'monospace' }}>+{activity.elevation_m}<span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>m</span></p>
              </div>
            )}
            {activity.hr_avg && (
              <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '8px 14px', flex: 1, minWidth: 60, textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 1 }}>FC</p>
                <p style={{ fontSize: 16, fontWeight: 900, color: '#FF453A', fontFamily: 'monospace' }}>{activity.hr_avg}<span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}> bpm</span></p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Coach comment preview (last coach comment if not open) */}
      {!open && activity._latestCoachComment && (
        <div style={{ margin: '0 14px 12px', padding: '10px 12px', background: 'rgba(94,92,230,0.08)', borderRadius: 10, border: '1px solid rgba(94,92,230,0.2)' }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: '#5E5CE6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
            💬 Treinador
          </p>
          <p style={{ fontSize: 13, color: 'var(--text)', fontStyle: 'italic' }}>"{activity._latestCoachComment}"</p>
        </div>
      )}

      {/* Comments toggle */}
      <button onClick={toggleComments}
        style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', borderTop: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>
        <MessageCircle size={13} />
        {open ? 'Fechar comentários' : `Comentários${activity._commentCount > 0 ? ` (${activity._commentCount})` : ''}`}
        {open ? <ChevronUp size={13} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={13} style={{ marginLeft: 'auto' }} />}
      </button>

      {/* Comments section */}
      {open && (
        <div style={{ padding: '0 16px 14px' }}>
          {loadingC ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>A carregar…</p>
          ) : (
            <>
              {comments.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '12px 0', fontStyle: 'italic' }}>
                  Sem comentários ainda. O teu treinador pode deixar feedback aqui.
                </p>
              )}
              {comments.map(c => (
                <div key={c.id} style={{ marginBottom: 10, display: 'flex', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: c.author_role === 'coach' ? 'rgba(94,92,230,0.15)' : 'rgba(255,107,53,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 900,
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
              {/* Input */}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && postComment()}
                  placeholder="Responder ao treinador…"
                  style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none' }}
                />
                <button onClick={postComment} disabled={!text.trim() || posting}
                  style={{ width: 36, height: 36, borderRadius: 10, background: text.trim() ? 'var(--orange)' : 'var(--surface2)', border: 'none', cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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

// ── Main feed component ───────────────────────────────────────
export default function ActivityFeed({ athlete }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!athlete?.id) return
    async function load() {
      // Últimos 14 dias de atividades
      const since = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]
      const { data } = await supabase
        .from('training_completions')
        .select('*')
        .eq('athlete_id', athlete.id)
        .gte('date', since)
        .order('date', { ascending: false })
        .limit(15)

      if (!data?.length) { setActivities([]); setLoading(false); return }

      // Buscar comentários para todas as atividades
      const ids = data.map(a => a.id)
      const { data: allComments } = await supabase
        .from('training_comments')
        .select('*')
        .in('completion_id', ids)
        .order('created_at')

      // Enriquecer cada atividade com o último comentário do coach e count
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

  if (loading) return null
  if (!activities.length) return null

  // Nome do atleta para o comentário
  const authorName = athlete.name || athlete.email?.split('@')[0] || 'Atleta'

  return (
    <div style={{ marginTop: 20 }}>
      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
        ATIVIDADES RECENTES
      </p>
      {activities.map(act => (
        <ActivityCard
          key={act.id}
          activity={act}
          athlete={athlete}
          authorName={authorName}
          authorRole="athlete"
        />
      ))}
    </div>
  )
}
