import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { formatDate, formatTime, formatDistance, parseTime, calcPacePerKm } from '../../utils/pace'
import { Plus, Upload, Link as LinkIcon, Trophy, X } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

const inputStyle = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 14,
  width: '100%',
  outline: 'none',
}

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
      const { error: upErr } = await supabase.storage.from('certificates').upload(path, file, { upsert: false })
      if (upErr) { setError('Erro ao carregar ficheiro: ' + upErr.message); setSaving(false); return }
      const { data: urlData } = supabase.storage.from('certificates').getPublicUrl(path)
      certificateUrl = urlData?.publicUrl || null
    }

    const payload = {
      athlete_id: athlete.id, race_id: raceId || null, date,
      distance_km: distKm, time_seconds: timeSeconds,
      notes: notes || null, certificate_url: certificateUrl, strava_url: stravaUrl || null,
    }

    const { data, error: insErr } = await supabase.from('results').insert(payload).select().single()
    if (insErr) { setError('Erro ao guardar: ' + insErr.message) }
    else { onSaved(data); onClose() }
    setSaving(false)
  }

  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full sm:max-w-md overflow-y-auto max-h-[90vh]"
        style={{ background: 'var(--surface)', borderRadius: '20px 20px 0 0', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
        className="sm:rounded-2xl">
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-black text-base" style={{ color: 'var(--text)' }}>Registar Resultado</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <label style={labelStyle}>Distância (km)</label>
              <input type="number" step="0.01" min="0.1" value={distance} onChange={e => setDistance(e.target.value)}
                required placeholder="10" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Tempo (MM:SS)</label>
            <input type="text" value={timeStr} onChange={e => setTimeStr(e.target.value)}
              required placeholder="52:30" className="pace-mono" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>

          <div>
            <label style={labelStyle}>Corrida (opcional)</label>
            <select value={raceId} onChange={e => setRaceId(e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}>
              <option value="">— Nenhuma —</option>
              {races.map(r => <option key={r.id} value={r.id}>{r.name} ({formatDate(r.date)})</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Notas</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Como correu..." style={{ ...inputStyle, resize: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>

          <div>
            <label style={labelStyle}><LinkIcon size={11} className="inline mr-1" />URL Strava</label>
            <input type="url" value={stravaUrl} onChange={e => setStravaUrl(e.target.value)}
              placeholder="https://www.strava.com/activities/..." style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>

          <div>
            <label style={labelStyle}><Upload size={11} className="inline mr-1" />Certificado</label>
            <input type="file" accept=".pdf,image/*" onChange={e => setFile(e.target.files[0])}
              style={{ color: 'var(--text-muted)', fontSize: 13 }} />
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{ background: 'rgba(255,69,58,0.12)', color: '#FF453A' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={saving}
            className="w-full py-4 rounded-xl text-sm font-bold disabled:opacity-50"
            style={{ background: 'var(--orange)', color: 'white' }}>
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
        supabase.from('results').select('*, races(name, date)').eq('athlete_id', athlete.id).order('date', { ascending: false }),
        supabase.from('races').select('id, name, date').order('date', { ascending: false }),
      ])
      if (resRes.data) setResults(resRes.data)
      if (racesRes.data) setRaces(racesRes.data)
      setLoading(false)
    }
    load()
  }, [athlete])

  if (!athlete) return null
  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-28" style={{ background: 'var(--dark)', minHeight: '100vh' }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>Os Meus Resultados</h2>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full"
          style={{ background: 'var(--orange)', color: 'white' }}>
          <Plus size={16} /> Novo
        </button>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-16">
          <Trophy size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', opacity: 0.3 }} />
          <p className="font-bold" style={{ color: 'var(--text)' }}>Sem resultados ainda</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Regista o teu primeiro resultado!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map(result => {
            const pace = calcPacePerKm(result.time_seconds, result.distance_km)
            return (
              <div key={result.id} className="feed-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                      {formatDistance(result.distance_km)} km
                      {result.races?.name && (
                        <span className="font-normal ml-2" style={{ color: 'var(--text-muted)' }}>
                          — {result.races.name}
                        </span>
                      )}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDate(result.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="pace-mono font-bold" style={{ color: 'var(--text)' }}>{formatTime(result.time_seconds)}</p>
                    {pace && (
                      <p className="pace-mono text-xs" style={{ color: 'var(--text-muted)' }}>{formatTime(Math.round(pace))}/km</p>
                    )}
                  </div>
                </div>

                {result.notes && (
                  <p className="text-xs mt-2.5 pt-2.5" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                    {result.notes}
                  </p>
                )}

                {(result.strava_url || result.certificate_url) && (
                  <div className="flex gap-4 mt-2">
                    {result.strava_url && (
                      <a href={result.strava_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-bold" style={{ color: 'var(--orange)' }}>
                        Strava →
                      </a>
                    )}
                    {result.certificate_url && (
                      <a href={result.certificate_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-bold" style={{ color: '#0A84FF' }}>
                        Certificado →
                      </a>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <AddResultModal races={races} onClose={() => setShowModal(false)} onSaved={r => setResults(p => [r, ...p])} />
      )}
    </div>
  )
}
