import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Camera, X, Check, Loader, ChevronDown, ChevronUp } from 'lucide-react'

function formatPace(pace) { return pace || '—' }
function formatDuration(sec) {
  if (!sec) return '—'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return h > 0 ? `${h}h${String(m).padStart(2,'0')}m` : `${m}:${String(s).padStart(2,'0')}`
}

const ZONE_COLORS = {
  z1: '#30D158', z2: '#34C759', z3: '#FFD60A', z4: '#FF9F0A', z5: '#FF453A', z6: '#BF5AF2'
}

function ZoneBar({ zones }) {
  if (!zones || !Object.keys(zones).length) return null
  const total = Object.values(zones).reduce((s, z) => s + (z.pct || 0), 0)
  if (!total) return null
  return (
    <div>
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 1, marginBottom: 6 }}>
        {Object.entries(zones).map(([key, z]) => z.pct > 0 ? (
          <div key={key} style={{ width: `${z.pct}%`, background: ZONE_COLORS[key], borderRadius: 2 }} />
        ) : null)}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {Object.entries(zones).map(([key, z]) => z.pct > 0 ? (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: ZONE_COLORS[key], flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
              {key.toUpperCase()} {Math.round(z.pct)}%
            </span>
          </div>
        ) : null)}
      </div>
    </div>
  )
}

