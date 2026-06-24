import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../utils/pace'
import { Save, Plus, X } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import SessionCard from '../../components/SessionCard'

const GROUPS = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6']
const DAYS_PT = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']
const SESSION_TYPES = ['CCL', 'CCN', 'CCR', 'Pista', 'Descanso']

const GROUP_COLORS = {
  G1: { bg: 'rgba(48,209,88,0.12)',  text: '#30D158',  border: 'rgba(48,209,88,0.3)' },
  G2: { bg: 'rgba(10,132,255,0.12)', text: '#0A84FF',  border: 'rgba(10,132,255,0.3)' },
  G3: { bg: 'rgba(255,214,10,0.12)', text: '#FFD60A',  border: 'rgba(255,214,10,0.3)' },
  G4: { bg: 'rgba(255,159,10,0.12)', text: '#FF9F0A',  border: 'rgba(255,159,10,0.3)' },
  G5: { bg: 'rgba(255,69,58,0.12)',  text: '#FF453A',  border: 'rgba(255,69,58,0.3)' },
  G6: { bg: 'rgba(191,90,242,0.12)', text: '#BF5AF2',  border: 'rgba(191,90,242,0.3)' },
}

const editorInputStyle = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  outline: 'none',
  width: '100%',
}

function SessionEditor({ session, onSave, onCancel }) {
  const [form, setForm] = useState(session || { type: 'CCL', description: '', distance: '', pace: '', notes: '' })
  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  return (
    <div className="rounded-xl p-3 space-y-2 mt-2" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
      <div className="grid grid-cols-2 gap-2">
        <select value={form.type} onChange={e => set('type', e.target.value)} style={editorInputStyle}
          onFocus={e => e.target.style.borderColor = 'var(--orange)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}>
          {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input value={form.distance || ''} onChange={e => set('distance', e.target.value ? Number(e.target.value) : '')}
          type="number" min="0" step="0.5" placeholder="Distância (km)" style={editorInputStyle}
          onFocus={e => e.target.style.borderColor = 'var(--orange)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      </div>
      <input value={form.description} onChange={e => set('description', e.target.value)}
        placeholder="Descrição da sessão" style={editorInputStyle}
        onFocus={e => e.target.style.borderColor = 'var(--orange)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      <input value={form.pace || ''} onChange={e => set('pace', e.target.value)}
        placeholder="Ritmo (ex: 05:30-05:45/km)" className="pace-mono" style={editorInputStyle}
        onFocus={e => e.target.style.borderColor = 'var(--orange)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      <input value={form.notes || ''} onChange={e => set('notes', e.target.value)}
        placeholder="Notas" style={editorInputStyle}
        onFocus={e => e.target.style.borderColor = 'var(--orange)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-sm px-3 py-1.5 rounded-lg"
          style={{ color: 'var(--text-muted)' }}>Cancelar</button>
        <button onClick={() => onSave(form)}
          className="text-sm px-3 py-1.5 rounded-lg font-bold"
          style={{ background: 'var(--orange)', color: 'white' }}>Guardar</button>
      </div>
    </div>
  )
}

function DayEditor({ day, sessions, onChange }) {
  const [adding, setAdding] = useState(false)
  const [editingIdx, setEditingIdx] = useState(null)

  function addSession(s) { onChange([...(sessions || []), s]); setAdding(false) }
  function updateSession(idx, s) { const next = [...(sessions || [])]; next[idx] = s; onChange(next); setEditingIdx(null) }
  function removeSession(idx) { onChange((sessions || []).filter((_, i) => i !== idx)) }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{day}</p>
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs font-bold"
          style={{ color: 'var(--orange)' }}>
          <Plus size={13} /> sessão
        </button>
      </div>
      {(sessions || []).map((s, i) => (
        <div key={i} className="relative">
          {editingIdx === i ? (
            <SessionEditor session={s} onSave={ns => updateSession(i, ns)} onCancel={() => setEditingIdx(null)} />
          ) : (
            <div className="flex items-start gap-1">
              <div className="flex-1"><SessionCard session={s} /></div>
              <div className="flex flex-col gap-1 pt-1">
                <button onClick={() => setEditingIdx(i)} style={{ color: 'var(--text-muted)' }}>
                  <Plus size={14} className="rotate-45" />
                </button>
                <button onClick={() => removeSession(i)} style={{ color: '#FF453A' }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      {adding && <SessionEditor onSave={addSession} onCancel={() => setAdding(false)} />}
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
      if (data) { setPlan(data); setWeekStart(data.week_start); setContent(data.content || {}) }
      else { const m = getMonday(new Date()); setWeekStart(m.toISOString().slice(0, 10)) }
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
    setContent(prev => ({ ...prev, [group]: { ...(prev[group] || {}), [day]: sessions } }))
  }

  async function handleSave() {
    setSaving(true)
    const payload = { week_start: weekStart, content }
    const result = plan
      ? await supabase.from('general_plans').update(payload).eq('id', plan.id).select().single()
      : await supabase.from('general_plans').insert(payload).select().single()
    if (!result.error && result.data) { setPlan(result.data); setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  if (loading) return <LoadingSpinner />

  const grpClr = GROUP_COLORS[activeGroup] || GROUP_COLORS.G1

  return (
    <div className="p-6 max-w-4xl" style={{ background: 'var(--dark)', minHeight: '100vh' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black" style={{ color: 'var(--text)' }}>Plano Geral</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Editor de plano semanal por grupo</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
          style={{ background: saved ? 'rgba(48,209,88,0.15)' : 'var(--orange)', color: saved ? '#30D158' : 'white' }}>
          <Save size={18} />
          {saving ? 'A publicar...' : saved ? 'Publicado!' : 'Publicar'}
        </button>
      </div>

      <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          Semana (início — segunda-feira)
        </label>
        <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)}
          style={{
            background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)',
            borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--orange)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        {weekStart && <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Semana de {formatDate(weekStart)}</p>}
      </div>

      {/* Group tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {GROUPS.map(g => {
          const clr = GROUP_COLORS[g] || GROUP_COLORS.G1
          const isActive = activeGroup === g
          return (
            <button key={g} onClick={() => setActiveGroup(g)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                background: isActive ? clr.bg : 'var(--surface)',
                color: isActive ? clr.text : 'var(--text-muted)',
                border: isActive ? `1px solid ${clr.border}` : '1px solid var(--border)',
              }}>
              {g}
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs"
            style={{ background: grpClr.bg, color: grpClr.text }}>
            {activeGroup}
          </div>
          <h3 className="font-bold" style={{ color: 'var(--text)' }}>Grupo {activeGroup}</h3>
        </div>
        {DAYS_PT.map(day => (
          <DayEditor key={day} day={day}
            sessions={content[activeGroup]?.[day] || []}
            onChange={sessions => setGroupDay(activeGroup, day, sessions)} />
        ))}
      </div>
    </div>
  )
}
