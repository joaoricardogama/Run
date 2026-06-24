import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, formatDistance } from '../../utils/pace'
import { Plus, Edit2, Trash2, X, Users } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

function RaceModal({ race, onClose, onSaved }) {
  const isNew = !race
  const [form, setForm] = useState({
    name: race?.name || '',
    date: race?.date || '',
    distance_km: race?.distance_km || '',
    location: race?.location || '',
    description: race?.description || '',
    registration_url: race?.registration_url || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

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

    let result
    if (isNew) {
      result = await supabase.from('races').insert(payload).select().single()
    } else {
      result = await supabase.from('races').update(payload).eq('id', race.id).select().single()
    }

    if (result.error) {
      setError('Erro: ' + result.error.message)
    } else {
      onSaved(result.data)
      onClose()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{isNew ? 'Nova Corrida' : 'Editar Corrida'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nome</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Data</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Distância (km)</label>
              <input type="number" step="0.01" min="0.1" value={form.distance_km} onChange={e => set('distance_km', e.target.value)} required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Local</label>
            <input value={form.location} onChange={e => set('location', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Descrição</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#38bdf8]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">URL Inscrições</label>
            <input type="url" value={form.registration_url} onChange={e => set('registration_url', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={saving}
            className="w-full bg-[#38bdf8] hover:bg-sky-400 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-60">
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
    if (!error) {
      setRaces(prev => prev.filter(r => r.id !== race.id))
    }
    setDeleting(null)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Calendário de Corridas</h2>
          <p className="text-sm text-slate-500 mt-0.5">{races.length} corridas registadas</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#38bdf8] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-sky-400 transition-colors">
          <Plus size={18} />
          Nova Corrida
        </button>
      </div>

      <div className="space-y-3">
        {races.map(race => (
          <div key={race.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-800">{race.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                  <span>{formatDate(race.date)}</span>
                  {race.location && <span>{race.location}</span>}
                  <span className="font-bold text-[#38bdf8]">{formatDistance(race.distance_km)} km</span>
                </div>
                {race.description && <p className="text-xs text-slate-500 mt-1.5">{race.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Users size={14} />
                  {confirmCounts[race.id] || 0}
                </div>
                <button onClick={() => setEditing(race)} className="text-slate-400 hover:text-slate-600">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => setDeleting(race)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {races.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">Nenhuma corrida registada.</div>
        )}
      </div>

      {(showAdd || editing) && (
        <RaceModal
          race={editing}
          onClose={() => { setShowAdd(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-slate-800 mb-2">Apagar corrida?</h3>
            <p className="text-sm text-slate-600 mb-4">"{deleting.name}" será removida permanentemente.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)}
                className="flex-1 border border-slate-300 text-slate-700 rounded-lg py-2 text-sm">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleting)}
                className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-600">
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
