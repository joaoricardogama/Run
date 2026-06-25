import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { ChevronLeft, ChevronRight, Plus, X, Save, CalendarDays, User, Loader2, Sparkles } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { generateWeekPlan } from '../../utils/aiPlanGenerator'

// ── Constants ────────────────────────────────────────────────
const DAYS     = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']
const DAYS_LBL = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
const GROUPS   = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6']
const TYPES    = ['CCL', 'CCN', 'CCR', 'Pista', 'Descanso']

const TYPE_CFG = {
  CCL:      { color: '#30D158', bg: 'rgba(48,209,88,0.15)',   border: 'rgba(48,209,88,0.3)' },
  CCN:      { color: '#FFD60A', bg: 'rgba(255,214,10,0.15)',  border: 'rgba(255,214,10,0.3)' },
  CCR:      { color: '#FF453A', bg: 'rgba(255,69,58,0.15)',   border: 'rgba(255,69,58,0.3)' },
  Pista:    { color: '#BF5AF2', bg: 'rgba(191,90,242,0.15)', border: 'rgba(191,90,242,0.3)' },
  Descanso: { color: '#8E8E93', bg: 'rgba(72,72,74,0.2)',    border: 'rgba(72,72,74,0.3)' },
}

const GROUP_COLOR = {
  G1: '#30D158', G2: '#0A84FF', G3: '#FFD60A',
  G4: '#FF9F0A', G5: '#FF453A', G6: '#BF5AF2',
}

// ── Date helpers ─────────────────────────────────────────────
function getMonday(d = new Date()) {
  const date = new Date(d)
  const day  = date.getDay()
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  date.setHours(0, 0, 0, 0)
  return date
}

function addWeeks(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n * 7)
  return d
}

function toISO(date) { return date.toISOString().slice(0, 10) }

function fmtWeek(date) {
  return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Session Modal ────────────────────────────────────────────
function SessionModal({ session, onSave, onClose }) {
  const [form, setForm] = useState(
    session
      ? { ...session, distance: session.distance ?? '' }
      : { type: 'CCL', description: '', distance: '', pace: '', notes: '' }
  )
  const s = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black" style={{ color: 'var(--text)' }}>
            {session ? 'Editar Sessão' : 'Nova Sessão'}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Type selector */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {TYPES.map(t => {
            const cfg    = TYPE_CFG[t]
            const active = form.type === t
            return (
              <button
                key={t}
                onClick={() => s('type', t)}
                className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                style={{
                  background: active ? cfg.bg    : 'var(--surface2)',
                  color:      active ? cfg.color : 'var(--text-muted)',
                  border:     active ? `1px solid ${cfg.border}` : '1px solid var(--border)',
                }}
              >
                {t}
              </button>
            )
          })}
        </div>

        <div className="space-y-2">
          <input
            value={form.description}
            onChange={e => s('description', e.target.value)}
            placeholder="Descrição da sessão"
            className="w-full rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.distance}
              onChange={e => s('distance', e.target.value)}
              type="number" min="0" step="0.5"
              placeholder="Distância (km)"
              className="rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            <input
              value={form.pace}
              onChange={e => s('pace', e.target.value)}
              placeholder="Ritmo"
              className="rounded-xl px-3 py-2 text-sm outline-none pace-mono"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>
          <input
            value={form.notes}
            onChange={e => s('notes', e.target.value)}
            placeholder="Notas"
            className="w-full rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave({
              ...form,
              distance: form.distance !== '' ? Number(form.distance) : undefined,
            })}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--orange)', color: 'white' }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Session Pill ─────────────────────────────────────────────
