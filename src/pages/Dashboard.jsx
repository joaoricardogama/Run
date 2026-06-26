import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Flame, Trophy, Users, ChevronRight, RefreshCw, Zap } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import BottomNav from '../components/BottomNav'

const STRAVA_CLIENT_ID = '261127'
const STRAVA_REDIRECT  = 'https://run-blush.vercel.app/strava/callback'
const STRAVA_AUTH_URL  = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(STRAVA_REDIRECT)}&response_type=code&scope=activity:read_all&approval_prompt=auto`

const DAYS_SHORT = ['S','T','Q','Q','S','S','D']
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

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'BOM DIA'
  if (h < 18) return 'BOA TARDE'
  return 'BOA NOITE'
}

function StravaIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  )
}

const TYPE_COLORS = {
  CCL:      { bg: 'rgba(184,255,0,0.15)',    text: 'var(--heh-green)' },
  CCN:      { bg: 'rgba(255,214,10,0.15)',   text: '#FFD60A' },
  CCR:      { bg: 'rgba(255,69,58,0.15)',    text: '#FF453A' },
  Pista:    { bg: 'rgba(10,132,255,0.15)',   text: '#0A84FF' },
  Descanso: { bg: 'rgba(255,255,255,0.07)',  text: 'var(--text-muted)' },
  default:  { bg: 'rgba(184,255,0,0.15)',    text: 'var(--heh-green)' },
}

function TypeBadge({ type }) {
  const clr = TYPE_COLORS[type] || TYPE_COLORS.default
  return (
    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 6, background: clr.bg, color: clr.text, textTransform: 'uppercase' }}>
      {type}
    </span>
  )
}

// ── Coach dashboard ───────────────────────────────────────────────
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
      {/* Sidebar */}
      <aside className="coach-sidebar" style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)', flexDirection: 'column' }}>
        <div className="coach-sidebar-inner">
          {/* Logo always visible */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.03em' }}>H<span style={{ color: 'var(--heh-green)' }}>é</span>H</span>
            <span style={{ color: 'var(--heh-green)', fontSize: 8 }}>✦</span>
          </div>
          {/* Mobile: show quick nav inline */}
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
        {/* Desktop-only sidebar content */}
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

      {/* Main */}
      <main className="coach-main">
        <h1 style={{ fontWeight: 900, fontSize: 'clamp(24px, 5vw, 36px)', letterSpacing: '-0.04em', fontStyle: 'italic', marginBottom: 4, color: 'var(--text)' }}>COACH HQ</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>Visão geral do esquadrão</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'ATLETAS TOTAIS',   value: stats.total  },
            { label: 'ATIVOS NA SEMANA', value: stats.active },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--surface)', borderRadius: 16, padding: '20px 24px', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 8 }}>{label}</p>
              <p style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.04em' }}>{value}</p>
            </div>
          ))}
        </div>

        <button onClick={() => navigate('/coach/atletas')}
          style={{ padding: '14px 28px', borderRadius: 12, background: 'var(--heh-green)', color: '#080808', fontWeight: 900, fontSize: 14, border: 'none', cursor: 'pointer', letterSpacing: '-0.01em' }}>
          Ver atletas →
        </button>
      </main>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────
export default function Dashboard() {
  const { user, athlete, isCoach, loading, signOut, refreshAthlete } = useAuth()
  const navigate = useNavigate()

  const [weekDates]   = useState(getWeekDates)
  const [completions, setCompletions] = useState([])
  const [ranking,     setRanking]     = useState([])
  const [todayPlan,   setTodayPlan]   = useState([])   // sessões do plano de hoje
  const [nextDays,    setNextDays]    = useState([])   // próximos 3 dias com plano
  const [loadingData, setLoadingData] = useState(true)
  const [marking,     setMarking]     = useState(false)
  const [syncing,     setSyncing]     = useState(false)
  const [syncMsg,     setSyncMsg]     = useState('')

  const today    = toYMD(new Date())
  const todayDow = DAYS_PT[new Date().getDay()]   // 'segunda', 'terça', ...

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

    // Completions desta semana
    const { data: myComp } = await supabase
      .from('training_completions').select('date,points,session_label,confirmed_by_strava')
      .eq('athlete_id', athlete.id).gte('date', weekStart).lte('date', weekEnd)
    setCompletions(myComp || [])

    // Plano geral desta semana
    const { data: plan } = await supabase
      .from('general_plans').select('content').gte('week_start', weekStart).lte('week_start', weekEnd)
      .order('week_start', { ascending: false }).limit(1).maybeSingle()

    if (plan?.content && athlete.group) {
      const groupPlan = plan.content[athlete.group] || {}
      setTodayPlan(groupPlan[todayDow] || [])

      // Próximos 3 dias
      const upcoming = []
      for (let i = 1; i <= 6 && upcoming.length < 3; i++) {
        const d   = weekDates[(weekDates.findIndex(d => toYMD(d) === today) + i) % 7]
        if (!d) continue
        const dow = DAYS_PT[d.getDay()]
        const sessions = groupPlan[dow] || []
        if (sessions.length > 0) upcoming.push({ date: d, dow, sessions })
      }
      setNextDays(upcoming)
    }

    // Ranking do grupo
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

  async function markTodayDone() {
    if (!athlete || marking) return
    setMarking(true)
    await supabase.from('training_completions').upsert(
      { athlete_id: athlete.id, date: today, session_label: 'Treino', points: 10, confirmed_by_strava: false },
      { onConflict: 'athlete_id,date,session_label' }
    )
    await loadAthleteData()
    setMarking(false)
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
  const MAX_POINTS   = 70

  const STAT_CARDS = [
    { label: 'TREINOS',  value: `${completions.length}/7`,       accent: false },
    { label: 'PONTOS',   value: weekPoints,                       accent: false },
    { label: 'RANKING',  value: myRank > 0 ? `#${myRank}` : '—', accent: myRank === 1 },
    { label: 'GRUPO',    value: athlete?.group || '—',            accent: false },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--dark)', paddingBottom: 100 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 480px) {
          .dash-greeting { padding: 24px 0 16px !important; }
          .dash-greeting h1 { font-size: 28px !important; }
        }
      `}</style>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>

        {/* ── Greeting ── */}
        <div className="dash-greeting" style={{ padding: '40px 0 24px' }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: 'var(--heh-green)', marginBottom: 4 }}>
            {greeting()},
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.04em', fontStyle: 'italic', color: 'var(--text)', marginBottom: 6, lineHeight: 1 }}>
            {(athlete?.name || '').split(' ')[0].toUpperCase()}
          </h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {athlete?.group && (
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(184,255,0,0.12)', color: 'var(--heh-green)' }}>
                Grupo {athlete.group}
              </span>
            )}
            {athlete?.escalao && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{athlete.escalao}</span>
            )}
          </div>
        </div>

        {/* ── 4 Stat cards ── */}
        <div className="grid-2-4" style={{ marginBottom: 24 }}>
          {STAT_CARDS.map(({ label, value, accent }) => (
            <div key={label} style={{ background: accent ? 'var(--heh-green)' : 'var(--surface)', borderRadius: 14, padding: '14px 10px', textAlign: 'center', border: accent ? 'none' : '1px solid var(--border)' }}>
              <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', color: accent ? '#080808' : 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', color: accent ? '#080808' : 'var(--text)' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Treino de Hoje ── */}
        <section style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>TREINO DE HOJE</p>

          {todayPlan.length > 0 ? (
            <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
              {todayPlan.map((session, i) => (
                <div key={i} style={{ padding: '16px 18px', borderBottom: i < todayPlan.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <TypeBadge type={session.type} />
                    {todayEntry && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 5, background: 'rgba(48,209,88,0.15)', color: '#30D158' }}>CONCLUÍDO</span>}
                  </div>
                  <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>{session.description || session.type}</p>
                  <div style={{ display: 'flex', gap: 14 }}>
                    {session.distance && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{session.distance} km</span>}
                    {session.pace && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{session.pace}</span>}
                    {session.notes && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{session.notes}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '20px 18px', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13 }}>
              {todayEntry ? '✓ Treino livre registado hoje' : 'Sem sessão planeada para hoje'}
            </div>
          )}

          {/* Mark done / status */}
          <div style={{ marginTop: 10 }}>
            {!todayEntry ? (
              <button onClick={markTodayDone} disabled={marking}
                style={{ width: '100%', padding: '14px', borderRadius: 14, fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', background: 'var(--heh-green)', color: '#080808', opacity: marking ? 0.7 : 1, transition: 'opacity 0.15s' }}>
                {marking ? 'A registar...' : '✓  Marcar treino de hoje'}
              </button>
            ) : (
              <div style={{ padding: '12px 16px', borderRadius: 14, textAlign: 'center', fontWeight: 700, fontSize: 13, background: todayEntry.confirmed_by_strava ? 'rgba(252,76,2,0.12)' : 'rgba(184,255,0,0.10)', color: todayEntry.confirmed_by_strava ? '#FC4C02' : 'var(--heh-green)' }}>
                {todayEntry.confirmed_by_strava ? '🟠 Confirmado pelo Strava (+20 pts)' : `✓ Registado (+${todayEntry.points} pts)`}
              </div>
            )}
          </div>
        </section>

        {/* ── Próximos treinos ── */}
        {nextDays.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PRÓXIMOS TREINOS</p>
              <Link to="/plano" style={{ fontSize: 12, fontWeight: 700, color: 'var(--heh-green)', textDecoration: 'none' }}>Ver plano completo ›</Link>
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
              {nextDays.map(({ date, dow, sessions }, i) => {
                const s = sessions[0]
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: i < nextDays.length - 1 ? '1px solid var(--border)' : 'none', gap: 14 }}>
                    <div style={{ width: 3, height: 36, borderRadius: 4, background: 'var(--heh-green)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                        {dow.charAt(0).toUpperCase() + dow.slice(1)}, {date.getDate()} {date.toLocaleDateString('pt-PT', { month: 'short' }).toUpperCase()}
                      </p>
                      <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{s?.description || s?.type || 'Treino'}</p>
                    </div>
                    {s?.distance && <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{s.distance} km</span>}
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Semana (dots) ── */}
        <section style={{ background: 'var(--surface)', borderRadius: 16, padding: '16px 18px', marginBottom: 20, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Flame size={15} style={{ color: 'var(--heh-green)' }} fill="var(--heh-green)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Esta semana</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{weekPoints}/{MAX_POINTS} pts</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {weekDates.map((date, i) => {
              const ds     = toYMD(date)
              const entry  = completedMap.get(ds)
              const done   = !!entry
              const strava = entry?.confirmed_by_strava
              const isToday = ds === today
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>{DAYS_SHORT[i]}</span>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: done ? (strava ? '#FC4C02' : 'var(--heh-green)') : isToday ? 'rgba(184,255,0,0.12)' : 'var(--dark)', border: isToday && !done ? '2px solid var(--heh-green)' : '2px solid transparent', color: done ? (strava ? 'white' : '#080808') : 'var(--text-muted)' }}>
                    {done ? (strava ? <StravaIcon size={13} /> : '✓') : date.getDate()}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 12, height: 4, borderRadius: 4, background: 'var(--dark)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 4, width: `${Math.min((weekPoints/MAX_POINTS)*100,100)}%`, background: weekPoints >= MAX_POINTS ? '#30D158' : 'var(--heh-green)', transition: 'width 0.6s' }} />
          </div>
        </section>

        {/* ── Strava ── */}
        <section style={{ background: 'var(--surface)', borderRadius: 16, padding: '16px 18px', marginBottom: 20, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#FC4C02' }}><StravaIcon size={18} /></span>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Strava</span>
              {stravaLinked && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(48,209,88,0.15)', color: '#30D158' }}>Ligado</span>}
            </div>
            {stravaLinked ? (
              <button onClick={syncStrava} disabled={syncing}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 10, background: 'rgba(252,76,2,0.12)', color: '#FC4C02', border: 'none', cursor: 'pointer', opacity: syncing ? 0.6 : 1 }}>
                <RefreshCw size={12} style={{ animation: syncing ? 'spin 0.8s linear infinite' : 'none' }} />
                {syncing ? 'A sincronizar...' : 'Sincronizar'}
              </button>
            ) : (
              <a href={STRAVA_AUTH_URL} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 10, background: '#FC4C02', color: 'white', textDecoration: 'none' }}>
                <StravaIcon size={12} /> Ligar
              </a>
            )}
          </div>
          {syncMsg && <p style={{ fontSize: 12, fontWeight: 600, marginTop: 8, color: syncMsg.startsWith('Erro') ? '#FF453A' : '#30D158' }}>{syncMsg}</p>}
          {!stravaLinked && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>Liga o Strava para confirmar treinos automaticamente (+20 pts).</p>}
        </section>

        {/* ── Ranking ── */}
        {ranking.length > 1 && (
          <section style={{ background: 'var(--surface)', borderRadius: 16, padding: '16px 18px', marginBottom: 20, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Trophy size={15} style={{ color: 'var(--heh-green)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Ranking Grupo {athlete?.group}</span>
              <Link to="/resultados" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--heh-green)', textDecoration: 'none' }}>Ver tudo ›</Link>
            </div>
            {ranking.slice(0, 3).map((a, i) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontWeight: 900, fontSize: 16, width: 24, color: i === 0 ? '#FFD60A' : i === 1 ? '#C0C0C0' : '#CD7F32' }}>{i+1}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: a.isMe ? 'var(--heh-green)' : 'var(--text-muted)' }}>
                  {a.name.slice(0,2).toUpperCase()}
                </div>
                <span style={{ flex: 1, fontSize: 14, fontWeight: a.isMe ? 800 : 500, color: a.isMe ? 'var(--heh-green)' : 'var(--text)' }}>
                  {a.name}{a.isMe ? ' (tu)' : ''}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>{a.points} <span style={{ fontSize: 10 }}>pts</span></span>
              </div>
            ))}
          </section>
        )}

        {/* Sair */}
        <button onClick={async () => { await signOut(); navigate('/login') }}
          style={{ width: '100%', padding: '13px', borderRadius: 14, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', marginBottom: 8 }}>
          Sair
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
