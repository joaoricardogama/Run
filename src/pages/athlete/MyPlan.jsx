import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/LoadingSpinner'
import { CalendarPlus, FileDown, ChevronDown, ChevronUp } from 'lucide-react'

/* ── Day names ───────────────────────────────────────────────── */
const DAYS_KEY  = ['domingo','segunda','terça','quarta','quinta','sexta','sábado']
const DAYS_LONG = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function toYMD(d) { return d.toISOString().split('T')[0] }

function getWeekDates(offset = 0) {
  const today = new Date()
  const dow = today.getDay()
  const mon = new Date(today)
  mon.setDate(today.getDate() - ((dow + 6) % 7) + offset * 7)
  mon.setHours(0,0,0,0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i); return d
  })
}

/* ── Type colours (dark-theme adapted) ──────────────────────── */
const TC = {
  CCL:      { bg: 'rgba(184,255,0,0.07)',   border: 'rgba(184,255,0,0.5)',   tag: '#B8FF00',  tagBg: 'rgba(184,255,0,0.15)'  },
  CCN:      { bg: 'rgba(255,214,10,0.07)',  border: 'rgba(255,214,10,0.5)',  tag: '#FFD60A',  tagBg: 'rgba(255,214,10,0.15)' },
  CCR:      { bg: 'rgba(255,69,58,0.07)',   border: 'rgba(255,69,58,0.5)',   tag: '#FF453A',  tagBg: 'rgba(255,69,58,0.15)'  },
  Pista:    { bg: 'rgba(10,132,255,0.07)',  border: 'rgba(10,132,255,0.5)',  tag: '#0A84FF',  tagBg: 'rgba(10,132,255,0.15)' },
  Blocos:   { bg: 'rgba(0,212,255,0.07)',   border: 'rgba(0,212,255,0.5)',   tag: '#00D4FF',  tagBg: 'rgba(0,212,255,0.15)'  },
  Hills:    { bg: 'rgba(191,90,242,0.07)',  border: 'rgba(191,90,242,0.5)',  tag: '#BF5AF2',  tagBg: 'rgba(191,90,242,0.15)' },
  Força:    { bg: 'rgba(10,132,255,0.07)',  border: 'rgba(10,132,255,0.5)',  tag: '#0A84FF',  tagBg: 'rgba(10,132,255,0.15)' },
  Descanso: { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.1)', tag: '#888',     tagBg: 'rgba(255,255,255,0.07)'},
  Prova:    { bg: 'rgba(255,45,85,0.07)',   border: 'rgba(255,45,85,0.5)',   tag: '#FF2D55',  tagBg: 'rgba(255,45,85,0.15)'  },
  default:  { bg: 'rgba(184,255,0,0.07)',   border: 'rgba(184,255,0,0.5)',   tag: '#B8FF00',  tagBg: 'rgba(184,255,0,0.15)'  },
}

function getTC(type) {
  if (!type) return TC.default
  const key = Object.keys(TC).find(k => type.toUpperCase().includes(k.toUpperCase()))
  return TC[key] || TC.default
}

/* ── ICS generator ───────────────────────────────────────────── */
function makeICS(date, session) {
  const pad = n => String(n).padStart(2,'0')
  const d = new Date(date + 'T07:00:00')
  const fmt = dt => `${dt.getFullYear()}${pad(dt.getMonth()+1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`
  const end = new Date(d); end.setHours(d.getHours() + 1)
  const title = session.description || session.type || 'Treino'
  const notes = [
    session.notes,
    session.distance ? `Distância: ${session.distance}km` : null,
    session.pace ? `Ritmo: ${session.pace}` : null,
  ].filter(Boolean).join('\\n')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hoje e Hoje//Training Plan//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(d)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${title}`,
    notes ? `DESCRIPTION:${notes}` : '',
    `CATEGORIES:${session.type || 'TREINO'}`,
    `STATUS:CONFIRMED`,
    `END:VEVENT`,
    'END:VCALENDAR',
  ].filter(l => l !== '').join('\r\n')
}