function SessionPill({ session, isDragging, onDragStart, onDragEnd, onEdit, onRemove }) {
  const cfg = TYPE_CFG[session.type] || TYPE_CFG.Descanso
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="rounded-lg px-2 py-1.5 mb-1 cursor-grab active:cursor-grabbing select-none group relative"
      style={{
        background:  cfg.bg,
        border:      `1px solid ${cfg.border}`,
        opacity:     isDragging ? 0.3 : 1,
        transition:  'opacity 0.12s',
      }}
    >
      <div className="flex items-start gap-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-black" style={{ color: cfg.color }}>{session.type}</span>
            {session.distance && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{session.distance}km</span>
            )}
          </div>
          {session.description && (
            <p className="text-xs leading-tight mt-0.5" style={{ color: 'var(--text)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {session.description}
            </p>
          )}
          {session.pace && (
            <p className="pace-mono text-xs mt-0.5" style={{ color: cfg.color }}>{session.pace}</p>
          )}
        </div>
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onEdit() }}
            className="w-4 h-4 flex items-center justify-center rounded"
            style={{ color: 'var(--text-muted)' }}
          >
            <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor">
              <path d="M9.5 1.5a1.5 1.5 0 0 1 2.12 2.12L4.5 10.74 1 11.5l.76-3.5L9.5 1.5z"/>
            </svg>
          </button>
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onRemove() }}
            className="w-4 h-4 flex items-center justify-center rounded"
            style={{ color: '#FF453A' }}
          >
            <X size={9} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Drop Cell ────────────────────────────────────────────────