function LapsTable({ laps }) {
  const [expanded, setExpanded] = useState(false)
  if (!laps?.length) return null
  const shown = expanded ? laps : laps.slice(0, 6)

  const TYPE_STYLE = {
    sprint:    { bg: 'rgba(255,69,58,0.15)',   text: '#FF453A' },
    interval:  { bg: 'rgba(255,69,58,0.15)',   text: '#FF453A' },
    recovery:  { bg: 'rgba(48,209,88,0.12)',   text: '#30D158' },
    easy:      { bg: 'rgba(184,255,0,0.12)',   text: '#B8FF00' },
    tempo:     { bg: 'rgba(255,214,10,0.12)',  text: '#FFD60A' },
    warmup:    { bg: 'rgba(10,132,255,0.12)',  text: '#0A84FF' },
    cooldown:  { bg: 'rgba(10,132,255,0.12)',  text: '#0A84FF' },
    unknown:   { bg: 'rgba(255,255,255,0.06)', text: '#888' },
  }

  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
        VOLTAS ({laps.length})
      </p>
      <div style={{ background: 'var(--dark)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 1fr 1fr', gap: 4, padding: '6px 10px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
          {['#', 'Dist', 'Ritmo', 'FC', 'Tipo'].map(h => (
            <span key={h} style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>
        {shown.map((lap, i) => {
          const ts = TYPE_STYLE[lap.type] || TYPE_STYLE.unknown
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 1fr 1fr', gap: 4, padding: '8px 10px', borderBottom: i < shown.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{lap.lap}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{lap.distance_km ? `${lap.distance_km}km` : '—'}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--heh-green)', fontVariantNumeric: 'tabular-nums' }}>{lap.pace || '—'}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lap.hr ? `${lap.hr}bpm` : '—'}</span>
              <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: ts.bg, color: ts.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {lap.type === 'sprint' || lap.type === 'interval' ? '⚡' : lap.type === 'recovery' ? '↓' : ''} {lap.type || '?'}
              </span>
            </div>
          )
        })}
      </div>
      {laps.length > 6 && (
        <button onClick={() => setExpanded(e => !e)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11, fontWeight: 700, color: 'var(--heh-green)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {expanded ? <><ChevronUp size={13} /> Mostrar menos</> : <><ChevronDown size={13} /> Ver todas {laps.length} voltas</>}
        </button>
      )}
    </div>
  )
}

export function WorkoutDataPreview({ data, onConfirm, onCancel, loading, readOnly = false }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 18, border: '1px solid rgba(184,255,0,0.2)', padding: '18px', marginTop: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--heh-green)', textTransform: 'uppercase' }}>
            {data.source_app || 'App'} · {data.workout_type || 'Treino'}
          </p>
          {data.ai_summary && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>{data.ai_summary}</p>
          )}
        </div>
      </div>

      {/* Key stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'DISTÂNCIA',  value: data.distance_km ? `${data.distance_km} km` : '—' },
          { label: 'DURAÇÃO',    value: formatDuration(data.duration_sec) },
          { label: 'RITMO MÉD', value: formatPace(data.pace_avg) },
          { label: 'FC MÉD',    value: data.hr_avg ? `${data.hr_avg} bpm` : '—' },
          { label: 'FC MÁX',    value: data.hr_max ? `${data.hr_max} bpm` : '—' },
          { label: 'CADÊNCIA',   value: data.cadence_avg ? `${data.cadence_avg} spm` : '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: 'var(--dark)', borderRadius: 10, padding: '10px 10px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>{label}</p>
            <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Power if present */}
      {data.power_avg && (
        <div style={{ background: 'var(--dark)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>POTÊNCIA</span>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#FFD60A' }}>{data.power_avg} W</span>
        </div>
      )}

      {/* HR Zones */}
      {data.hr_zones && Object.values(data.hr_zones).some(z => z?.pct > 0) && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>ZONAS FC</p>
          <ZoneBar zones={data.hr_zones} />
        </div>
      )}

      {/* Power Zones */}
      {data.power_zones && Object.values(data.power_zones).some(z => z?.pct > 0) && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>ZONAS POTÊNCIA</p>
          <ZoneBar zones={data.power_zones} />
        </div>
      )}

      {/* Laps */}
      {data.laps?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <LapsTable laps={data.laps} />
        </div>
      )}

      {/* Actions */}
      {!readOnly && (
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={onConfirm} disabled={loading}
            style={{ flex: 1, padding: '13px', borderRadius: 12, fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', background: 'var(--heh-green)', color: '#080808', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'A guardar...' : '✓ Confirmar treino +20 pts'}
          </button>
          <button onClick={onCancel} disabled={loading}
            style={{ padding: '13px 16px', borderRadius: 12, fontWeight: 700, fontSize: 13, border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function WorkoutUpload({ athlete, date, onComplete }) {
  const [state, setState]       = useState('idle') // idle | analyzing | preview | saving | done | error
  const [workoutData, setWorkoutData] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef()

  async function handleFile(file) {
    if (!file) return
    setState('analyzing')
    setErrorMsg('')
    setWorkoutData(null)

    try {
      // Convert to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Analyze with Claude
      const res = await fetch('/api/analyze-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type || 'image/jpeg' })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Upload image to Supabase Storage
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${athlete.id}/${date}_${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('workout-screenshots')
        .upload(path, file, { upsert: true })
      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage
          .from('workout-screenshots').getPublicUrl(path)
        data.screenshot_url = publicUrl
      }

      setWorkoutData(data)
      setState('preview')
    } catch (e) {
      setErrorMsg(e.message)
      setState('error')
    }
  }

  async function confirmWorkout() {
    if (!workoutData) return
    setState('saving')
    try {
      const { error } = await supabase.from('training_completions').upsert({
        athlete_id:     athlete.id,
        date,
        session_label:  'Treino',
        points:         20,
        source:         'screenshot',
        confirmed_by_strava: false,
        screenshot_url: workoutData.screenshot_url || null,
        distance_km:    workoutData.distance_km || null,
        duration_sec:   workoutData.duration_sec || null,
        pace_avg:       workoutData.pace_avg || null,
        hr_avg:         workoutData.hr_avg || null,
        hr_max:         workoutData.hr_max || null,
        cadence_avg:    workoutData.cadence_avg || null,
        power_avg:      workoutData.power_avg || null,
        elevation_m:    workoutData.elevation_m || null,
        laps:           workoutData.laps || null,
        hr_zones:       workoutData.hr_zones || null,
        power_zones:    workoutData.power_zones || null,
        ai_summary:     workoutData.ai_summary || null,
      }, { onConflict: 'athlete_id,date,session_label' })

      if (error) throw new Error(error.message)
      setState('done')
      onComplete?.()
    } catch (e) {
      setErrorMsg(e.message)
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, background: 'rgba(184,255,0,0.10)', color: 'var(--heh-green)', fontWeight: 700, fontSize: 13 }}>
        <Check size={16} /> Treino confirmado! +20 pts
      </div>
    )
  }

  return (
    <div>
      {/* Upload button */}
      {(state === 'idle' || state === 'error') && (
        <>
          <button onClick={() => fileRef.current?.click()}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, fontWeight: 700, fontSize: 13, border: '1.5px dashed rgba(255,255,255,0.15)', cursor: 'pointer', background: 'transparent', color: 'var(--text-muted)', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--heh-green)'; e.currentTarget.style.color = 'var(--heh-green)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'var(--text-muted)' }}>
            <Camera size={16} />
            Confirmar com Garmin / Apple / Polar
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])} />
          {state === 'error' && <p style={{ fontSize: 12, color: '#FF453A', marginTop: 6 }}>Erro: {errorMsg}</p>}
        </>
      )}

      {/* Analyzing */}
      {state === 'analyzing' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 12, background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
          <Loader size={16} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--heh-green)' }} />
          A analisar o teu treino com IA…
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Preview */}
      {state === 'preview' && workoutData && (
        <WorkoutDataPreview
          data={workoutData}
          onConfirm={confirmWorkout}
          onCancel={() => setState('idle')}
          loading={false}
        />
      )}

      {/* Saving */}
      {state === 'saving' && workoutData && (
        <WorkoutDataPreview
          data={workoutData}
          onConfirm={() => {}}
          onCancel={() => {}}
          loading={true}
        />
      )}
    </div>
  )
}
