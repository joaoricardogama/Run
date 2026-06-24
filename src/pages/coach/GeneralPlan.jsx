import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../utils/pace'
import { Save, Plus, X } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import SessionCard from '../../components/SessionCard'

const GROUPS = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6']
const DAYS_PT = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']
const SESSION_TYPES = ['CCL', 'CCN', 'CCR', 'Pista', 'Descanso']

function SessionEditor({ session, onSave, onCancel }) {
  const [form, setForm] = useState(session || {
    type: 'CCL', description: '', distance: '', pace: '', notes: '',
  })

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 mt-2">
      <div className="grid grid-cols-2 gap-2">
        <select value={form.type} onChange={e => set('type', e.target.value)}
          className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#38bdf8]">
          {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input value={form.distance || ''} onChange={e => set('distance', e.target.value ? Number(e.target.value) : '')}
          type="number" min="0" step="0.5" placeholder="Distância (km)"
          className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#38bdf8]" />
      </div>
      <input value={form.description} onChange={e => set('description', e.target.value)}
        placeholder="Descrição da sessão"
        className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#38bdf8]" />
      <input value={form.pace || ''} onChange={e => set('pace', e.target.value)}
        placeholder="Ritmo (ex: 05:30-05:45/km)"
        className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm pace-mono focus:outline-none focus:ring-1 focus:ring-[#38bdf8]" />
      <input value={form.notes || ''} onChange={e => set('notes', e.target.value)}
        placeholder="Notas"
        className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#38bdf8]" />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-700 px-2 py-1">Cancelar</button>
        <button onClick={() => onSave(form)}
          className="bg-[#38bdf8] text-white text-sm px-3 py-1 rounded hover:bg-sky-400 transition-colors">
          Guardar
        </button>
      </div>
    </div>
  )
}

function DayEditor({ day, sessions, onChange }) {
  const [adding, setAdding] = useState(false)
  const [editingIdx, setEditingIdx] = useState(null)

  function addSession(s) {
    onChange([...(sessions || []), s])
    setAdding(false)
  }

  function updateSession(idx, s) {
    const next = [...(sessions || [])]
    next[idx] = s
    onChange(next)
    setEditingIdx(null)
  }

  function removeSession(idx) {
    onChange((sessions || []).filter((_, i) => i !== idx))
  }

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-slate-600 uppercase">{day}</p>
        <button onClick={() => setAdding(true)}
          className="text-xs text-[#38bdf8] hover:text-sky-600 flex items-center gap-0.5">
          <Plus size={14} /> sessão
        </button>
      </div>

      {(sessions || []).map((s, i) => (
        <div key={i} className="relative">
          {editingIdx === i ? (
            <SessionEditor session={s} onSave={ns => updateSession(i, ns)} onCancel={() => setEditingIdx(null)} />
          ) : (
            <div className="flex items-start gap-1">
              <div className="flex-1">
                <SessionCard session={s} />
              </div>
              <div className="flex flex-col gap-1 pt-1">
                <button onClick={() => setEditingIdx(i)} className="text-slate-400 hover:text-slate-600">
                  <Plus size={14} className="rotate-45" />
                </button>
                <button onClick={() => removeSession(i)} className="text-red-400 hover:text-red-600">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {adding && (
        <SessionEditor onSave={addSession} onCancel={() => setAdding(false)} />
      )}
    </div>
  )
}

export default function GeneralPlan() {
  const [plan, setPlan] = useState(null)
  const [weekStart, setWeekStart] = useState('')
  const [content, setContent] = useState({})
  const [activeGroup, setActiveGroup] = useState('G1')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('general_plans').select('*')
        .order('week_start', { ascending: false }).limit(1).maybeSingle()
      if (data) {
        setPlan(data)
        setWeekStart(data.week_start)
        setContent(data.content || {})
      } else {
        const monday = getMonday(new Date())
        setWeekStart(monday.toISOString().slice(0, 10))
      }
      setLoading(false)
    }
    load()
  }, [])

  function getMonday(d) {
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  function setGroupDay(group, day, sessions) {
    setContent(prev => ({
      ...prev,
      [group]: { ...(prev[group] || {}), [day]: sessions },
    }))
  }

  async function handleSave() {
    setSaving(true)
    const payload = { week_start: weekStart, content }
    let result
    if (plan) {
      result = await supabase.from('general_plans').update(payload).eq('id', plan.id).select().single()
    } else {
      result = await supabase.from('general_plans').insert(payload).select().single()
    }
    if (!result.error && result.data) {
      setPlan(result.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Plano Geral</h2>
          <p className="text-sm text-slate-500 mt-0.5">Editor de plano semanal por grupo</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-[#38bdf8] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-sky-400 transition-colors disabled:opacity-60">
          <Save size={18} />
          {saving ? 'A publicar...' : saved ? 'Publicado!' : 'Publicar'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
        <label className="block text-xs font-medium text-slate-600 mb-1">Semana (início — segunda-feira)</label>
        <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]" />
        {weekStart && <p className="text-xs text-slate-400 mt-1">Semana de {formatDate(weekStart)}</p>}
      </div>

      {/* Group tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {GROUPS.map(g => (
          <button key={g} onClick={() => setActiveGroup(g)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeGroup === g ? 'bg-[#0f172a] text-[#38bdf8]' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}>
            {g}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <h3 className="font-semibold text-slate-700 mb-4">Grupo {activeGroup}</h3>
        {DAYS_PT.map(day => (
          <DayEditor
            key={day}
            day={day}
            sessions={content[activeGroup]?.[day] || []}
            onChange={sessions => setGroupDay(activeGroup, day, sessions)}
          />
        ))}
      </div>
    </div>
  )
}
