import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Flame, Trophy, RefreshCw, ChevronRight, Zap } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import BottomNav from '../components/BottomNav'
import WorkoutUpload from '../components/WorkoutUpload'

const STRAVA_CLIENT_ID = '261127'
const STRAVA_REDIRECT  = 'https://run-blush.vercel.app/strava/callback'
const STRAVA_AUTH_URL  = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(STRAVA_REDIRECT)}&response_type=code&scope=activity:read_all&approval_prompt=auto`

const DAYS_SHORT = ['SEG','TER','QUA','QUI','SEX','SÁB','DOM']
const DAYS_PT    = ['domingo','segunda','terça','quarta','quinta','sexta','sábado']

function getWeekDates() {
  const today = new Date()
  const dow = today.getDay()
  const mon = new Date(today)
  mon.setDate(today.getDate() - ((dow + 6) % 7))
  mon.setHours(0,0,0,0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i); return d
  })
}

function toYMD(d) { return d.toISOString().split('T')[0] }

/* ── Workout type definitions ── */
const WORKOUT_TYPES = [
  { type: 'CCL',     label: 'Corrida Leve',   emoji: '🏃',
    grad: 'linear-gradient(135deg, #1a4a2e 0%, #0d2e1a 100%)', accent: '#30D158', points: 10 },
  { type: 'CCN',     label: 'Ritmo Moderado', emoji: '⚡',
    grad: 'linear-gradient(135deg, #4a3500 0%, #2e2000 100%)', accent: '#FFD60A', points: 15 },
  { type: 'CCR',     label: 'Intervalos',     emoji: '🔥',
    grad: 'linear-gradient(135deg, #4a1a00 0%, #2e0d00 100%)', accent: '#FF6930', points: 20 },
  { type: 'Pista',   label: 'Pista',          emoji: '🎯',
    grad: 'linear-gradient(135deg, #001a4a 0%, #00102e 100%)', accent: '#0A84FF', points: 20 },
  { type: 'Subidas', label: 'Subidas',        emoji: '⛰️',
    grad: 'linear-gradient(135deg, #2a0a4a 0%, #1a052e 100%)', accent: '#BF5AF2', points: 20 },
  { type: 'Força',   label: 'Força',          emoji: '💪',
    grad: 'linear-gradient(135deg, #003a3a 0%, #00252 100%)', accent: '#00D4FF', points: 10 },
  { type: 'Prova',   label: 'Prova / Corrida',emoji: '🏁',
    grad: 'linear-gradient(135deg, #4a0a1a 0%, #2e0510 100%)', accent: '#FF2D55', points: 30 },
]

const TYPE_META = Object.fromEntries(WORKOUT_TYPES.map(w => [w.type, w]))
const DEFAULT_TYPE = WORKOUT_TYPES[0]

function getTypeMeta(type) {
  return TYPE_META[type] || DEFAULT_TYPE
}

/* ── Hero gradient based on type ── */
const HERO_THEMES = {
  CCL:      { grad: 'linear-gradient(180deg, #0d2e1a 0%, #080808 100%)', accent: '#30D158',  icon: '🏃', label: 'Corrida Leve'     },
  CCN:      { grad: 'linear-gradient(180deg, #2e2000 0%, #080808 100%)', accent: '#FFD60A',  icon: '⚡', label: 'Moderado'         },
  CCR:      { grad: 'linear-gradient(180deg, #2e0d00 0%, #080808 100%)', accent: '#FF6930',  icon: '🔥', label: 'Ritmo de Prova'   },
  Pista:    { grad: 'linear-gradient(180deg, #00102e 0%, #080808 100%)', accent: '#0A84FF',  icon: '🎯', label: 'Sessão de Pista'  },
  Subidas:  { grad: 'linear-gradient(180deg, #1a052e 0%, #080808 100%)', accent: '#BF5AF2',  icon: '⛰️', label: 'Treino de Subidas'},
  Força:    { grad: 'linear-gradient(180deg, #002525 0%, #080808 100%)', accent: '#00D4FF',  icon: '💪', label: 'Força'            },
  Prova:    { grad: 'linear-gradient(180deg, #2e0510 0%, #080808 100%)', accent: '#FF2D55',  icon: '🏁', label: 'Prova'            },
  Descanso: { grad: 'linear-gradient(180deg, #0e0e0e 0%, #080808 100%)', accent: '#555',     icon: '😴', label: 'Descanso'         },
  default:  { grad: 'linear-gradient(180deg, #0a1a0a 0%, #080808 100%)', accent: '#B8FF00',  icon: '🏃', label: 'Treino'           },
}

function getHeroTheme(sessions) {
  if (!sessions || sessions.length === 0) return HERO_THEMES.Descanso
  const type = sessions[0]?.type
  return HERO_THEMES[type] || HERO_THEMES.default
}

function StravaIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  )
}

/* ── Coach dashboard (unchanged) ── */
function CoachDashboard({ navigate, signOut }) {
  const [stats, setStats] = useState({ total: 0, active: 0 })
  useEffect(() => {
    async function load() {
      const { count: total } = await supabase.from('athletes').select('id', { count: 'exact' }).eq('active', true).eq('is_coach', false)
      const weekStart = toYMD(getWeekDates()[0])
      const { data: comps } = await supabase.from('training_completions').select('athlete_id').gte('date', weekStart)
      const active = new Set(comps?.map(c => c.athlete_id) || []).size
      setStats({ total: total || 0, active })
    }
    load()
  }, [])
  return (
    <div className="coach-layout" style={{ background: 'var(--dark)' }}>
      <aside className="coach-sidebar" style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)', flexDirection: 'column' }}>
        <div className="coach-sidebar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.03em' }}>H<span style={{ color: 'var(--heh-green)' }}>é</span>H</span>
            <span style={{ color: 'var(--heh-green)', fontSize: 8 }}>✦</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => navigate('/coach/atletas')}
              style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(184,255,0,0.10)', border: 'none', cursor: 'pointer', color: 'var(--heh-green)', fontWeight: 700, fontSize: 13 }}>
              Atletas
            </button>
            <button onClick={async () => { await signOut(); navigate('/login') }}
              style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Sair
            </button>
          </div>
        </div>
        <div className="coach-sidebar-meta" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Treinador</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>HéH Focus</p>
        </div>
        <nav className="coach-sidebar-nav" style={{ padding: '12px', flex: 1 }}>
          <button onClick={() => navigate('/coach/atletas')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(184,255,0,0.10)', border: 'none', cursor: 'pointer', color: 'var(--heh-green)', fontWeight: 700, fontSize: 13 }}>
            <Zap size={15} /> Dashboard
          </button>
        </nav>
        <div className="coach-sidebar-footer" style={{ padding: '12px 20px' }}>
          <button onClick={async () => { await signOut(); navigate('/login') }}
            style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            → Sair
          </button>
        </div>
      </aside>
      <main className="coach-main">
        <h1 style={{ fontWeight: 900, fontSize: 'clamp(24px, 5vw, 36px)', letterSpacing: '-0.04em', fontStyle: 'italic', marginBottom: 4, color: 'var(--text)' }}>COACH HQ</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>Visão geral do esquadrão</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 40 }}>
          {[{ label: 'ATLETAS TOTAIS', value: stats.total }, { label: 'ATIVOS NA SEMANA', value: stats.active }].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--surface)', borderRadius: 16, padding: '20px 24px', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 8 }}>{label}</p>
              <p style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.04em' }}>{value}</p>
            </div>
          ))}
        </div>
        <button onClick={() => navigate('/coach/atletas')}
          style={{ padding: '14px 28px', borderRadius: 12, background: 'var(--heh-green)', color: '#080808', fontWeight: 900, fontSize: 14, border: 'none', cursor: 'pointer' }}>
          Ver atletas →
        </button>
      </main>
    </div>
  )
}

/* ── Athlete Dashboard ── */
export default function Dashboard() {
  const { user, athlete, isCoach, loading, signOut, refreshAthlete } = useAuth()
  const navigate = useNavigate()

  const [weekDates]   = useState(getWeekDates)
  const [completions, setCompletions] = useState([])
  const [ranking,     setRanking]     = useState([])
  const [todayPlan,   setTodayPlan]   = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [marking,     setMarking]     = useState(false)
  const [markType,    setMarkType]    = useState(null)
  const [syncing,     setSyncing]     = useState(false)
  const [syncMsg,     setSyncMsg]     = useState('')
  const [showUpload,  setShowUpload]  = useState(false)

  const today    = toYMD(new Date())
  const todayDow = DAYS_PT[new Date().getDay()]

  useEffect(() => {
    if (loading) return
    if (!user)   { navigate('/login'); return }
    if (isCoach) { setLoadingData(false); return }
    if (athlete) loadAthleteData()
    else         setLoadingData(false)
  }, [user, athlete, isCoach, loading])

  async function loadAthleteData() {
    setLoadingData(true)
    const weekStart = toYMD(weekDates[0])
    const weekEnd   = toYMD(weekDates[6])

    const { data: myComp } = await supabase
      .from('training_completions').select('date,points,session_label,confirmed_by_strava,source,ai_summary,distance_km,pace_avg,hr_avg,cadence_avg')
      .eq('athlete_id', athlete.id).gte('date', weekStart).lte('date', weekEnd)
    setCompletions(myComp || [])

    const { data: plan } = await supabase
      .from('general_plans').select('content').gte('week_start', weekStart).lte('week_start', weekEnd)
      .order('week_start', { ascending: false }).limit(1).maybeSingle()

    if (plan?.content && athlete.group) {
      const groupPlan = plan.content[athlete.group] || {}
      setTodayPlan(groupPlan[todayDow] || [])
    }

    if (athlete.group) {
      const { data: groupAthletes } = await supabase
        .from('athletes').select('id,name').eq('group', athlete.group).eq('active', true)
      if (groupAthletes?.length) {
        const ids = groupAthletes.map(a => a.id)
        const { data: allComp } = await supabase
          .from('training_completions').select('athlete_id,points')
          .in('athlete_id', ids).gte('date', weekStart).lte('date', weekEnd)
        const totals = {}
        ids.forEach(id => { totals[id] = 0 })
        ;(allComp || []).forEach(c => { totals[c.athlete_id] = (totals[c.athlete_id] || 0) + c.points })
        setRanking(
          groupAthletes.map(a => ({ ...a, points: totals[a.id] || 0, isMe: a.id === athlete.id }))
            .sort((a, b) => b.points - a.points)
        )
      }
    }
    setLoadingData(false)
  }

  async function markTodayDone(type = 'Treino') {
    if (!athlete || marking) return
    setMarking(true)
    setMarkType(type)
    const meta = getTypeMeta(type)
    await supabase.from('training_completions').upsert(
      { athlete_id: athlete.id, date: today, session_label: type, points: meta.points, confirmed_by_strava: false },
      { onConflict: 'athlete_id,date,session_label' }
    )
    await loadAthleteData()
    setMarking(false)
    setMarkType(null)
  }

  async function getValidToken() {
    let token = athlete.strava_access_token
    if (Date.now() > athlete.strava_token_expires_at * 1000 - 5 * 60 * 1000) {
      const res  = await fetch(`/api/strava?action=refresh&refresh_token=${athlete.strava_refresh_token}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      token = data.access_token
      await supabase.from('athletes').update({ strava_access_token: data.access_token, strava_refresh_token: data.refresh_token, strava_token_expires_at: data.expires_at }).eq('id', athlete.id)
      await refreshAthlete()
    }
    return token
  }

  async function syncStrava() {
    if (!athlete?.strava_access_token || syncing) return
    setSyncing(true); setSyncMsg('A sincronizar...')
    try {
      const token = await getValidToken()
      const after = Math.floor(weekDates[0].getTime() / 1000)
      const res   = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=30`, { headers: { Authorization: `Bearer ${token}` } })
      const activities = await res.json()
      if (!Array.isArray(activities)) throw new Error('Resposta inválida do Strava')
      const weekStrs = weekDates.map(toYMD)
      const runs = activities.filter(a => a.type === 'Run' || a.sport_type === 'Run')
      let confirmed = 0
      for (const act of runs) {
        const actDate = act.start_date_local?.split('T')[0]
        if (!actDate || !weekStrs.includes(actDate)) continue
        const { data: existing } = await supabase.from('training_completions').select('confirmed_by_strava').eq('athlete_id', athlete.id).eq('date', actDate).eq('session_label', 'Treino').maybeSingle()
        if (existing?.confirmed_by_strava) continue
        await supabase.from('training_completions').upsert({ athlete_id: athlete.id, date: actDate, session_label: 'Treino', points: 20, confirmed_by_strava: true, strava_activity_id: act.id }, { onConflict: 'athlete_id,date,session_label' })
        confirmed++
      }
      await loadAthleteData()
      setSyncMsg(confirmed > 0 ? `${confirmed} treino${confirmed > 1 ? 's' : ''} confirmado${confirmed > 1 ? 's' : ''}! +${confirmed * 20} pts` : runs.length > 0 ? 'Treinos já sincronizados' : 'Sem corridas esta semana no Strava')
    } catch (e) { setSyncMsg('Erro: ' + e.message) }
    setSyncing(false)
    setTimeout(() => setSyncMsg(''), 5000)
  }

  if (loading || loadingData) return <LoadingSpinner />
  if (isCoach) return <CoachDashboard navigate={navigate} signOut={signOut} />

  const weekPoints   = completions.reduce((s, c) => s + c.points, 0)
  const myRank       = ranking.findIndex(a => a.isMe) + 1
  const completedMap = new Map(completions.map(c => [c.date, c]))
  const todayEntry   = completedMap.get(today)
  const stravaLinked = !!athlete?.strava_access_token
  const heroTheme    = getHeroTheme(todayEntry ? [] : todayPlan)
  const isRestDay    = todayPlan.length === 0
  const MAX_POINTS   = 70

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--dark)', paddingBottom: 88 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .dash-section { animation: fadeUp 0.3s ease both; }
        .workout-tile:active { transform: scale(0.96); }
        .workout-tile { transition: transform 0.12s ease; cursor: pointer; }
      `}</style>

      {/* ── Sticky week strip ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 16px 10px',
      }}>
        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-0.03em' }}>
              H<span style={{ color: 'var(--heh-green)' }}>é</span>H
            </span>
            <span style={{ color: 'var(--heh-green)', fontSize: 7 }}>✦</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {athlete?.group && (
              <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: 'rgba(184,255,0,0.12)', color: 'var(--heh-green)' }}>
                {athlete.group}
              </span>
            )}
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{(athlete?.name || '').split(' ')[0]}</span>
          </div>
        </div>
        {/* Week days */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {weekDates.map((date, i) => {
            const ds      = toYMD(date)
            const entry   = completedMap.get(ds)
            const done    = !!entry
            const strava  = entry?.confirmed_by_strava || entry?.source === 'strava'
            const isToday = ds === today
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', color: isToday ? 'var(--heh-green)' : 'var(--text-muted)' }}>
                  {DAYS_SHORT[i]}
                </span>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: done ? 13 : 12, fontWeight: 700,
                  background: done ? (strava ? '#FC4C02' : 'var(--heh-green)') : isToday ? 'rgba(184,255,0,0.15)' : 'transparent',
                  border: isToday && !done ? '2px solid var(--heh-green)' : done ? 'none' : '1px solid var(--border)',
                  color: done ? (strava ? 'white' : '#080808') : isToday ? 'var(--heh-green)' : 'var(--text-muted)',
                }}>
                  {done ? (strava ? <StravaIcon size={12} /> : '✓') : date.getDate()}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Hero card ── */}
      <div style={{
        background: todayEntry ? 'linear-gradient(180deg, #0d2e1a 0%, #080808 100%)' : heroTheme.grad,
        padding: '40px 20px 36px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Big emoji */}
        <div style={{ fontSize: 56, marginBottom: 12, lineHeight: 1 }}>
          {todayEntry
            ? (todayEntry.source === 'screenshot' ? '📷' : todayEntry.confirmed_by_strava ? '🟠' : '✅')
            : heroTheme.icon
          }
        </div>
        {/* Status text */}
        {todayEntry ? (
          <>
            <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 4 }}>
              Treino concluído!
            </p>
            <p style={{ fontSize: 13, color: '#30D158', fontWeight: 700, marginBottom: 4 }}>
              +{todayEntry.points} pontos · {todayEntry.session_label}
            </p>
            {todayEntry.distance_km && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{todayEntry.distance_km} km</span>
                {todayEntry.pace_avg && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>⏱ {todayEntry.pace_avg}</span>}
                {todayEntry.hr_avg && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>♥ {todayEntry.hr_avg} bpm</span>}
              </div>
            )}
            {todayEntry.ai_summary && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, maxWidth: 280, margin: '8px auto 0', lineHeight: 1.5 }}>
                {todayEntry.ai_summary}
              </p>
            )}
          </>
        ) : isRestDay ? (
          <>
            <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 4 }}>
              Descansa, {(athlete?.name || '').split(' ')[0]}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              A recuperação alimenta o próximo treino.
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: heroTheme.accent, marginBottom: 6, textTransform: 'uppercase' }}>
              TREINO DE HOJE
            </p>
            <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 6, lineHeight: 1.2 }}>
              {todayPlan[0]?.description || heroTheme.label}
            </p>
            {todayPlan.length > 1 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                + {todayPlan.slice(1).map(s => s.description || s.type).join(' · ')}
              </p>
            )}
            {todayPlan[0]?.distance && (
              <p style={{ fontSize: 14, fontWeight: 700, color: heroTheme.accent, marginTop: 6 }}>
                {todayPlan[0].distance} km · {todayPlan[0].pace}
              </p>
            )}
          </>
        )}

        {/* Points pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          marginTop: 16, padding: '6px 16px', borderRadius: 20,
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <Flame size={13} style={{ color: 'var(--heh-green)' }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{weekPoints}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>pts esta semana</span>
          {myRank > 0 && (
            <>
              <span style={{ color: 'var(--border)', fontSize: 10 }}>·</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: myRank === 1 ? '#FFD60A' : 'var(--text-muted)' }}>#{myRank}</span>
            </>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>

        {/* ── Register workout section ── */}
        {!todayEntry ? (
          <div className="dash-section" style={{ marginTop: 24 }}>
            {/* Workout type grid */}
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
              REGISTAR TREINO
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {WORKOUT_TYPES.map(({ type, label, emoji, grad, accent, points }) => (
                <button
                  key={type}
                  className="workout-tile"
                  onClick={() => markTodayDone(type)}
                  disabled={marking}
                  style={{
                    background: grad,
                    border: `1px solid ${accent}33`,
                    borderRadius: 14,
                    padding: '16px 14px',
                    textAlign: 'left',
                    opacity: marking && markType !== type ? 0.5 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 2, letterSpacing: '-0.01em' }}>{label}</p>
                  <p style={{ fontSize: 11, color: accent, fontWeight: 700 }}>+{points} pts</p>
                </button>
              ))}
            </div>

            {/* Screenshot upload */}
            <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <button
                onClick={() => setShowUpload(v => !v)}
                style={{ width: '100%', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)' }}
              >
                <span style={{ fontSize: 20 }}>📷</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontSize: 14, fontWeight: 700 }}>Confirmar com screenshot</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Garmin · Apple Watch · Polar</p>
                </div>
                <span style={{ fontSize: 18, color: 'var(--text-muted)' }}>{showUpload ? '−' : '+'}</span>
              </button>
              {showUpload && (
                <div style={{ padding: '0 18px 18px' }}>
                  <WorkoutUpload athlete={athlete} date={today} onComplete={() => { loadAthleteData(); setShowUpload(false) }} />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Already done — quick actions */
          <div className="dash-section" style={{ marginTop: 20 }}>
            <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '14px 18px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Quer registar mais um treino?</span>
              <button onClick={() => { setCompletions([]); /* allow re-register */ }}
                style={{ fontSize: 12, fontWeight: 700, color: 'var(--heh-green)', background: 'none', border: 'none', cursor: 'pointer' }}>
                + Adicionar
              </button>
            </div>
          </div>
        )}

        {/* ── Plano de amanhã ── */}
        <div className="dash-section" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PLANO</p>
            <Link to="/plano" style={{ fontSize: 12, fontWeight: 700, color: 'var(--heh-green)', textDecoration: 'none' }}>Ver semana →</Link>
          </div>
          <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {weekDates.slice(1, 4).map((date, i) => {
              const dow = DAYS_PT[date.getDay()]
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: i < 2 ? '1px solid var(--border)' : 'none', gap: 12 }}>
                  <div style={{ textAlign: 'center', width: 36 }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{DAYS_SHORT[(weekDates.indexOf(date))]}</p>
                    <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)' }}>{date.getDate()}</p>
                  </div>
                  <div style={{ width: 2, height: 32, borderRadius: 2, background: 'var(--border)', flexShrink: 0 }} />
                  <p style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>—</p>
                  <ChevronRight size={14} style={{ color: 'var(--border)' }} />
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Strava ── */}
        <div className="dash-section" style={{ marginTop: 20 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '14px 18px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#FC4C02' }}><StravaIcon size={18} /></span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Strava</p>
                {stravaLinked
                  ? <p style={{ fontSize: 11, color: '#30D158', fontWeight: 600 }}>Ligado ✓</p>
                  : <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>+20 pts por atividade</p>
                }
              </div>
            </div>
            {stravaLinked ? (
              <button onClick={syncStrava} disabled={syncing}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 10, background: 'rgba(252,76,2,0.12)', color: '#FC4C02', border: '1px solid rgba(252,76,2,0.2)', cursor: 'pointer', opacity: syncing ? 0.6 : 1 }}>
                <RefreshCw size={12} style={{ animation: syncing ? 'spin 0.8s linear infinite' : 'none' }} />
                {syncing ? 'A sincronizar...' : 'Sincronizar'}
              </button>
            ) : (
              <a href={STRAVA_AUTH_URL}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 10, background: '#FC4C02', color: 'white', textDecoration: 'none' }}>
                <StravaIcon size={12} /> Ligar
              </a>
            )}
          </div>
          {syncMsg && <p style={{ fontSize: 12, fontWeight: 600, marginTop: 8, paddingLeft: 4, color: syncMsg.startsWith('Erro') ? '#FF453A' : '#30D158' }}>{syncMsg}</p>}
        </div>

        {/* ── Ranking ── */}
        {ranking.length > 1 && (
          <div className="dash-section" style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>RANKING {athlete?.group}</p>
              <Link to="/resultados" style={{ fontSize: 12, fontWeight: 700, color: 'var(--heh-green)', textDecoration: 'none' }}>Ver tudo →</Link>
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
              {ranking.slice(0, 5).map((a, i) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < Math.min(ranking.length, 5) - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontWeight: 900, fontSize: 15, width: 22, textAlign: 'center', color: i === 0 ? '#FFD60A' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--text-muted)' }}>
                    {i + 1}
                  </span>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: a.isMe ? 'rgba(184,255,0,0.15)' : 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: a.isMe ? 'var(--heh-green)' : 'var(--text-muted)', border: a.isMe ? '1px solid rgba(184,255,0,0.3)' : 'none' }}>
                    {a.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: a.isMe ? 800 : 500, color: a.isMe ? 'var(--heh-green)' : 'var(--text)' }}>
                    {a.name.split(' ')[0]}{a.isMe ? ' (tu)' : ''}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>
                    {a.points} <span style={{ fontSize: 10 }}>pts</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sair */}
        <button onClick={async () => { await signOut(); navigate('/login') }}
          style={{ width: '100%', marginTop: 24, padding: '13px', borderRadius: 14, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer' }}>
          Sair
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
