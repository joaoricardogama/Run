import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, ExternalLink, ChevronRight, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDate, formatDistance } from '../utils/pace'
import SessionCard from '../components/SessionCard'
import LoadingSpinner from '../components/LoadingSpinner'

const GROUPS = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6']
const DAYS_PT = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']

const GROUP_COLORS = {
  G1: { bg: 'rgba(48,209,88,0.12)',  text: '#30D158', border: 'rgba(48,209,88,0.3)' },
  G2: { bg: 'rgba(10,132,255,0.12)', text: '#0A84FF', border: 'rgba(10,132,255,0.3)' },
  G3: { bg: 'rgba(255,214,10,0.12)', text: '#FFD60A', border: 'rgba(255,214,10,0.3)' },
  G4: { bg: 'rgba(255,159,10,0.12)', text: '#FF9F0A', border: 'rgba(255,159,10,0.3)' },
  G5: { bg: 'rgba(255,69,58,0.12)',  text: '#FF453A', border: 'rgba(255,69,58,0.3)' },
  G6: { bg: 'rgba(191,90,242,0.12)', text: '#BF5AF2', border: 'rgba(191,90,242,0.3)' },
}

function GroupPlanCard({ group, plan }) {
  const [expanded, setExpanded] = useState(false)
  const clr = GROUP_COLORS[group] || GROUP_COLORS.G1

  const sessions = DAYS_PT.flatMap(d => plan?.[d] || [])
  const sessionCount = sessions.length

  return (
    <div className="feed-card mb-3">
      <button onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
            style={{ background: clr.bg, color: clr.text, border: `1px solid ${clr.border}` }}>
            {group}
          </div>
          <div className="text-left">
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Grupo {group}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {sessionCount > 0 ? `${sessionCount} sessões esta semana` : 'Sem sessões'}
            </p>
          </div>
        </div>
        {expanded
          ? <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />
          : <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />}
      </button>

      {expanded && sessionCount > 0 && (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="pt-3">
            {DAYS_PT.map(day => {
              const daySessions = plan?.[day] || []
              if (!daySessions.length) return null
              return (
                <div key={day} className="mb-2">
                  {daySessions.map((s, i) => <SessionCard key={i} session={s} day={day} />)}
                </div>
              )
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
        supabase.from('general_plans').select('*').order('week_start', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('races').select('*').gte('date', new Date().toISOString().slice(0, 10)).order('date').limit(20),
      ])
      if (planRes.data) setGeneralPlan(planRes.data)
      if (racesRes.data) setRaces(racesRes.data)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-2xl mx-auto" style={{ background: 'var(--dark)', minHeight: '100vh' }}>
      {/* Hero */}
      <div className="px-4 pt-5 pb-4" style={{ background: 'var(--dark)' }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5"
              style={{ color: 'var(--orange)' }}>Run Tejo</p>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
              Plano de Treino
            </h1>
          </div>
          <Link to="/login"
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            Entrar
          </Link>
        </div>
        {generalPlan && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Semana de {formatDate(generalPlan.week_start)}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="sticky top-14 z-30 flex px-4 gap-6"
        style={{ background: 'var(--dark)', borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[
          { key: 'plano', label: 'Plano Semanal' },
          { key: 'corridas', label: 'Calendário' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`text-sm font-bold pb-3 transition-colors ${tab.key === activeTab ? 'tab-active' : ''}`}
            style={{ color: tab.key === activeTab ? 'var(--orange)' : 'var(--text-muted)', borderBottom: tab.key === activeTab ? '2px solid var(--orange)' : '2px solid transparent' }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 pb-8">
        {loading ? <LoadingSpinner /> : activeTab === 'plano' ? (
          <div>
            {generalPlan ? (
              GROUPS.map(g => (
                <GroupPlanCard key={g} group={g} plan={generalPlan.content?.[g]} />
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'var(--surface)' }}>
                  <span className="text-3xl">📋</span>
                </div>
                <p className="font-bold text-lg" style={{ color: 'var(--text)' }}>Sem plano publicado</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>O treinador ainda não publicou o plano desta semana.</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {races.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'var(--surface)' }}>
                  <span className="text-3xl">🏁</span>
                </div>
                <p className="font-bold text-lg" style={{ color: 'var(--text)' }}>Sem corridas agendadas</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Fique atento para novas corridas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {races.map(race => (
                  <div key={race.id} className="feed-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3 flex-1 min-w-0">
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
                          <p className="font-bold text-sm leading-tight" style={{ color: 'var(--text)' }}>{race.name}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
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
                        </div>
                      </div>
                      {race.registration_url && (
                        <a href={race.registration_url} target="_blank" rel="noopener noreferrer"
                          className="flex-shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full"
                          style={{ background: 'var(--orange)', color: 'white' }}>
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