function downloadICS(date, session) {
  const blob = new Blob([makeICS(date, session)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `treino-${date}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

/* ── PDF export ─────────────────────────────────────────────── */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve()
    const s = document.createElement('script')
    s.src = src; s.onload = resolve; s.onerror = reject
    document.head.appendChild(s)
  })
}

async function exportPDF(ref, weekLabel) {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js')
  const el = ref.current
  if (!el || !window.html2pdf) return
  window.html2pdf(el, {
    margin:      [8, 8, 8, 8],
    filename:    `plano-treino-${weekLabel}.pdf`,
    image:       { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, backgroundColor: '#080808', useCORS: true },
    jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
  })
}

/* ── TypeTag ─────────────────────────────────────────────────── */
function TypeTag({ type }) {
  const c = getTC(type)
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
      padding: '3px 8px', borderRadius: 6,
      background: c.tagBg, color: c.tag,
      textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>{type}</span>
  )
}

/* ── SessionCard ─────────────────────────────────────────────── */
function SessionCard({ session, date, done, strava }) {
  const c = getTC(session.type)
  return (
    <div style={{
      background: c.bg,
      borderLeft: `3px solid ${c.border}`,
      borderRadius: '0 10px 10px 0',
      padding: '12px 14px',
      marginBottom: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Tags row */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
            <TypeTag type={session.type} />
            {done && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(48,209,88,0.15)', color: '#30D158', letterSpacing: '0.06em' }}>
                ✓ FEITO
              </span>
            )}
            {strava && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(252,76,2,0.15)', color: '#FC4C02', letterSpacing: '0.06em' }}>
                STRAVA
              </span>
            )}
          </div>
          {/* Title */}
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', lineHeight: 1.3, marginBottom: session.notes ? 4 : 0 }}>
            {session.description || session.type}
          </p>
          {/* Notes */}
          {session.notes && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55, whiteSpace: 'pre-line', marginTop: 4 }}>
              {session.notes}
            </p>
          )}
          {/* Distance + pace inline */}
          {(session.distance || session.pace) && (
            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
              {session.distance && (
                <span style={{ fontSize: 12, fontWeight: 700, color: c.tag }}>
                  {session.distance} km
                </span>
              )}
              {session.pace && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>⏱ {session.pace}</span>
              )}
            </div>
          )}
        </div>
        {/* Calendar button */}
        <button
          onClick={() => downloadICS(date, session)}
          title="Adicionar ao calendário"
          style={{
            flexShrink: 0, width: 32, height: 32, borderRadius: 8,
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <CalendarPlus size={14} />
        </button>
      </div>
    </div>
  )
}

/* ── DayCard ─────────────────────────────────────────────────── */
function DayCard({ date, dayLabel, sessions, done, strava, isToday, isPast }) {
  const [open, setOpen] = useState(isToday || sessions.length > 0)
  const isRest = sessions.length === 0 || (sessions.length === 1 && sessions[0].type === 'Descanso')
  const dateStr = toYMD(date)

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left',
          background: isToday
            ? 'rgba(184,255,0,0.12)'
            : isRest ? 'var(--surface)' : 'var(--surface2)',
          border: isToday ? '1px solid rgba(184,255,0,0.3)' : '1px solid var(--border)',
          borderRadius: open ? '10px 10px 0 0' : 10,
          padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Date number */}
          <div style={{ textAlign: 'center', minWidth: 36 }}>
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: isToday ? 'var(--heh-green)' : 'var(--text-muted)', marginBottom: 1 }}>
              {dayLabel.slice(0,3).toUpperCase()}
            </p>
            <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: isToday ? 'var(--heh-green)' : isPast ? 'var(--text-muted)' : 'var(--text)' }}>
              {date.getDate()}
            </p>
          </div>
          {/* Sessions summary */}
          <div>
            {sessions.length === 0
              ? <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Descanso / Livre</p>
              : sessions.map((s, i) => (
                <p key={i} style={{ fontSize: 13, fontWeight: 600, color: isPast ? 'var(--text-muted)' : 'var(--text)', lineHeight: 1.4 }}>
                  {s.description || s.type}
                </p>
              ))
            }
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {done && <span style={{ fontSize: 10, fontWeight: 800, color: '#30D158' }}>✓</span>}
          {sessions.length > 0 && (
            open
              ? <ChevronUp size={15} style={{ color: 'var(--text-muted)' }} />
              : <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />
          )}
        </div>
      </button>

      {/* Sessions */}
      {open && sessions.length > 0 && (
        <div style={{
          border: '1px solid var(--border)', borderTop: 'none',
          borderRadius: '0 0 10px 10px', overflow: 'hidden',
          padding: '8px 0 8px 0',
          background: 'var(--surface)',
        }}>
          <div style={{ padding: '0 8px' }}>
            {sessions.map((s, i) => (
              <SessionCard key={i} session={s} date={dateStr} done={done} strava={strava} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main ────────────────────────────────────────────────────── */
export default function MyPlan() {
  const { athlete } = useAuth()
  const [weekOffset,  setWeekOffset]  = useState(0)
  const [plan,        setPlan]        = useState(null)
  const [completions, setCompletions] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [pdfLoading,  setPdfLoading]  = useState(false)
  const printRef = useRef(null)

  const weekDates = getWeekDates(weekOffset)
  const today     = toYMD(new Date())
  const weekStart = toYMD(weekDates[0])
  const weekEnd   = toYMD(weekDates[6])
  const weekLabel = `${weekDates[0].getDate()}-${MONTHS_PT[weekDates[0].getMonth()]}`

  useEffect(() => {
    if (!athlete) return
    setLoading(true)
    Promise.all([
      // Plano individual para esta semana (prioritário)
      supabase.from('athlete_weekly_plans').select('content,week_start,notes')
        .eq('athlete_id', athlete.id).eq('week_start', weekStart)
        .maybeSingle(),
      // Plano de grupo (fallback)
      supabase.from('general_plans').select('content,week_start')
        .gte('week_start', weekStart).lte('week_start', weekEnd)
        .order('week_start', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('training_completions').select('date,points,confirmed_by_strava,source')
        .eq('athlete_id', athlete.id).gte('date', weekStart).lte('date', weekEnd),
    ]).then(([{ data: indData }, { data: planData }, { data: compData }]) => {
      // Se existe plano individual, converte para o mesmo formato do plano de grupo
      if (indData?.content) {
        // Individual plan content is already in {dayKey: sessions[]} format
        // Convert to group plan format for compatibility: wrap in athlete.group key
        setPlan({ ...indData, _isIndividual: true })
      } else {
        setPlan(planData)
      }
      setCompletions(compData || [])
      setLoading(false)
    })
  }, [athlete, weekStart])

  if (loading) return <LoadingSpinner />

  // Se plano individual, usa diretamente o content; senão usa o plano de grupo
  const groupPlan    = plan?._isIndividual ? (plan.content || {}) : (plan?.content?.[athlete?.group] || {})
  const completedSet = new Set((completions || []).map(c => c.date))
  const stravaSet    = new Set((completions || []).filter(c => c.confirmed_by_strava || c.source === 'strava').map(c => c.date))
  const isIndividual = !!plan?._isIndividual

  const totalSessions = weekDates.reduce((n, d) => {
    const dow = DAYS_KEY[d.getDay()]
    return n + (groupPlan[dow]?.length || 0)
  }, 0)

  const totalKm = weekDates.reduce((n, d) => {
    const dow = DAYS_KEY[d.getDay()]
    const sessions = groupPlan[dow] || []
    return n + sessions.reduce((s, sess) => s + (Number(sess.distance) || 0), 0)
  }, 0)

  async function handlePDF() {
    setPdfLoading(true)
    try { await exportPDF(printRef, weekLabel) }
    finally { setPdfLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', paddingBottom: 80 }}>
      <style>{`
        @media (max-width: 480px) {
          .plan-header-row { flex-direction: column; gap: 12px; align-items: flex-start !important; }
          .plan-week-nav { width: 100%; justify-content: space-between; }
        }
        @media print {
          body { background: #080808 !important; }
          .plan-no-print { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px 0' }}>

        {/* Header */}
        <div className="plan-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: 'clamp(22px,5vw,30px)', letterSpacing: '-0.04em', fontStyle: 'italic', color: 'var(--text)', marginBottom: 4 }}>
              PLANO DE TREINO
            </h1>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
              {athlete?.group} · SEMANA DE {weekDates[0].getDate()} {MONTHS_PT[weekDates[0].getMonth()].toUpperCase()}
            </p>
          </div>
          {/* PDF button */}
          <button
            onClick={handlePDF}
            disabled={pdfLoading}
            className="plan-no-print"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 14px', borderRadius: 10,
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 700,
              opacity: pdfLoading ? 0.5 : 1, flexShrink: 0,
            }}
          >
            <FileDown size={15} />
            {pdfLoading ? 'A gerar...' : 'PDF'}
          </button>
        </div>

        {/* Summary strip */}
        {plan && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'SESSÕES', value: totalSessions },
              { label: 'KM PLANEADOS', value: totalKm > 0 ? `${totalKm} km` : '—' },
              { label: 'CONCLUÍDOS', value: completedSet.size },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--surface)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--border)', flex: '1 1 80px' }}>
                <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 3 }}>{label}</p>
                <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em' }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Week nav */}
        <div className="plan-week-nav plan-no-print" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => setWeekOffset(w => w - 1)}
            style={{ padding: '8px 16px', borderRadius: 10, background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            ←
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)}
              style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(184,255,0,0.08)', color: 'var(--heh-green)', border: '1px solid rgba(184,255,0,0.2)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              Esta semana
            </button>
          )}
          <button onClick={() => setWeekOffset(w => w + 1)}
            style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 10, background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            →
          </button>
        </div>

        {/* Days — wrapped for PDF export */}
        <div ref={printRef}>
          {!plan ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)', fontSize: 14, background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)' }}>
              O teu treinador ainda não publicou o plano desta semana.
            </div>
          ) : weekDates.map((date, i) => {
            const dow      = DAYS_KEY[date.getDay()]
            const sessions = groupPlan[dow] || []
            const ds       = toYMD(date)
            const isToday  = ds === today
            const isPast   = date < new Date() && !isToday

            return (
              <DayCard
                key={i}
                date={date}
                dayLabel={DAYS_LONG[date.getDay()]}
                sessions={sessions}
                done={completedSet.has(ds)}
                strava={stravaSet.has(ds)}
                isToday={isToday}
                isPast={isPast}
              />
            )
          })}
        </div>

      </div>
    </div>
  )
}
