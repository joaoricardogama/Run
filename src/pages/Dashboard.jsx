import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Flame, Trophy, Users, ChevronRight, LayoutGrid, ClipboardList, CalendarDays, BarChart3, UserCircle } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

// Dias da semana (2a a Dom)
const DAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

function getWeekDates() {
  const today = new Date()
  const dow = today.getDay() // 0=Dom
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dow + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function toYMD(date) {
  return date.toISOString().split('T')[0]
}

// ─── Stat cell ───────────────────────────────────────────────
function StatCell({ label, value }) {
  return (
    <div className="flex flex-col items-center py-2">
      <span className="text-2xl font-black" style={{ color: 'var(--text)' }}>{value}</span>
      <span className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}

// ─── Coach dashboard ─────────────────────────────────────────
function CoachDashboard({ athleteCount, navigate, signOut }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--dark)' }}>
      <div className="max-w-sm mx-auto px-4 py-10">
        {/* Avatar */}
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

        {/* Stats */}
        <div className="rounded-2xl mb-4 grid grid-cols-2"
          style={{ background: 'var(--surface)' }}>
          <div style={{ borderRight: '1px solid var(--border)' }}>
            <StatCell label="Atletas" value={athleteCount} />
          </div>
          <StatCell label="Grupos" value={6} />
        </div>

        {/* CTA */}
        <button onClick={() => navigate('/coach/atletas')}
          className="w-full py-4 rounded-2xl font-bold text-sm mb-3 transition-all"
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

// ─── Athlete dashboard ───────────────────────────────────────
export default function Dashboard() {
  const { user, athlete, isCoach, loading, signOut } = useAuth()
  const navigate = useNavigate()

  const [weekDates] = useState(getWeekDates)
  const [completions, setCompletions] = useState([])
  const [ranking, setRanking] = useState([])
  const [athleteCount, setAthleteCount] = useState(0)
  const [loadingData, setLoadingData] = useState(true)
  const [marking, setMarking] = useState(false)

  const today = toYMD(new Date())

  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/login'); return }
    if (isCoach) { loadCoachData(); return }
    if (athlete) loadAthleteData()
    else setLoadingData(false)
  }, [user, athlete, isCoach, loading])

  async function loadAthleteData() {
    setLoadingData(true)
    const weekStart = toYMD(weekDates[0])
    const weekEnd = toYMD(weekDates[6])

    // Completions desta semana
    const { data: myCompletions } = await supabase
      .from('training_completions')
      .select('date, points, session_label')
      .eq('athlete_id', athlete.id)
      .gte('date', weekStart)
      .lte('date', weekEnd)

    setCompletions(myCompletions || [])

    // Ranking do grupo
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

        const ranked = groupAthletes
          .map(a => ({ ...a, points: totals[a.id] || 0, isMe: a.id === athlete.id }))
          .sort((a, b) => b.points - a.points)

        setRanking(ranked)
      }
    }

    setLoadingData(false)
  }

  async function loadCoachData() {
    const { count } = await supabase
      .from('athletes')
      .select('id', { count: 'exact' })
      .eq('active', true)
    setAthleteCount(count || 0)
    setLoadingData(false)
  }

  async function markTodayDone() {
    if (!athlete || marking) return
    setMarking(true)
    await supabase
      .from('training_completions')
      .upsert({ athlete_id: athlete.id, date: today, session_label: 'Treino', points: 10 })
    await loadAthleteData()
    setMarking(false)
  }

  if (loading || loadingData) return <LoadingSpinner />

  if (isCoach) {
    return <CoachDashboard athleteCount={athleteCount} navigate={navigate} signOut={signOut} />
  }

  const weekPoints = completions.reduce((s, c) => s + c.points, 0)
  const myRank = ranking.findIndex(a => a.isMe) + 1
  const completedDates = new Set(completions.map(c => c.date))
  const todayDone = completedDates.has(today)
  const MAX_POINTS = 70

  return (
    <div className="min-h-screen" style={{ background: 'var(--dark)' }}>
      <div className="max-w-sm mx-auto px-4 py-8">

        {/* ── Avatar + nome ── */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
              style={{ border: '3px solid var(--orange)', background: 'var(--surface)' }}>
              {athlete?.avatar_url ? (
                <img src={athlete.avatar_url} alt={athlete.name}
                  className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black" style={{ color: 'var(--orange)' }}>
                  {athlete?.name?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
          </div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>
            {athlete?.name || user?.email}
          </h1>
          {athlete?.group && (
            <span className="mt-1.5 text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: 'rgba(252,76,2,0.15)', color: 'var(--orange)' }}>
              Grupo {athlete.group}
            </span>
          )}
        </div>

        {/* ── Stats ── */}
        <div className="rounded-2xl mb-4 grid grid-cols-3"
          style={{ background: 'var(--surface)' }}>
          <div style={{ borderRight: '1px solid var(--border)' }}>
            <StatCell label="Treinos" value={completions.length} />
          </div>
          <div style={{ borderRight: '1px solid var(--border)' }}>
            <StatCell label="Pontos" value={weekPoints} />
          </div>
          <StatCell label="Ranking" value={myRank > 0 ? `#${myRank}` : '—'} />
        </div>

        {/* ── Dias da semana ── */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Flame size={18} style={{ color: 'var(--orange)' }} fill="var(--orange)" />
            <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>
              Esta semana
            </span>
          </div>
          <div className="flex justify-between">
            {weekDates.map((date, i) => {
              const ds = toYMD(date)
              const done = completedDates.has(ds)
              const isToday = ds === today
              const isPast = date < new Date() && !isToday

              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {DAYS[i]}
                  </span>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: done ? 'var(--orange)' : isToday ? 'rgba(252,76,2,0.15)' : 'var(--dark)',
                      border: isToday && !done ? '2px solid var(--orange)' : '2px solid transparent',
                      color: done ? 'white' : isPast ? 'var(--text-muted)' : 'var(--border)',
                    }}>
                    {done ? '✓' : date.getDate()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Pontuação semanal ── */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy size={16} style={{ color: 'var(--orange)' }} />
              <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                Pontuação semanal
              </span>
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
              <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                Ranking Grupo {athlete?.group}
              </span>
            </div>
            <div className="space-y-2.5">
              {ranking.slice(0, 5).map((a, i) => (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="text-xs font-black w-6 text-center"
                    style={{ color: i === 0 ? '#FFD60A' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--text-muted)' }}>
                    #{i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium truncate"
                    style={{ color: a.isMe ? 'var(--orange)' : 'var(--text)', fontWeight: a.isMe ? 700 : 500 }}>
                    {a.name}{a.isMe ? ' (tu)' : ''}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 rounded-full"
                      style={{
                        width: `${Math.max((a.points / MAX_POINTS) * 60, a.points > 0 ? 4 : 0)}px`,
                        background: a.isMe ? 'var(--orange)' : 'var(--border)',
                        minWidth: a.points > 0 ? '4px' : '0',
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

        {/* ── Marcar treino feito ── */}
        {!todayDone ? (
          <button onClick={markTodayDone} disabled={marking}
            className="w-full py-4 rounded-2xl font-bold text-sm mb-4 transition-all"
            style={{ background: 'var(--orange)', color: 'white', opacity: marking ? 0.7 : 1 }}>
            {marking ? 'A registar...' : '✓  Marcar treino de hoje como feito'}
          </button>
        ) : (
          <div className="w-full py-4 rounded-2xl text-center text-sm font-bold mb-4"
            style={{ background: 'rgba(48,209,88,0.12)', color: '#30D158' }}>
            ✓ Treino de hoje registado
          </div>
        )}

        {/* ── Navegação ── */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'var(--surface)' }}>
          {[
            { label: 'Plano de treino', to: '/plano', Icon: ClipboardList },
            { label: 'Corridas',        to: '/corridas', Icon: CalendarDays },
            { label: 'Resultados',      to: '/resultados', Icon: BarChart3 },
            { label: 'Perfil',          to: '/perfil', Icon: UserCircle },
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
