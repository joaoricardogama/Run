import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { formatDate, formatDistance } from '../../utils/pace'
import { MapPin, CheckCircle2, Circle } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function MyRaces() {
  const { athlete } = useAuth()
  const [races, setRaces] = useState([])
  const [confirmations, setConfirmations] = useState({})
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)

  useEffect(() => {
    if (!athlete) return
    async function load() {
      const [racesRes, confRes] = await Promise.all([
        supabase.from('races').select('*').order('date', { ascending: true }),
        supabase.from('athlete_races').select('*').eq('athlete_id', athlete.id),
      ])
      if (racesRes.data) setRaces(racesRes.data)
      if (confRes.data) {
        const map = {}
        confRes.data.forEach(r => { map[r.race_id] = r })
        setConfirmations(map)
      }
      setLoading(false)
    }
    load()
  }, [athlete])

  async function toggleConfirmation(race) {
    if (!athlete || toggling) return
    setToggling(race.id)
    const existing = confirmations[race.id]
    if (existing) {
      const { error } = await supabase.from('athlete_races').delete().eq('id', existing.id)
      if (!error) {
        setConfirmations(prev => { const next = { ...prev }; delete next[race.id]; return next })
      }
    } else {
      const { data, error } = await supabase.from('athlete_races')
        .insert({ athlete_id: athlete.id, race_id: race.id, confirmed: true })
        .select().single()
      if (!error && data) {
        setConfirmations(prev => ({ ...prev, [race.id]: data }))
      }
    }
    setToggling(null)
  }

  if (!athlete) return null
  if (loading) return <LoadingSpinner />

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = races.filter(r => r.date >= today)
  const past = races.filter(r => r.date < today)

  const RaceItem = ({ race }) => {
    const confirmed = !!confirmations[race.id]
    const isPast = race.date < today
    return (
      <div className="feed-card p-4 mb-3"
        style={{ opacity: isPast ? 0.55 : 1 }}>
        <div className="flex items-start gap-3">
          {/* Date block */}
          <div className="w-12 h-12 rounded-xl flex-shrink-0 flex flex-col items-center justify-center"
            style={{ background: 'rgba(252,76,2,0.12)', border: '1px solid rgba(252,76,2,0.2)' }}>
            <span className="text-xs font-black uppercase" style={{ color: 'var(--orange)' }}>
              {new Date(race.date + 'T00:00:00').toLocaleString('pt-PT', { month: 'short' })}
            </span>
            <span className="text-lg font-black leading-none" style={{ color: 'var(--orange)' }}>
              {new Date(race.date + 'T00:00:00').getDate()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{race.name}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              {race.location && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <MapPin size={11} /> {race.location}
                </span>
              )}
              <span className="text-xs font-bold" style={{ color: 'var(--orange)' }}>
                {formatDistance(race.distance_km)} km
              </span>
            </div>
            {race.description && (
              <p className="text-xs mt-1.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                {race.description}
              </p>
            )}
            {confirmed && !isPast && (
              <p className="text-xs mt-1.5 font-bold" style={{ color: '#30D158' }}>Confirmado ✓</p>
            )}
          </div>

          <button
            onClick={() => !isPast && toggleConfirmation(race)}
            disabled={isPast || toggling === race.id}
            className="flex-shrink-0 mt-0.5"
            style={{ opacity: isPast ? 0.3 : 1 }}>
            {confirmed
              ? <CheckCircle2 size={24} style={{ color: '#30D158' }} />
              : <Circle size={24} style={{ color: 'var(--text-muted)' }} />
            }
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-28" style={{ background: 'var(--dark)', minHeight: '100vh' }}>
      <h2 className="text-xl font-black mb-1" style={{ color: 'var(--text)' }}>Corridas</h2>
      <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
        Toca no círculo para confirmar participação
      </p>

      {upcoming.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: 'var(--text-muted)' }}>Próximas</p>
          {upcoming.map(r => <RaceItem key={r.id} race={r} />)}
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: 'var(--text-muted)' }}>Passadas</p>
          {past.slice().reverse().map(r => <RaceItem key={r.id} race={r} />)}
        </div>
      )}

      {races.length === 0 && (
        <div className="text-center py-16">
          <span className="text-4xl block mb-3">🏁</span>
          <p className="font-bold" style={{ color: 'var(--text)' }}>Sem corridas agendadas</p>
        </div>
      )}
    </div>
  )
}
