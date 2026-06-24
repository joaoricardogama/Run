import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { generateIndividualPlan } from '../../utils/planGenerator'
import { formatDate, calculateZones, formatZoneRange } from '../../utils/pace'
import SessionCard from '../../components/SessionCard'
import LoadingSpinner from '../../components/LoadingSpinner'

const DAYS_PT = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

const ZONE_CONFIG = [
  { key: 'CCL', label: 'CCL', bg: 'rgba(48,209,88,0.12)', text: '#30D158' },
  { key: 'CCN', label: 'CCN', bg: 'rgba(255,214,10,0.12)', text: '#FFD60A' },
  { key: 'CCR', label: 'CCR', bg: 'rgba(255,69,58,0.12)', text: '#FF453A' },
]

function WeekView({ weekData }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-bold uppercase tracking-widest mb-3 px-1"
        style={{ color: 'var(--orange)' }}>{weekData.label}</p>
      <div>
        {weekData.days.map(({ day, session }) => (
          <SessionCard key={day} session={session} day={day} />
        ))}
      </div>
    </div>
  )
}

export default function MyPlan() {
  const { athlete } = useAuth()
  const [individualPlan, setIndividualPlan] = useState(null)
  const [generalPlan, setGeneralPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generatedPlan, setGeneratedPlan] = useState(null)

  useEffect(() => {
    if (!athlete) return
    async function load() {
      const [indRes, genRes] = await Promise.all([
        supabase.from('individual_plans').select('*').eq('athlete_id', athlete.id)
          .order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('general_plans').select('*')
          .order('week_start', { ascending: false }).limit(1).maybeSingle(),
      ])
      if (indRes.data) {
        setIndividualPlan(indRes.data)
        setGeneratedPlan(generateIndividualPlan(athlete, indRes.data.objective, indRes.data.weeks || 3))
      }
      if (genRes.data) setGeneralPlan(genRes.data)
      setLoading(false)
    }
    load()
  }, [athlete])

  if (!athlete) return null
  if (loading) return <LoadingSpinner />

  const prSeconds = individualPlan
    ? (individualPlan.objective === '5km' ? athlete.pr_5km : athlete.pr_10km)
    : null
  const distKm = individualPlan?.objective === '5km' ? 5 : 10
  const zones = prSeconds ? calculateZones(prSeconds, distKm) : null

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-28" style={{ background: 'var(--dark)', minHeight: '100vh' }}>
      <h2 className="text-xl font-black mb-4" style={{ color: 'var(--text)' }}>Meu Plano</h2>

      {zones && (
        <div className="feed-card p-4 mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--text-muted)' }}>
            Objetivo {individualPlan.objective} — Zonas de ritmo
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ZONE_CONFIG.map(({ key, label, bg, text }) => (
              <div key={key} className="rounded-xl p-3 text-center"
                style={{ background: bg }}>
                <p className="text-xs font-black mb-1" style={{ color: text }}>{label}</p>
                <p className="pace-mono text-xs font-medium" style={{ color: 'var(--text)' }}>
                  {formatZoneRange(zones[key])}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {individualPlan && generatedPlan ? (
        <div>
          {generatedPlan.map(week => (
            <WeekView key={week.week} weekData={week} />
          ))}
        </div>
      ) : generalPlan ? (
        <div>
          <div className="feed-card p-3 mb-4">
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              A mostrar o plano do grupo <span style={{ color: 'var(--orange)' }}>{athlete.group}</span>. O treinador ainda não criou um plano individual.
            </p>
          </div>
          <p className="text-xs mb-3 px-1" style={{ color: 'var(--text-muted)' }}>
            Semana de {formatDate(generalPlan.week_start)}
          </p>
          {DAYS_PT.map(day => {
            const sessions = generalPlan.content?.[athlete.group]?.[day.toLowerCase()] || []
            if (sessions.length === 0) return null
            return (
              <div key={day} className="mb-3">
                {sessions.map((s, i) => <SessionCard key={i} session={s} day={day} />)}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--surface)' }}>
            <span className="text-3xl">📋</span>
          </div>
          <p className="font-bold" style={{ color: 'var(--text)' }}>Sem plano disponível</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Aguarda a publicação do plano pelo treinador.
          </p>
        </div>
      )}
    </div>
  )
}
