import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Flame, Trophy, Users, ChevronRight, ClipboardList, CalendarDays, BarChart3, UserCircle, RefreshCw } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const STRAVA_CLIENT_ID  = '261127'
const STRAVA_REDIRECT   = 'https://run-blush.vercel.app/strava/callback'
const STRAVA_AUTH_URL   = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(STRAVA_REDIRECT)}&response_type=code&scope=activity:read_all&approval_prompt=auto`

const DAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

function getWeekDates() {
  const today = new Date()
  const dow   = today.getDay()
  const mon   = new Date(today)
  mon.setDate(today.getDate() - ((dow + 6) % 7))
  mon.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d
  })
}

function toYMD(date) { return date.toISOString().split('T')[0] }

// ─── Stat cell ───────────────────────────────────────────────
function StatCell({ label, value }) {
  return (
    <div className="flex flex-col items-center py-2">
      <span className="text-2xl font-black" style={{ color: 'var(--text)' }}>{value}</span>
      <span className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}

// ─── Strava logo SVG ─────────────────────────────────────────
function StravaIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  )
}

// ─── Coach dashboard ─────────────────────────────────────────
function CoachDashboard({ athleteCount, navigate, signOut }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--dark)' }}>
      <div className="max-w-sm mx-auto px-4 py-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-3 text-3xl font-black"
            style={{ background: 'var(--surface)', border: '3px solid var(--orange)', color: 'var(--orange)' }}>
            JG
          </div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>João Gama</h1>
          <span className="mt-1.5 text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: 'rgba(252,76,2,0.15)', color: 'var(--orange)' }}>
            Treinador RunTejo
          </span>
        </div>
        <div className="rounded-2xl mb-4 grid grid-cols-2" style={{ background: 'var(--surface)' }}>
          <div style={{ borderRight: '1px solid var(--border)' }}><StatCell label="Atletas" value={athleteCount} /></div>
          <StatCell label="Grupos" value={6} />
        </div>
        <button onClick={() => navigate('/coach/atletas')}
          className="w-full py-4 rounded-2xl font-bold text-sm mb-3"
          style={{ background: 'var(--orange)', color: 'white' }}>
          Área do Treinador →
        </button>
        <button onClick={async () => { await signOut(); navigate('/login') }}
          className="w-full py-3 text-sm font-medium rounded-2xl"
          style={{ color: 'var(--text-muted)', background: 'var(--surface)' }}>
          Sair
        </button>
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, athlete, isCoach, loading, signOut, refreshAthlete } = useAuth()
  const navigate = useNavigate()

  const [weekDates]    = useState(getWeekDates)
  const [completions,  setCompletions]  = useState([])
  const [ranking,      setRanking]      = useState([])
  const [athleteCount, setAthleteCount] = useState(0)
  const [loadingData,  setLoadingData]  = useState(true)
  const [marking,      setMarking]      = useState(false)
  const [syncing,      setSyncing]      = useState(false)
  const [syncMsg,      setSyncMsg]      = useState('')

  const today = toYMD(new Date())

  useEffect(() => {
    if (loading) return
    if (!user)    { navigate('/login'); return }
    if (isCoach)  { loadCoachData(); return }
    if (athlete)  loadAthleteData()
    else          setLoadingData(false)
  }, [user, athlete, isCoach, loading])

  async function loadAthleteData() {
    setLoadingData(true)
    const weekStart = toYMD(weekDates[0])
    const weekEnd   = toYMD(weekDates[6])

    const { data: myComp } = await supabase
      .from('training_completions')
      .select('date, points, session_label, confirmed_by_strava')
      .eq('athlete_id', athlete.id)
      .gte('date', weekStart)
      .lte('date', weekEnd)

    setCompletions(myComp || [])

    if (athlete.group) {
      const { data: groupAthletes } = await supabase
        .from('athletes')
        .select('id, name')
        .eq('group', athlete.group)
        .eq('active', true)

      if (groupAthletes?.length) {
        const ids = groupAthletes.map(a => a.id)
        const { data: allComp } = await supabase
          .from('training_completions')
          .select('athlete_id, points')
          .in('athlete_id', ids)
          .gte('date', weekStart)
          .lte('date', weekEnd)

        const totals = {}
        ids.forEach(id => { totals[id] = 0 })
        ;(allComp || []).forEach(c => { totals[c.athlete_id] = (totals[c.athlete_id] || 0) + c.points })

        setRanking(
          groupAthletes
            .map(a => ({ ...a, points: totals[a.id] || 0, isMe: a.id === athlete.id }))
            .sort((a, b) => b.points - a.points)
        )
      }
    }
    setLoadingData(false)
  }

  async function loadCoachData() {
    const { count } = await supabase.from('athletes').select('id', { count: 'exact' }).eq('active', true)
    setAthleteCount(count || 0)
    setLoadingData(false)
  }

  // ── Marcar treino manual (10 pts) ──────────────────────────
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

  // ── Obter token válido (faz refresh se necessário) ─────────
  async function getValidToken() {
    let token     = athlete.strava_access_token
    const expires = athlete.strava_token_expires_at * 1000

    if (Date.now() > expires - 5 * 60 * 1000) {
      const res  = await fetch(`/api/strava?action=refresh&refresh_token=${athlete.strava_refresh_token}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      token = data.access_token
      await supabase.from('athletes').update({
        strava_access_token:     data.access_token,
        strava_refresh_token:    data.refresh_token,
        strava_token_expires_at: data.expires_at,
      }).eq('id', athlete.id)
      await refreshAthlete()
    }
    return token
  }

  // ── Sincronizar com Strava (20 pts se confirmado) ──────────
  async function syncStrava() {
    if (!athlete?.strava_access_token || syncing) return
    setSyncing(true)
    setSyncMsg('A sincronizar...')

    try {
      const token = await getValidToken()
      const after = Math.floor(weekDates[0].getTime() / 1000)

      const res        = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=30`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const activities = await res.json()

      if (!Array.isArray(activities)) throw new Error('Resposta inválida do Strava')

      const weekStrs  = weekDates.map(toYMD)
      const runs      = activities.filter(a => a.type === 'Run' || a.sport_type === 'Run')
      let   confirmed = 0

      for (const act of runs) {
        const actDate = act.start_date_local?.split('T')[0]
        if (!actDate || !weekStrs.includes(actDate)) continue

        // Verificar se já existe registo para esse dia
        const { data: existing } = await supabase
          .from('training_completions')
          .select('id, points, confirmed_by_strava')
          .eq('athlete_id', athlete.id)
          .eq('date', actDate)
          .eq('session_label', 'Treino')
          .maybeSingle()

        if (existing?.confirmed_by_strava) continue // já confirmado

        await supabase.from('training_completions').upsert(
          {
            athlete_id:          athlete.id,
            date:                actDate,
            session_label:       'Treino',
            points:              20,
            confirmed_by_strava: true,
            strava_activity_id:  act.id,
          },
          { onConflict: 'athlete_id,date,session_label' }
        )
        confirmed++
      }

      await loadAthleteData()
      setSyncMsg(
        confirmed > 0
          ? `${confirmed} treino${confirmed > 1 ? 's' : ''} confirmado${confirmed > 1 ? 's' : ''}! +${confirmed * 20} pts`
          : runs.length > 0
          ? 'Treinos já estavam sincronizados'
          : 'Sem corridas esta semana no Strava'
      )
    } catch (e) {
      setSyncMsg('Erro: ' + e.message)
    }
    setSyncing(false)
    setTimeout(() => setSyncMsg(''), 4000)
  }

  if (loading || loadingData) return <LoadingSpinner />
  if (isCoach) return <CoachDashboard athleteCount={athleteCount} navigate={navigate} signOut={signOut} />

  const weekPoints     = completions.reduce((s, c) => s + c.points, 0)
  const myRank         = ranking.findIndex(a => a.isMe) + 1
  const completedDates = new Map(completions.map(c => [c.date, c]))
  const todayEntry     = completedDates.get(today)
  const stravaLinked   = !!athlete?.strava_access_token
  const MAX_POINTS     = 70

  return (
    <div className="min-h-screen" style={{ background: 'var(--dark)' }}>
      <div className="max-w-sm mx-auto px-4 py-8">

        {/* ── Avatar + nome ── */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center mb-3"
            style={{ border: '3px solid var(--orange)', background: 'var(--surface)' }}>
            {athlete?.avatar_url
              ? <img src={athlete.avatar_url} alt={athlete.name} className="w-full h-full object-cover" />
              : <span className="text-3xl font-black" style={{ color: 'var(--orange)' }}>{athlete?.name?.[0]?.toUpperCase() || '?'}</span>
            }
          </div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>{athlete?.name || user?.email}</h1>
          {athlete?.group && (
            <span className="mt-1.5 text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: 'rgba(252,76,2,0.15)', color: 'var(--orange)' }}>
              Grupo {athlete.group}
            </span>
          )}
        </div>

        {/* ── Stats ── */}
        <div className="rounded-2xl mb-4 grid grid-cols-3" style={{ background: 'var(--surface)' }}>
          <div style={{ borderRight: '1px solid var(--border)' }}><StatCell label="Treinos" value={completions.length} /></div>
          <div style={{ borderRight: '1px solid var(--border)' }}><StatCell label="Pontos" value={weekPoints} /></div>
          <StatCell label="Ranking" value={myRank > 0 ? `#${myRank}` : '—'} />
        </div>

        {/* ── Strava ── */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span style={{ color: '#FC4C02' }}><StravaIcon size={20} /></span>
              <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>Strava</span>
              {stravaLinked && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(48,209,88,0.15)', color: '#30D158' }}>
                  Ligado
                </span>
              )}
            </div>
            {stravaLinked ? (
              <button onClick={syncStrava} disabled={syncing}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                style={{ background: 'rgba(252,76,2,0.15)', color: 'var(--orange)', opacity: syncing ? 0.6 : 1 }}>
                <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'A sincronizar...' : 'Sincronizar'}
              </button>
            ) : (
              <a href={STRAVA_AUTH_URL}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
                style={{ background: '#FC4C02', color: 'white' }}>
                <StravaIcon size={13} />
                Ligar
              </a>
            )}
          </div>
          {syncMsg && (
            <p className="text-xs font-semibold mt-2" style={{ color: syncMsg.startsWith('Erro') ? '#FF453A' : '#30D158' }}>
              {syncMsg}
            </p>
          )}
          {!stravaLinked && (
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Liga o Strava para confirmar treinos automaticamente e ganhar 20 pts por sessão.
            </p>
          )}
        </div>

        {/* ── Dias da semana ── */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Flame size={18} style={{ color: 'var(--orange)' }} fill="var(--orange)" />
            <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>Esta semana</span>
          </div>
          <div className="flex justify-between">
            {weekDates.map((date, i) => {
              const ds      = toYMD(date)
              const entry   = completedDates.get(ds)
              const done    = !!entry
              const strava  = entry?.confirmed_by_strava
              const isToday = ds === today
              const isPast  = date < new Date() && !isToday

              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{DAYS[i]}</span>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold relative"
                    style={{
                      background: done ? (strava ? '#FC4C02' : 'var(--orange)') : isToday ? 'rgba(252,76,2,0.15)' : 'var(--dark)',
                      border: isToday && !done ? '2px solid var(--orange)' : '2px solid transparent',
                      color: done ? 'white' : isPast ? 'var(--text-muted)' : 'var(--border)',
                    }}>
                    {done
                      ? strava ? <StravaIcon size={14} /> : '✓'
                      : date.getDate()
                    }
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: 'var(--orange)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Manual (10 pts)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: '#FC4C02' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Strava (20 pts)</span>
            </div>
          </div>
        </div>

        {/* ── Pontuação semanal ── */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy size={16} style={{ color: 'var(--orange)' }} />
              <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>Pontuação semanal</span>
            </div>
            <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
              {weekPoints} / {MAX_POINTS} pts
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden mb-3" style={{ background: 'var(--dark)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min((weekPoints / MAX_POINTS) * 100, 100)}%`,
                background: weekPoints >= MAX_POINTS ? '#30D158' : 'var(--orange)',
              }} />
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {weekPoints === 0
              ? 'Ainda sem treinos esta semana. Vamos lá! 💪'
              : weekPoints >= MAX_POINTS
              ? 'Semana completa! Excelente trabalho 🎉'
              : `Faltam ${MAX_POINTS - weekPoints} pontos para completar a semana`}
          </p>
        </div>

        {/* ── Ranking do grupo ── */}
        {ranking.length > 1 && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} style={{ color: 'var(--orange)' }} />
              <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>Ranking Grupo {athlete?.group}</span>
            </div>
            <div className="space-y-2.5">
              {ranking.slice(0, 5).map((a, i) => (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="text-xs font-black w-6 text-center"
                    style={{ color: i === 0 ? '#FFD60A' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--text-muted)' }}>
                    #{i + 1}
                  </span>
                  <span className="flex-1 text-sm truncate"
                    style={{ color: a.isMe ? 'var(--orange)' : 'var(--text)', fontWeight: a.isMe ? 700 : 500 }}>
                    {a.name}{a.isMe ? ' (tu)' : ''}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 rounded-full"
                      style={{
                        width: `${Math.max((a.points / MAX_POINTS) * 60, a.points > 0 ? 4 : 0)}px`,
                        background: a.isMe ? 'var(--orange)' : 'var(--border)',
                      }} />
                    <span className="text-xs font-bold w-12 text-right" style={{ color: 'var(--text-muted)' }}>
                      {a.points} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Marcar manual ── */}
        {!todayEntry ? (
          <button onClick={markTodayDone} disabled={marking}
            className="w-full py-4 rounded-2xl font-bold text-sm mb-4 transition-all"
            style={{ background: 'var(--orange)', color: 'white', opacity: marking ? 0.7 : 1 }}>
            {marking ? 'A registar...' : '✓  Marcar treino de hoje como feito'}
          </button>
        ) : (
          <div className="w-full py-3.5 rounded-2xl text-center text-sm font-bold mb-4"
            style={{
              background: todayEntry.confirmed_by_strava ? 'rgba(252,76,2,0.12)' : 'rgba(48,209,88,0.12)',
              color: todayEntry.confirmed_by_strava ? '#FC4C02' : '#30D158',
            }}>
            {todayEntry.confirmed_by_strava ? '🟠 Confirmado pelo Strava (+20 pts)' : '✓ Treino registado (+10 pts)'}
          </div>
        )}

        {/* ── Navegação ── */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'var(--surface)' }}>
          {[
            { label: 'Plano de treino', to: '/plano',      Icon: ClipboardList },
            { label: 'Corridas',        to: '/corridas',   Icon: CalendarDays  },
            { label: 'Resultados',      to: '/resultados', Icon: BarChart3     },
            { label: 'Perfil',          to: '/perfil',     Icon: UserCircle    },
          ].map(({ label, to, Icon }, i, arr) => (
            <Link key={to} to={to}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <Icon size={16} style={{ color: 'var(--text-muted)' }} />
              <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</span>
              <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
            </Link>
          ))}
        </div>

        {/* ── Sair ── */}
        <button onClick={async () => { await signOut(); navigate('/login') }}
          className="w-full py-3 text-sm font-medium rounded-2xl"
          style={{ color: 'var(--text-muted)', background: 'var(--surface)' }}>
          Sair
        </button>
      </div>
    </div>
  )
}
