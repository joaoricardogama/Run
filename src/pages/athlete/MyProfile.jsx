import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { calculateZones, formatZoneRange, formatTime, parseTime } from '../../utils/pace'
import { CheckCircle2, AlertCircle } from 'lucide-react'

function ZonesDisplay({ prSeconds, distanceKm, label }) {
  if (!prSeconds || !distanceKm) return null
  const zones = calculateZones(prSeconds, distanceKm)
  if (!zones) return null

  return (
    <div className="bg-[#0f172a] rounded-xl p-4 text-white">
      <p className="text-xs text-slate-400 mb-3 font-medium">{label} — Zonas de ritmo</p>
      <div className="space-y-2">
        {[
          { key: 'CCL', label: 'CCL — Corrida Contínua Leve', color: 'bg-green-800 text-green-200' },
          { key: 'CCN', label: 'CCN — Corrida Contínua Normal', color: 'bg-yellow-800 text-yellow-200' },
          { key: 'CCR', label: 'CCR — Corrida Contínua Rápida', color: 'bg-red-800 text-red-200' },
        ].map(({ key, label: zLabel, color }) => (
          <div key={key} className="flex items-center justify-between">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{key}</span>
            <span className="pace-mono text-sm text-slate-200">{formatZoneRange(zones[key])}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-3">
        Ritmo base: <span className="pace-mono">{formatTime(Math.round(zones.base))}/km</span>
      </p>
    </div>
  )
}

export default function MyProfile() {
  const { athlete, refreshAthlete } = useAuth()
  const [pr5Field, setPr5Field] = useState(athlete?.pr_5km ? formatTime(athlete.pr_5km) : '')
  const [pr10Field, setPr10Field] = useState(athlete?.pr_10km ? formatTime(athlete.pr_10km) : '')
  const [stravaUrl, setStravaUrl] = useState(athlete?.strava_url || '')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)

  if (!athlete) return null

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setStatus(null)

    const pr5 = parseTime(pr5Field)
    const pr10 = parseTime(pr10Field)

    if (pr5Field && !pr5) { setStatus({ type: 'error', msg: 'Formato inválido para PR 5km (use MM:SS)' }); setSaving(false); return }
    if (pr10Field && !pr10) { setStatus({ type: 'error', msg: 'Formato inválido para PR 10km (use MM:SS)' }); setSaving(false); return }

    const update = {
      pr_5km: pr5 || null,
      pr_10km: pr10 || null,
      strava_url: stravaUrl || null,
    }

    const { error } = await supabase.from('athletes').update(update).eq('id', athlete.id)
    if (error) {
      setStatus({ type: 'error', msg: 'Erro ao guardar: ' + error.message })
    } else {
      await refreshAthlete()
      setStatus({ type: 'success', msg: 'Perfil guardado com sucesso!' })
    }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
      <h2 className="text-xl font-bold text-slate-800 mb-4">O Meu Perfil</h2>

      {/* Info */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
        <p className="text-sm font-semibold text-slate-700">{athlete.name}</p>
        <p className="text-xs text-slate-500">{athlete.email}</p>
        <span className="inline-block mt-2 text-xs font-bold px-2 py-0.5 bg-[#0f172a] text-[#38bdf8] rounded-full">
          {athlete.group || '—'}
        </span>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">PR 5km (MM:SS)</label>
            <input
              type="text"
              value={pr5Field}
              onChange={e => setPr5Field(e.target.value)}
              placeholder="22:30"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm pace-mono focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">PR 10km (MM:SS)</label>
            <input
              type="text"
              value={pr10Field}
              onChange={e => setPr10Field(e.target.value)}
              placeholder="48:00"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm pace-mono focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Perfil Strava</label>
          <input
            type="url"
            value={stravaUrl}
            onChange={e => setStravaUrl(e.target.value)}
            placeholder="https://www.strava.com/athletes/..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
          />
        </div>

        {status && (
          <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
            status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {status.msg}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#38bdf8] hover:bg-sky-400 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-60"
        >
          {saving ? 'A guardar...' : 'Guardar'}
        </button>
      </form>

      {/* Pace zones */}
      <div className="space-y-3">
        {athlete.pr_5km && (
          <ZonesDisplay prSeconds={athlete.pr_5km} distanceKm={5} label="PR 5km" />
        )}
        {athlete.pr_10km && (
          <ZonesDisplay prSeconds={athlete.pr_10km} distanceKm={10} label="PR 10km" />
        )}
        {!athlete.pr_5km && !athlete.pr_10km && (
          <div className="text-center text-slate-400 py-8 text-sm">
            Introduz os teus PRs para ver as zonas de ritmo calculadas.
          </div>
        )}
      </div>
    </div>
  )
}
