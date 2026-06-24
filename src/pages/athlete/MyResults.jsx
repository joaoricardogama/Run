import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { formatDate, formatTime, formatDistance, parseTime, calcPacePerKm } from '../../utils/pace'
import { Plus, Upload, Link as LinkIcon, Trophy, X } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

function AddResultModal({ races, onClose, onSaved }) {
  const { athlete } = useAuth()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [distance, setDistance] = useState('')
  const [timeStr, setTimeStr] = useState('')
  const [notes, setNotes] = useState('')
  const [raceId, setRaceId] = useState('')
  const [stravaUrl, setStravaUrl] = useState('')
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const timeSeconds = parseTime(timeStr)
    if (!timeSeconds) { setError('Formato de tempo inválido. Use MM:SS'); return }
    const distKm = parseFloat(distance)
    if (!distKm || distKm <= 0) { setError('Distância inválida'); return }

    setSaving(true)
    setError('')
    let certificateUrl = null

    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${athlete.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('certificates')
        .upload(path, file, { upsert: false })
      if (upErr) {
        setError('Erro ao carregar ficheiro: ' + upErr.message)
        setSaving(false)
        return
      }
      const { data: urlData } = supabase.storage.from('certificates').getPublicUrl(path)
      certificateUrl = urlData?.publicUrl || null
    }

    const payload = {
      athlete_id: athlete.id,
      race_id: raceId || null,
      date,
      distance_km: distKm,
      time_seconds: timeSeconds,
      notes: notes || null,
      certificate_url: certificateUrl,
      strava_url: stravaUrl || null,
    }

    const { data, error: insErr } = await supabase.from('results').insert(payload).select().single()
    if (insErr) {
      setError('Erro ao guardar: ' + insErr.message)
    } else {
      onSaved(data)
      onClose()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Registar Resultado</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Data</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Distância (km)</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={distance}
                onChange={e => setDistance(e.target.value)}
                required
                placeholder="10"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tempo (MM:SS)</label>
            <input
              type="text"
              value={timeStr}
              onChange={e => setTimeStr(e.target.value)}
              required
              placeholder="52:30"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm pace-mono focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Corrida (opcional)</label>
            <select
              value={raceId}
              onChange={e => setRaceId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
            >
              <option value="">— Nenhuma —</option>
              {races.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({formatDate(r.date)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Como correu..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              <LinkIcon size={12} className="inline mr-1" />
              URL Strava
            </label>
            <input
              type="url"
              value={stravaUrl}
              onChange={e => setStravaUrl(e.target.value)}
              placeholder="https://www.strava.com/activities/..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              <Upload size={12} className="inline mr-1" />
              Certificado (PDF ou imagem)
            </label>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={e => setFile(e.target.files[0])}
              className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#38bdf8] file:text-white hover:file:bg-sky-400"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#38bdf8] hover:bg-sky-400 text-white font-semibold rounded-lg py-3 text-sm transition-colors disabled:opacity-60"
          >
            {saving ? 'A guardar...' : 'Guardar resultado'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function MyResults() {
  const { athlete } = useAuth()
  const [results, setResults] = useState([])
  const [races, setRaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!athlete) return
    async function load() {
      const [resRes, racesRes] = await Promise.all([
        supabase
          .from('results')
          .select('*, races(name, date)')
          .eq('athlete_id', athlete.id)
          .order('date', { ascending: false }),
        supabase.from('races').select('id, name, date').order('date', { ascending: false }),
      ])
      if (resRes.data) setResults(resRes.data)
      if (racesRes.data) setRaces(racesRes.data)
      setLoading(false)
    }
    load()
  }, [athlete])

  function handleSaved(result) {
    setResults(prev => [result, ...prev])
  }

  if (!athlete) return null
  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800">Os Meus Resultados</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-[#38bdf8] text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-sky-400 transition-colors"
        >
          <Plus size={16} />
          Novo
        </button>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Trophy size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Sem resultados ainda</p>
          <p className="text-sm mt-1">Regista o teu primeiro resultado!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map(result => {
            const pace = calcPacePerKm(result.time_seconds, result.distance_km)
            return (
              <div key={result.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {formatDistance(result.distance_km)} km
                      {result.races?.name && (
                        <span className="text-xs text-slate-500 font-normal ml-2">
                          — {result.races.name}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDate(result.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="pace-mono font-bold text-slate-800">{formatTime(result.time_seconds)}</p>
                    {pace && (
                      <p className="pace-mono text-xs text-slate-500">{formatTime(Math.round(pace))}/km</p>
                    )}
                  </div>
                </div>

                {result.notes && (
                  <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-50">{result.notes}</p>
                )}

                <div className="flex gap-3 mt-2">
                  {result.strava_url && (
                    <a
                      href={result.strava_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-orange-500 hover:text-orange-700 font-medium"
                    >
                      Strava →
                    </a>
                  )}
                  {result.certificate_url && (
                    <a
                      href={result.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#38bdf8] hover:text-sky-700 font-medium"
                    >
                      Certificado →
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <AddResultModal
          races={races}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
