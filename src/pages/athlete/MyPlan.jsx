import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { generateIndividualPlan } from '../../utils/planGenerator'
import { formatDate, calculateZones, formatZoneRange } from '../../utils/pace'
import SessionCard from '../../components/SessionCard'
import LoadingSpinner from '../../components/LoadingSpinner'

const GROUPS = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6']
const DAYS_PT = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

function WeekView({ weekData }) {
  return (
    <div className="mb-6">
      <h3 className="font-semibold text-slate-700 mb-3 text-sm">{weekData.label}</h3>
      <div className="space-y-1">
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
        supabase
          .from('individual_plans')
          .select('*')
          .eq('athlete_id', athlete.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('general_plans')
          .select('*')
          .order('week_start', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      if (indRes.data) {
        setIndividualPlan(indRes.data)
        const plan = generateIndividualPlan(athlete, indRes.data.objective, indRes.data.weeks || 3)
        setGeneratedPlan(plan)
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
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
      <h2 className="text-xl font-bold text-slate-800 mb-1">Meu Plano</h2>

      {individualPlan && zones && (
        <div className="bg-[#0f172a] text-white rounded-xl p-4 mb-4">
          <p className="text-xs text-slate-400 mb-2">Objetivo: {individualPlan.objective} · Zonas de ritmo</p>
          <div className="grid grid-cols-3 gap-2">
            {['CCL', 'CCN', 'CCR'].map(z => (
              <div key={z} className="text-center">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  z === 'CCL' ? 'bg-green-800 text-green-200' :
                  z === 'CCN' ? 'bg-yellow-800 text-yellow-200' :
                  'bg-red-800 text-red-200'
                }`}>{z}</span>
                <p className="pace-mono text-xs text-slate-300 mt-1">{formatZoneRange(zones[z])}</p>
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
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-sm text-blue-700">
            A mostrar o plano do teu grupo ({athlete.group}). O treinador ainda não criou um plano individual.
          </div>
          <p className="text-xs text-slate-500 mb-3">Semana de {formatDate(generalPlan.week_start)}</p>
          {DAYS_PT.map(day => {
            const sessions = generalPlan.content?.[athlete.group]?.[day.toLowerCase()] || []
            if (sessions.length === 0) return null
            return (
              <div key={day} className="mb-3">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">{day}</p>
                {sessions.map((s, i) => <SessionCard key={i} session={s} />)}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <p className="font-semibold">Sem plano disponível</p>
          <p className="text-sm mt-1">Aguarda a publicação do plano pelo treinador.</p>
        </div>
      )}
    </div>
  )
}
