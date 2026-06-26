import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/LoadingSpinner'

const DAYS_PT   = ['domingo','segunda','terça','quarta','quinta','sexta','sábado']
const DAYS_LONG = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function toYMD(d) { return d.toISOString().split('T')[0] }

function getWeekDates(offset = 0) {
  const today = new Date()
  const dow = today.getDay()
  const mon = new Date(today)
  mon.setDate(today.getDate() - ((dow + 6) % 7) + offset * 7)
  mon.setHours(0,0,0,0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i); return d
  })
}

const TYPE_COLORS = {
  CCL:      { bg: 'rgba(184,255,0,0.15)',   text: '#B8FF00' },
  CCN:      { bg: 'rgba(255,214,10,0.15)',  text: '#FFD60A' },
  CCR:      { bg: 'rgba(255,69,58,0.15)',   text: '#FF453A' },
  Pista:    { bg: 'rgba(10,132,255,0.15)',  text: '#0A84FF' },
  Descanso: { bg: 'rgba(255,255,255,0.05)', text: '#555'    },
  default:  { bg: 'rgba(184,255,0,0.15)',   text: '#B8FF00' },
}

function TypeBadge({ type }) {
  const clr = TYPE_COLORS[type] || TYPE_COLORS.default
  return (
    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 6, background: clr.bg, color: clr.text, textTransform: 'uppercase' }}>
      {type}
    </span>
  )
}

export default function MyPlan() {
  const { athlete } = useAuth()
  const [weekOffset,  setWeekOffset]  = useState(0)
  const [plan,        setPlan]        = useState(null)
  const [completions, setCompletions] = useState([])
  const [loading,     setLoading]     = useState(true)

  const weekDates = getWeekDates(weekOffset)
  const today     = toYMD(new Date())
  const weekStart = toYMD(weekDates[0])
  const weekEnd   = toYMD(weekDates[6])

  useEffect(() => {
    if (!athlete) return
    setLoading(true)
    Promise.all([
      supabase.from('general_plans').select('content,week_start')
        .gte('week_start', weekStart).lte('week_start', weekEnd)
        .order('week_start', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('training_completions').select('date,points,confirmed_by_strava')
        .eq('athlete_id', athlete.id).gte('date', weekStart).lte('date', weekEnd),
    ]).then(([{ data: planData }, { data: compData }]) => {
      setPlan(planData)
      setCompletions(compData || [])
      setLoading(false)
    })
  }, [athlete, weekStart])

  if (loading) return <LoadingSpinner />

  const groupPlan    = plan?.content?.[athlete?.group] || {}
  const completedSet = new Set((completions || []).map(c => c.date))
  const stravaSet    = new Set((completions || []).filter(c => c.confirmed_by_strava).map(c => c.date))
  const weekLabel    = `${weekDates[0].getDate()} de ${MONTHS_PT[weekDates[0].getMonth()].toUpperCase()}`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', padding: '32px 0 24px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px' }}>

        {/* Header */}
        <h1 style={{ fontWeight: 900, fontSize: 28, letterSpacing: '-0.04em', fontStyle: 'italic', color: 'var(--text)', marginBottom: 4 }}>
          PLANO DE TREINO
        </h1>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 24 }}>
          SEMANA DE {weekLabel}
        </p>

        {/* Week nav */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button onClick={() => setWeekOffset(w => w - 1)}
            style={{ padding: '8px 16px', borderRadius: 10, background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            ← Anterior
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)}
              style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(184,255,0,0.08)', color: 'var(--heh-green)', border: '1px solid rgba(184,255,0,0.3)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Esta semana
            </button>
          )}
          <button onClick={() => setWeekOffset(w => w + 1)}
            style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 10, background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Seguinte →
          </button>
        </div>

        {/* Days */}
        <div>
          {weekDates.map((date, i) => {
            const ds       = toYMD(date)
            const dow      = DAYS_PT[date.getDay()]
            const sessions = groupPlan[dow] || []
            const done     = completedSet.has(ds)
            const strava   = stravaSet.has(ds)
            const isToday  = ds === today
            const isPast   = date < new Date() && !isToday

            return (
              <div key={i} style={{ display: 'flex', gap: 16, padding: '18px 0', borderBottom: i < 6 ? '1px solid var(--border)' : 'none' }}>
                {/* Day label */}
                <div style={{ width: 56, flexShrink: 0, textAlign: 'right' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 2 }}>
                    {DAYS_LONG[date.getDay()].toUpperCase()}
                  </p>
                  <p style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: isToday ? 'var(--heh-green)' : isPast ? 'var(--text-muted)' : 'var(--text)' }}>
                    {date.getDate()}
                  </p>
                </div>

                {/* Sessions */}
                <div style={{ flex: 1 }}>
                  {sessions.length === 0 ? (
                    <p style={{ paddingTop: 6, fontSize: 13, color: 'var(--text-muted)' }}>Descanso / Livre</p>
                  ) : sessions.map((session, si) => (
                    <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: si < sessions.length - 1 ? 8 : 0, background: 'var(--surface)', borderRadius: 12, padding: '12px 14px', border: isToday ? '1px solid rgba(184,255,0,0.2)' : '1px solid var(--border)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          <TypeBadge type={session.type} />
                          {done && <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(48,209,88,0.15)', color: '#30D158' }}>CONCLUÍDO</span>}
                          {strava && <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(252,76,2,0.15)', color: '#FC4C02' }}>STRAVA</span>}
                        </div>
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: session.notes ? 4 : 0 }}>
                          {session.description || session.type}
                        </p>
                        {session.notes && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{session.notes}</p>}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {session.distance && <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{session.distance} km</p>}
                        {session.pace && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{session.pace}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {!plan && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 14, background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', marginTop: 16 }}>
            O teu treinador ainda não publicou o plano desta semana.
          </div>
        )}
      </div>
    </div>
  )
}
