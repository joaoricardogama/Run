import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, formatDistance } from '../../utils/pace'
import { Plus, Edit2, Trash2, X, Users, MapPin, Camera, Sparkles } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { extractRaceFromImage } from '../../utils/extractRaceFromImage'

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
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 5,
}

function RaceModal({ race, onClose, onSaved }) {
  const isNew = !race
  const [form, setForm] = useState({
    name: race?.name || '', date: race?.date || '', distance_km: race?.distance_km || '',
    location: race?.location || '', description: race?.description || '',
    registration_url: race?.registration_url || '',
  })
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importOk, setImportOk] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleImageImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setError('')
    setImportOk(false)
    try {
      const extracted = await extractRaceFromImage(file)
      if (extracted.name) set('name', extracted.name)
      if (extracted.date) set('date', extracted.date)
      if (extracted.distance_km) set('distance_km', String(extracted.distance_km))
      if (extracted.location) set('location', extracted.location)
      if (extracted.description) set('description', extracted.description)
      if (extracted.registration_url) set('registration_url', extracted.registration_url)
      setImportOk(true)
    } catch (err) {
      setError('Erro ao analisar imagem: ' + err.message)
    }
    setImporting(false)
    e.target.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      distance_km: parseFloat(form.distance_km) || null,
      description: form.description || null,
      registration_url: form.registration_url || null,
      location: form.location || null,
    }
    const result = isNew
      ? await supabase.from('races').insert(payload).select().single()
      : await supabase.from('races').update(payload).eq('id', race.id).select().single()
    if (result.error) { setError('Erro: ' + result.error.message) }
    else { onSaved(result.data); onClose() }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-black" style={{ color: 'var(--text)' }}>{isNew ? 'Nova Corrida' : 'Editar Corrida'}</h3>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageImport} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={importing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              style={{ background: importOk ? 'rgba(48,209,88,0.12)' : 'var(--surface2)', color: importOk ? '#30D158' : 'var(--orange)', border: `1px solid ${importOk ? 'rgba(48,209,88,0.3)' : 'rgba(252,76,2,0.3)'}` }}>
              {importing
                ? <><Sparkles size={13} className="animate-spin" /> A analisar...</>
                : importOk
                  ? <>✓ Importado</>
                  : <><Camera size={13} /> Importar da imagem</>
              }
            </button>
            <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label style={labelStyle}>Nome</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Data</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <label style={labelStyle}>Distância (km)</label>
              <input type="number" step="0.01" min="0.1" value={form.distance_km}
                onChange={e => set('distance_km', e.target.value)} required style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Local</label>
            <input value={form.location} onChange={e => set('location', e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          <div>
            <label style={labelStyle}>Descrição</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
              style={{ ...inputStyle, resize: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          <div>
            <label style={labelStyle}>URL Inscrições</label>
            <input type="url" value={form.registration_url} onChange={e => set('registration_url', e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(255,69,58,0.12)', color: '#FF453A' }}>{error}</div>
          )}
          <button type="submit" disabled={saving}
            className="w-full py-3.5 rounded-xl text-sm font-bold disabled:opacity-50"
            style={{ background: 'var(--orange)', color: 'white' }}>
            {saving ? 'A guardar...' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Races() {
  const [races, setRaces] = useState([])
  const [confirmCounts, setConfirmCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    async function load() {
      const [racesRes, confRes] = await Promise.all([
        supabase.from('races').select('*').order('date', { ascending: true }),
        supabase.from('athlete_races').select('race_id'),
      ])
      if (racesRes.data) setRaces(racesRes.data)
      if (confRes.data) {
        const counts = {}
        confRes.data.forEach(r => { counts[r.race_id] = (counts[r.race_id] || 0) + 1 })
        setConfirmCounts(counts)
      }
      setLoading(false)
    }
    load()
  }, [])

  function handleSaved(race) {
    setRaces(prev => {
      const idx = prev.findIndex(r => r.id === race.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = race; return n }
      return [...prev, race].sort((a, b) => a.date.localeCompare(b.date))
    })
  }

  async function handleDelete(race) {
    const { error } = await supabase.from('races').delete().eq('id', race.id)
    if (!error) setRaces(prev => prev.filter(r => r.id !== race.id))
    setDeleting(null)
  }

  if (loading) return <LoadingSpinner />

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="p-6" style={{ background: 'var(--dark)', minHeight: '100vh' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Calendário de Corridas</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{races.length} corridas registadas</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: 'var(--orange)', color: 'white' }}>
          <Plus size={18} /> Nova Corrida
        </button>
      </div>

      <div className="space-y-3">
        {races.map(race => (
          <div key={race.id} className="rounded-2xl p-4"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              opacity: race.date < today ? 0.6 : 1,
            }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3 flex-1 min-w-0">
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
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Users size={11} /> {confirmCounts[race.id] || 0} confirmados
                    </span>
                  </div>
                  {race.description && (
                    <p className="text-xs mt-1.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{race.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setEditing(race)} style={{ color: 'var(--text-muted)' }}>
                  <Edit2 size={16} />
                </button>
                <button onClick={() => setDeleting(race)} style={{ color: '#FF453A' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {races.length === 0 && (
          <div className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
            Nenhuma corrida registada.
          </div>
        )}
      </div>

      {(showAdd || editing) && (
        <RaceModal race={editing} onClose={() => { setShowAdd(false); setEditing(null) }} onSaved={handleSaved} />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-2xl p-6 max-w-sm w-full shadow-2xl" style={{ background: 'var(--surface)' }}>
            <h3 className="font-black mb-2" style={{ color: 'var(--text)' }}>Apagar corrida?</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              "{deleting.name}" será removida permanentemente.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleting)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#FF453A', color: 'white' }}>
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
