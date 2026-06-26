import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Trophy, Flame } from 'lucide-react'

function toYMD(d) { return d.toISOString().split('T')[0] }

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

export default function MyResults() {
  const { athlete } = useAuth()
  const [ranking,  setRanking]  = useState([])
  const [myStats,  setMyStats]  = useState({ points: 0, completions: 0 })
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!athlete?.group) return
    const weekDates = getWeekDates()
    const weekStart = toYMD(weekDates[0])
    const weekEnd   = toYMD(weekDates[6])

    async function load() {
      const { data: groupAthletes } = await supabase
        .from('athletes').select('id,name,avatar_url').eq('group', athlete.group).eq('active', true)

      if (!groupAthletes?.length) { setLoading(false); return }

      const ids = groupAthletes.map(a => a.id)
      const { data: comps } = await supabase
        .from('training_completions').select('athlete_id,points')
        .in('athlete_id', ids).gte('date', weekStart).lte('date', weekEnd)

      const totals = {}; const counts = {}
      ids.forEach(id => { totals[id] = 0; counts[id] = 0 })
      ;(comps || []).forEach(c => { totals[c.athlete_id] += c.points; counts[c.athlete_id]++ })

      const sorted = groupAthletes
        .map(a => ({ ...a, points: totals[a.id] || 0, count: counts[a.id] || 0, isMe: a.id === athlete.id }))
        .sort((a, b) => b.points - a.points)

      setRanking(sorted)
      const me = sorted.find(a => a.isMe)
      if (me) setMyStats({ points: me.points, completions: me.count })
      setLoading(false)
    }
    load()
  }, [athlete])

  if (loading) return <LoadingSpinner />

  const myRank = ranking.findIndex(a => a.isMe) + 1

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', padding: '32px 0 24px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 16px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(184,255,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Trophy size={24} style={{ color: 'var(--heh-green)' }} />
          </div>
          <h1 style={{ fontWeight: 900, fontSize: 28, letterSpacing: '-0.04em', fontStyle: 'italic', color: 'var(--text)', marginBottom: 4 }}>
            RANKING SEMANAL
          </h1>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            GRUPO {athlete?.group}
          </p>
        </div>

        {/* My position highlight */}
        {myRank > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 28 }}>
            {[
              { label: 'POSIÇÃO',   value: `#${myRank}`,          accent: myRank === 1 },
              { label: 'PONTOS',    value: myStats.points,         accent: false },
              { label: 'TREINOS',   value: myStats.completions,    accent: false },
            ].map(({ label, value, accent }) => (
              <div key={label} style={{ background: accent ? 'var(--heh-green)' : 'var(--surface)', borderRadius: 14, padding: '14px 10px', textAlign: 'center', border: accent ? 'none' : '1px solid var(--border)' }}>
                <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: accent ? '#080808' : 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: accent ? '#080808' : 'var(--text)' }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Ranking list */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
          {ranking.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderBottom: i < ranking.length - 1 ? '1px solid var(--border)' : 'none', background: a.isMe ? 'rgba(184,255,0,0.04)' : 'transparent' }}>
              {/* Position */}
              <span style={{ fontWeight: 900, fontSize: 18, width: 28, textAlign: 'center', color: i === 0 ? '#FFD60A' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--text-muted)', flexShrink: 0 }}>
                {i + 1}
              </span>

              {/* Avatar */}
              <div style={{ width: 40, height: 40, borderRadius: 12, background: a.isMe ? 'rgba(184,255,0,0.15)' : 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: a.isMe ? 'var(--heh-green)' : 'var(--text-muted)', flexShrink: 0, overflow: 'hidden' }}>
                {a.avatar_url ? <img src={a.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : a.name.slice(0,2).toUpperCase()}
              </div>

              {/* Name + stats */}
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: a.isMe ? 800 : 600, fontSize: 15, color: a.isMe ? 'var(--heh-green)' : 'var(--text)', marginBottom: 2 }}>
                  {a.name}{a.isMe ? ' (tu)' : ''}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.count} treino{a.count !== 1 ? 's' : ''}</p>
              </div>

              {/* Points */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <span style={{ fontWeight: 900, fontSize: 18, color: a.isMe ? 'var(--heh-green)' : 'var(--text)', letterSpacing: '-0.02em' }}>{a.points}</span>
                <Flame size={14} style={{ color: a.isMe ? 'var(--heh-green)' : 'var(--text-muted)' }} />
              </div>
            </div>
          ))}

          {ranking.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              Ainda sem dados para esta semana.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
