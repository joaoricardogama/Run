import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatTime, parseTime, formatDate } from '../../utils/pace'
import { Plus, X, Edit2, UserX, Check } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

const GROUPS = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6']

function AthleteModal({ athlete, onClose, onSaved }) {
  const isNew = !athlete
  const [form, setForm] = useState({
    name: athlete?.name || '',
    email: athlete?.email || '',
    group: athlete?.group || 'G1',
    pr_5km: athlete?.pr_5km ? formatTime(athlete.pr_5km) : '',
    pr_10km: athlete?.pr_10km ? formatTime(athlete.pr_10km) : '',
    strava_url: athlete?.strava_url || '',
    notes: athlete?.notes || '',
    active: athlete?.active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const pr5 = form.pr_5km ? parseTime(form.pr_5km) : null
    const pr10 = form.pr_10km ? parseTime(form.pr_10km) : null

    if (form.pr_5km && !pr5) { setError('PR 5km inválido (MM:SS)'); setSaving(false); return }
    if (form.pr_10km && !pr10) { setError('PR 10km inválido (MM:SS)'); setSaving(false); return }

    const payload = {
      name: form.name,
      email: form.email,
      group: form.group,
      pr_5km: pr5,
      pr_10km: pr10,
      strava_url: form.strava_url || null,
      notes: form.notes || null,
      active: form.active,
    }

    let result
    if (isNew) {
      result = await supabase.from('athletes').insert(payload).select().single()
    } else {
      result = await supabase.from('athletes').update(payload).eq('id', athlete.id).select().single()
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
      <div className="bg-white w-full max-w-lg rounded-2xl overflow-y-auto max-h-[90vh] shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{isNew ? 'Adicionar Atleta' : 'Editar Atleta'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Nome</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Grupo</label>
              <select value={form.group} onChange={e => set('group', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]">
                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">PR 5km (MM:SS)</label>
              <input value={form.pr_5km} onChange={e => set('pr_5km', e.target.value)} placeholder="22:30"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm pace-mono focus:outline-none focus:ring-2 focus:ring-[#38bdf8]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">PR 10km (MM:SS)</label>
              <input value={form.pr_10km} onChange={e => set('pr_10km', e.target.value)} placeholder="48:00"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm pace-mono focus:outline-none focus:ring-2 focus:ring-[#38bdf8]" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Strava URL</label>
              <input type="url" value={form.strava_url} onChange={e => set('strava_url', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Notas / Lesões</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#38bdf8]" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.active} onChange={e => set('active', e.target.checked)}
                className="rounded" />
              <label htmlFor="active" className="text-sm text-slate-700">Atleta ativo</label>
            </div>
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

function AthleteDetail({ athlete, onClose, onUpdated }) {
  const [results, setResults] = useState([])
  const [plan, setPlan] = useState(null)
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => {
    async function load() {
      const [resRes, planRes] = await Promise.all([
        supabase.from('results').select('*, races(name)').eq('athlete_id', athlete.id).order('date', { ascending: false }).limit(10),
        supabase.from('individual_plans').select('*').eq('athlete_id', athlete.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])
      if (resRes.data) setResults(resRes.data)
      if (planRes.data) setPlan(planRes.data)
    }
    load()
  }, [athlete.id])

  async function createPlan(objective) {
    const { data, error } = await supabase.from('individual_plans').insert({
      athlete_id: athlete.id,
      objective,
      weeks: 3,
      content: {},
    }).select().single()
    if (!error && data) setPlan(data)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl overflow-y-auto max-h-[90vh] shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800">{athlete.name}</h3>
            <p className="text-xs text-slate-500">{athlete.email} · {athlete.group}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowEdit(true)} className="text-slate-400 hover:text-slate-600"><Edit2 size={18} /></button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* PRs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">PR 5km</p>
              <p className="pace-mono font-bold text-slate-800">{athlete.pr_5km ? formatTime(athlete.pr_5km) : '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">PR 10km</p>
              <p className="pace-mono font-bold text-slate-800">{athlete.pr_10km ? formatTime(athlete.pr_10km) : '—'}</p>
            </div>
          </div>

          {/* Notes */}
          {athlete.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
              {athlete.notes}
            </div>
          )}

          {/* Individual plan */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Plano Individual</h4>
            {plan ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                Objetivo: <strong>{plan.objective}</strong> · {plan.weeks} semanas
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => createPlan('5km')}
                  className="flex-1 border border-[#38bdf8] text-[#38bdf8] text-sm rounded-lg py-2 hover:bg-sky-50 transition-colors">
                  Criar plano 5km
                </button>
                <button onClick={() => createPlan('10km')}
                  className="flex-1 border border-[#38bdf8] text-[#38bdf8] text-sm rounded-lg py-2 hover:bg-sky-50 transition-colors">
                  Criar plano 10km
                </button>
              </div>
            )}
          </div>

          {/* Recent results */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Resultados recentes</h4>
            {results.length === 0 ? (
              <p className="text-sm text-slate-400">Sem resultados.</p>
            ) : (
              <div className="space-y-2">
                {results.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-slate-600">{formatDate(r.date)} · {r.distance_km}km {r.races?.name ? `— ${r.races.name}` : ''}</span>
                    <span className="pace-mono font-semibold text-slate-800">{formatTime(r.time_seconds)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showEdit && (
          <AthleteModal
            athlete={athlete}
            onClose={() => setShowEdit(false)}
            onSaved={(updated) => { onUpdated(updated); setShowEdit(false) }}
          />
        )}
      </div>
    </div>
  )
}

export default function Athletes() {
  const [athletes, setAthletes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('athletes').select('*').order('name')
      if (data) setAthletes(data)
      setLoading(false)
    }
    load()
  }, [])

  function handleSaved(a) {
    setAthletes(prev => {
      const idx = prev.findIndex(x => x.id === a.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = a; return n }
      return [...prev, a].sort((a, b) => a.name.localeCompare(b.name))
    })
  }

  const filtered = athletes.filter(a =>
    a.name.toLowerCase().includes(filter.toLowerCase()) ||
    a.email.toLowerCase().includes(filter.toLowerCase()) ||
    (a.group || '').toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Atletas</h2>
          <p className="text-sm text-slate-500 mt-0.5">{athletes.length} atletas registados</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#38bdf8] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-sky-400 transition-colors">
          <Plus size={18} />
          Novo Atleta
        </button>
      </div>

      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Pesquisar por nome, email ou grupo..."
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
      />

      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Grupo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">PR 5km</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">PR 10km</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(a => (
                <tr key={a.id} onClick={() => setSelected(a)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold bg-[#0f172a] text-[#38bdf8] px-2 py-0.5 rounded-full">
                      {a.group || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell pace-mono text-slate-600">
                    {a.pr_5km ? formatTime(a.pr_5km) : '—'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell pace-mono text-slate-600">
                    {a.pr_10km ? formatTime(a.pr_10km) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      a.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {a.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">Nenhum atleta encontrado.</div>
          )}
        </div>
      )}

      {showAdd && (
        <AthleteModal onClose={() => setShowAdd(false)} onSaved={handleSaved} />
      )}

      {selected && (
        <AthleteDetail
          athlete={selected}
          onClose={() => setSelected(null)}
          onUpdated={(a) => { handleSaved(a); setSelected(a) }}
        />
      )}
    </div>
  )
}
