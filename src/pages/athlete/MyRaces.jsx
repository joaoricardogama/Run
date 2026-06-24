import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { formatDate, formatDistance } from '../../utils/pace'
import { Calendar, MapPin, ExternalLink, CheckCircle2, Circle } from 'lucide-react'
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
      const { error } = await supabase
        .from('athlete_races')
        .delete()
        .eq('id', existing.id)
      if (!error) {
        setConfirmations(prev => {
          const next = { ...prev }
          delete next[race.id]
          return next
        })
      }
    } else {
      const { data, error } = await supabase
        .from('athlete_races')
        .insert({ athlete_id: athlete.id, race_id: race.id, confirmed: true })
        .select()
        .single()
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
      <div className={`bg-white rounded-xl shadow-sm border p-4 transition-all ${
        confirmed ? 'border-[#38bdf8] ring-1 ring-[#38bdf8]/30' : 'border-slate-100'
      }`}>
        <div className="flex items-start gap-3">
          <button
            onClick={() => !isPast && toggleConfirmation(race)}
            disabled={isPast || toggling === race.id}
            className={`mt-0.5 flex-shrink-0 ${isPast ? 'opacity-30 cursor-default' : 'cursor-pointer'}`}
          >
            {confirmed
              ? <CheckCircle2 size={22} className="text-[#38bdf8]" />
              : <Circle size={22} className="text-slate-300" />
            }
          </button>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800">{race.name}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar size={12} />
                {formatDate(race.date)}
              </span>
              {race.location && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={12} />
                  {race.location}
                </span>
              )}
              <span className="text-xs font-bold text-[#38bdf8]">
                {formatDistance(race.distance_km)} km
              </span>
            </div>
            {race.description && (
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{race.description}</p>
            )}
          </div>

          {race.registration_url && (
            <a
              href={race.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-[#38bdf8] hover:text-sky-600"
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>

        {confirmed && !isPast && (
          <div className="mt-2 ml-9">
            <span className="text-xs text-[#38bdf8] font-medium">Confirmado ✓</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
      <h2 className="text-xl font-bold text-slate-800 mb-1">Corridas</h2>
      <p className="text-xs text-slate-500 mb-4">Toca no círculo para confirmar participação</p>

      {upcoming.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wide">Próximas</h3>
          <div className="space-y-3">
            {upcoming.map(r => <RaceItem key={r.id} race={r} />)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Passadas</h3>
          <div className="space-y-3 opacity-60">
            {past.slice().reverse().map(r => <RaceItem key={r.id} race={r} />)}
          </div>
        </div>
      )}

      {races.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p className="font-semibold">Sem corridas agendadas</p>
        </div>
      )}
    </div>
  )
}
