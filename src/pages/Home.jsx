import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, ExternalLink, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDate, formatDistance } from '../utils/pace'
import SessionCard from '../components/SessionCard'
import LoadingSpinner from '../components/LoadingSpinner'

const GROUPS = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6']
const DAYS_PT = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

const GROUP_COLORS = {
  G1: 'bg-blue-100 text-blue-800 border-blue-200',
  G2: 'bg-green-100 text-green-800 border-green-200',
  G3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  G4: 'bg-orange-100 text-orange-800 border-orange-200',
  G5: 'bg-red-100 text-red-800 border-red-200',
  G6: 'bg-purple-100 text-purple-800 border-purple-200',
}

function WeekDayPlan({ day, sessions }) {
  if (!sessions || sessions.length === 0) return null
  return (
    <div className="mb-2">
      <p className="text-xs font-bold text-slate-500 uppercase mb-1">{day}</p>
      {sessions.map((s, i) => (
        <SessionCard key={i} session={s} />
      ))}
    </div>
  )
}

function GroupPlanCard({ group, plan }) {
  const [expanded, setExpanded] = useState(false)
  const colorCls = GROUP_COLORS[group] || 'bg-slate-100 text-slate-800'

  const hasSessions = plan && DAYS_PT.some(d => {
    const key = d.toLowerCase()
    return plan[key] && plan[key].length > 0
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <span className={`font-bold text-sm px-3 py-1 rounded-full border ${colorCls}`}>
            {group}
          </span>
          <span className="text-sm text-slate-600 font-medium">
            {hasSessions ? 'Plano semanal disponível' : 'Sem plano esta semana'}
          </span>
        </div>
        <ChevronRight
          size={18}
          className={`text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {expanded && hasSessions && (
        <div className="px-4 pb-4 border-t border-slate-50">
          <div className="mt-3">
            {DAYS_PT.map(day => {
              const key = day.toLowerCase()
              const sessions = plan[key] || []
              if (sessions.length === 0) return null
              return <WeekDayPlan key={day} day={day} sessions={sessions} />
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [generalPlan, setGeneralPlan] = useState(null)
  const [races, setRaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('plano')

  useEffect(() => {
    async function load() {
      const [planRes, racesRes] = await Promise.all([
        supabase
          .from('general_plans')
          .select('*')
          .order('week_start', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('races')
          .select('*')
          .gte('date', new Date().toISOString().slice(0, 10))
          .order('date', { ascending: true })
          .limit(20),
      ])
      if (planRes.data) setGeneralPlan(planRes.data)
      if (racesRes.data) setRaces(racesRes.data)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero */}
      <div className="bg-[#0f172a] text-white px-4 py-6">
        <h1 className="text-2xl font-bold">
          <span className="text-[#38bdf8]">Run</span>Tejo
        </h1>
        <p className="text-slate-400 text-sm mt-1">Plano de treino semanal e calendário de corridas</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-14 z-30">
        <div className="flex">
          {[
            { key: 'plano', label: 'Plano da Semana' },
            { key: 'corridas', label: 'Calendário' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-[#38bdf8] text-[#38bdf8]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 pb-6">
        {loading ? (
          <LoadingSpinner />
        ) : activeTab === 'plano' ? (
          <div>
            {generalPlan ? (
              <>
                <p className="text-xs text-slate-500 mb-3">
                  Semana de {formatDate(generalPlan.week_start)}
                </p>
                <div className="space-y-3">
                  {GROUPS.map(group => (
                    <GroupPlanCard
                      key={group}
                      group={group}
                      plan={generalPlan.content?.[group]}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p className="text-lg font-semibold">Sem plano publicado</p>
                <p className="text-sm mt-1">O treinador ainda não publicou o plano desta semana.</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {races.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-lg font-semibold">Sem corridas agendadas</p>
                <p className="text-sm mt-1">Fique atento para novas corridas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {races.map(race => (
                  <div key={race.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{race.name}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
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
                          className="flex-shrink-0 flex items-center gap-1 text-xs text-[#38bdf8] hover:text-sky-600"
                        >
                          <ExternalLink size={14} />
                          Inscrever
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