function DropCell({ sessions = [], rowKey, day, dragging, onDrop, onAdd, onEdit, onRemove, onDragStart, onDragEnd }) {
  const [over, setOver] = useState(false)

  return (
    <td className="align-top" style={{ minWidth: 130, padding: 3 }}>
      <div
        className="min-h-20 rounded-lg p-1 transition-all"
        style={{
          background: over ? 'rgba(252,76,2,0.06)' : 'transparent',
          border:     over ? '1.5px dashed rgba(252,76,2,0.4)' : '1.5px solid transparent',
        }}
        onDragOver={e => { e.preventDefault(); setOver(true) }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(false) }}
        onDrop={e => { e.preventDefault(); setOver(false); onDrop(rowKey, day) }}
      >
        {sessions.map((s, idx) => (
          <SessionPill
            key={idx}
            session={s}
            isDragging={
              dragging?.rowKey === rowKey &&
              dragging?.day    === day    &&
              dragging?.idx    === idx
            }
            onDragStart={e => {
              e.dataTransfer.effectAllowed = 'move'
              onDragStart(rowKey, day, idx, s)
            }}
            onDragEnd={onDragEnd}
            onEdit={()   => onEdit(rowKey, day, idx)}
            onRemove={() => onRemove(rowKey, day, idx)}
          />
        ))}
        <button
          onClick={() => onAdd(rowKey, day)}
          className="w-full flex items-center justify-center rounded transition-opacity"
          style={{
            color:  'var(--text-muted)',
            border: '1px dashed rgba(255,255,255,0.1)',
            padding: '3px 0',
            opacity: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0'}
        >
          <Plus size={11} />
        </button>
      </div>
    </td>
  )
}

// ── Calendar Grid ────────────────────────────────────────────
function CalendarGrid({ rows, content, dragging, onDrop, onAdd, onEdit, onRemove, onDragStart, onDragEnd, rowLabel }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
        <thead>
          <tr>
            {rowLabel && (
              <th style={{ width: 52, padding: '6px 4px', textAlign: 'left' }} />
            )}
            {DAYS_LBL.map((d, i) => (
              <th
                key={i}
                className="text-xs font-bold uppercase tracking-widest"
                style={{
                  color:   'var(--text-muted)',
                  padding: '6px 4px',
                  textAlign: 'left',
                  minWidth: 130,
                }}
              >
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(rowKey => (
            <tr key={rowKey}>
              {rowLabel && (
                <td style={{ padding: '3px 4px 3px 0', verticalAlign: 'top' }}>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black mt-1"
                    style={{
                      background: `${GROUP_COLOR[rowKey]}22`,
                      color:       GROUP_COLOR[rowKey] || 'var(--text-muted)',
                    }}
                  >
                    {rowKey}
                  </div>
                </td>
              )}
              {DAYS.map(day => (
                <DropCell
                  key={day}
                  rowKey={rowKey}
                  day={day}
                  sessions={content[rowKey]?.[day] || []}
                  dragging={dragging}
                  onDrop={onDrop}
                  onAdd={onAdd}
                  onEdit={onEdit}
                  onRemove={onRemove}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function CoachCalendar() {
  const [view,       setView]       = useState('geral')      // 'geral' | 'atleta'
  const [weekStart,  setWeekStart]  = useState(getMonday())
  const [activeGroup, setActiveGroup] = useState('G1')

  // General plan (by group)
  const [planId,    setPlanId]    = useState(null)
  const [content,   setContent]   = useState({})             // { G1: { segunda: [...] }, ... }

  // Athletes & individual view
  const [athletes,        setAthletes]        = useState([])
  const [selectedAthlete, setSelectedAthlete] = useState(null)
  const [athleteCalId,    setAthleteCalId]    = useState(null)
  const [athleteContent,  setAthleteContent]  = useState({}) // { segunda: [...], ... }

  // UI state
  const [dragging, setDragging] = useState(null) // { rowKey, day, idx, session }
  const [modal,    setModal]    = useState(null) // { rowKey, day, idx, session } | null
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [showAI,   setShowAI]   = useState(false)
  const [hasRace,  setHasRace]  = useState(false)

  // ── Load general plan ──────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      const iso = toISO(weekStart)
      const { data } = await supabase
        .from('general_plans')
        .select('*')
        .eq('week_start', iso)
        .maybeSingle()

      if (data) { setPlanId(data.id); setContent(data.content || {}) }
      else       { setPlanId(null);   setContent({}) }
      setLoading(false)
    }
    if (view === 'geral') load()
  }, [view, weekStart])

  // ── Load athletes ──────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('athletes')
        .select('id, name, group, email')
        .order('name')
      setAthletes(data || [])
      if (data?.length && !selectedAthlete) setSelectedAthlete(data[0])
    }
    if (view === 'atleta') load()
  }, [view])

  // ── Load athlete calendar ──────────────────────────────────
  useEffect(() => {
    if (!selectedAthlete || view !== 'atleta') return
    async function load() {
      setLoading(true)
      const iso = toISO(weekStart)
      const { data } = await supabase
        .from('athlete_calendar')
        .select('*')
        .eq('athlete_id', selectedAthlete.id)
        .eq('week_start', iso)
        .maybeSingle()

      if (data) { setAthleteCalId(data.id); setAthleteContent(data.content || {}) }
      else       { setAthleteCalId(null);   setAthleteContent({}) }
      setLoading(false)
    }
    load()
  }, [selectedAthlete, weekStart, view])

  // ── Content helpers ────────────────────────────────────────
  const getSessions = useCallback((rowKey, day) => {
    if (view === 'geral')  return content[rowKey]?.[day]        || []
    if (view === 'atleta') return athleteContent[day]           || []
    return []
  }, [view, content, athleteContent])

  function setGenSessions(rowKey, day, sessions) {
    setContent(prev => ({
      ...prev,
      [rowKey]: { ...(prev[rowKey] || {}), [day]: sessions },
    }))
  }

  function setAthSessions(day, sessions) {
    setAthleteContent(prev => ({ ...prev, [day]: sessions }))
  }

  // ── Add / Edit / Remove ────────────────────────────────────
  function handleAdd(rowKey, day) {
    setModal({ rowKey, day, idx: null, session: null })
  }

  function handleEdit(rowKey, day, idx) {
    const s = view === 'geral'
      ? content[rowKey]?.[day]?.[idx]
      : athleteContent[day]?.[idx]
    setModal({ rowKey, day, idx, session: s })
  }

  function handleRemove(rowKey, day, idx) {
    if (view === 'geral') {
      const sessions = [...(content[rowKey]?.[day] || [])]
      sessions.splice(idx, 1)
      setGenSessions(rowKey, day, sessions)
    } else {
      const sessions = [...(athleteContent[day] || [])]
      sessions.splice(idx, 1)
      setAthSessions(day, sessions)
    }
  }

  function handleModalSave(form) {
    const { rowKey, day, idx } = modal
    if (view === 'geral') {
      const sessions = [...(content[rowKey]?.[day] || [])]
      if (idx === null) sessions.push(form)
      else sessions[idx] = form
      setGenSessions(rowKey, day, sessions)
    } else {
      const sessions = [...(athleteContent[day] || [])]
      if (idx === null) sessions.push(form)
      else sessions[idx] = form
      setAthSessions(day, sessions)
    }
    setModal(null)
  }

  // ── Drag & Drop ────────────────────────────────────────────
  function handleDragStart(rowKey, day, idx, session) {
    setDragging({ rowKey, day, idx, session })
  }

  function handleDragEnd() { setDragging(null) }

  function handleDrop(targetRowKey, targetDay) {
    if (!dragging) return
    const { rowKey: srcRow, day: srcDay, idx, session } = dragging
    if (srcRow === targetRowKey && srcDay === targetDay) { setDragging(null); return }

    if (view === 'geral') {
      // Remove from source
      const srcSessions = [...(content[srcRow]?.[srcDay] || [])]
      srcSessions.splice(idx, 1)
      // Add to target
      const tgtSessions = [...(content[targetRowKey]?.[targetDay] || []), session]
      setContent(prev => ({
        ...prev,
        [srcRow]:     { ...(prev[srcRow]     || {}), [srcDay]:    srcSessions },
        [targetRowKey]: { ...(prev[targetRowKey] || {}), [targetDay]: tgtSessions },
      }))
    } else {
      const srcSessions = [...(athleteContent[srcDay] || [])]
      srcSessions.splice(idx, 1)
      const tgtSessions = [...(athleteContent[targetDay] || []), session]
      setAthleteContent(prev => ({
        ...prev,
        [srcDay]:    srcSessions,
        [targetDay]: tgtSessions,
      }))
    }
    setDragging(null)
  }

  // ── Save ───────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    const iso = toISO(weekStart)

    if (view === 'geral') {
      const payload = { week_start: iso, content }
      const result = planId
        ? await supabase.from('general_plans').update(payload).eq('id', planId).select().single()
        : await supabase.from('general_plans').insert(payload).select().single()
      if (!result.error) setPlanId(result.data.id)
    } else {
      if (!selectedAthlete) { setSaving(false); return }
      const payload = { athlete_id: selectedAthlete.id, week_start: iso, content: athleteContent }
      const result = athleteCalId
        ? await supabase.from('athlete_calendar').update(payload).eq('id', athleteCalId).select().single()
        : await supabase.from('athlete_calendar').insert(payload).select().single()
      if (!result.error) setAthleteCalId(result.data.id)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // ── AI Generate (groups only) ──────────────────────────────
  function handleAiGenerate() {
    const generated = generateWeekPlan(hasRace)
    setContent(generated)
    setShowAI(false)
  }

  // ── Render ─────────────────────────────────────────────────
  const gridRows = view === 'geral' ? [activeGroup] : ['athlete']

  // Build unified content map for grid
  const gridContent = view === 'geral'
    ? content
    : { athlete: athleteContent }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--dark)', minHeight: '100vh' }}>

      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--surface2)' }}>
          {[
            { key: 'geral',  label: 'Geral',   icon: CalendarDays },
            { key: 'atleta', label: 'Atleta',  icon: User },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all"
              style={{
                background: view === key ? 'var(--surface)' : 'transparent',
                color:      view === key ? 'var(--orange)'  : 'var(--text-muted)',
                boxShadow:  view === key ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekStart(w => addWeeks(w, -1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {fmtWeek(weekStart)}
            </p>
          </div>
          <button
            onClick={() => setWeekStart(w => addWeeks(w, 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {view === 'geral' && (
            <button
              onClick={() => setShowAI(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              <Sparkles size={15} style={{ color: 'var(--orange)' }} />
              Gerar IA
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-60"
            style={{ background: saved ? 'rgba(48,209,88,0.15)' : 'var(--orange)', color: saved ? '#30D158' : 'white' }}
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'A guardar…' : saved ? 'Guardado!' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* ── Sub-bar: group tabs (geral) or athlete picker (atleta) ── */}
      <div
        className="flex items-center gap-2 px-6 py-3 flex-shrink-0"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        {view === 'geral' ? (
          <div className="flex gap-1.5">
            {GROUPS.map(g => {
              const clr    = GROUP_COLOR[g]
              const active = activeGroup === g
              return (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  className="px-4 py-1.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: active ? `${clr}22` : 'var(--surface2)',
                    color:      active ? clr         : 'var(--text-muted)',
                    border:     active ? `1px solid ${clr}55` : '1px solid var(--border)',
                  }}
                >
                  {g}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Atleta:</p>
            <select
              value={selectedAthlete?.id || ''}
              onChange={e => {
                const a = athletes.find(a => a.id === e.target.value)
                setSelectedAthlete(a || null)
              }}
              className="rounded-xl px-3 py-1.5 text-sm font-bold outline-none"
              style={{
                background: 'var(--surface2)',
                border:     '1px solid var(--border)',
                color:      'var(--text)',
              }}
            >
              {athletes.length === 0 && (
                <option value="">Sem atletas</option>
              )}
              {athletes.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.group})
                </option>
              ))}
            </select>
            {selectedAthlete && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {selectedAthlete.email}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Calendar grid ── */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <CalendarGrid
              rows={gridRows}
              content={gridContent}
              dragging={dragging}
              onDrop={handleDrop}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onRemove={handleRemove}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              rowLabel={false}
            />
          </div>
        )}
      </div>

      {/* ── Session Modal ── */}
      {modal && (
        <SessionModal
          session={modal.session}
          onSave={handleModalSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── AI Generate Modal ── */}
      {showAI && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setShowAI(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} style={{ color: 'var(--orange)' }} />
              <h3 className="font-black" style={{ color: 'var(--text)' }}>Gerar Plano com IA</h3>
            </div>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              Gera automaticamente todos os grupos (G1–G6) com base nos templates Run Tejo.
            </p>
            <p className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>
              Houve prova no fim de semana anterior?
            </p>
            <div className="flex gap-3 mb-6">
              {[
                { v: true,  l: '✓ Sim — com prova',  d: '2ª feira CCL (recuperação)' },
                { v: false, l: '✗ Não',              d: '2ª feira CCN (carga normal)' },
              ].map(({ v, l, d }) => (
                <button
                  key={String(v)}
                  onClick={() => setHasRace(v)}
                  className="flex-1 p-3 rounded-xl text-sm font-bold text-left"
                  style={{
                    background: hasRace === v ? 'rgba(252,76,2,0.15)' : 'var(--surface2)',
                    color:      hasRace === v ? 'var(--orange)'        : 'var(--text-muted)',
                    border:     hasRace === v ? '1px solid rgba(252,76,2,0.4)' : '1px solid var(--border)',
                  }}
                >
                  <p>{l}</p>
                  <p className="text-xs font-normal mt-0.5" style={{ color: 'var(--text-muted)' }}>{d}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAI(false)}
                className="flex-1 py-3 rounded-xl text-sm font-bold"
                style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAiGenerate}
                className="flex-1 py-3 rounded-xl text-sm font-bold"
                style={{ background: 'var(--orange)', color: 'white' }}
              >
                Gerar Plano
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
