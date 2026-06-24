import { formatTime, calculateZones } from './pace'

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

/**
 * Generate a 3-week individual plan for an athlete.
 * @param {object} athlete  - { name, pr_5km, pr_10km, notes }
 * @param {string} objective - '5km' | '10km'
 * @param {number} weeks     - number of weeks (default 3)
 * @returns {Array} array of week objects
 */
export function generateIndividualPlan(athlete, objective, weeks = 3) {
  const prSeconds = objective === '5km' ? athlete.pr_5km : athlete.pr_10km
  const distanceKm = objective === '5km' ? 5 : 10
  const zones = calculateZones(prSeconds, distanceKm)
  const hasSciatica = athlete.notes && athlete.notes.toLowerCase().includes('ciática')

  const paceNote = (type) => {
    if (!zones) return ''
    const z = zones[type]
    if (!z) return ''
    return `${formatTime(Math.round(z.min))}-${formatTime(Math.round(z.max))}/km`
  }

  // Track days = Wednesday (index 2) and Saturday (index 5) — strength never the day before
  // Day before track: Tuesday (1) and Friday (4)
  const TRACK_DAYS = new Set([2, 5])
  const NO_STRENGTH_DAYS = new Set([1, 4])

  const planWeeks = []

  for (let w = 0; w < weeks; w++) {
    const weekLabel = w === 0 ? 'Semana 1 — Base + Colinas + Força A'
      : w === 1 ? 'Semana 2 — Específico + Blocos + Força B'
      : 'Semana 3 — Taper + Activação + Força C'

    const days = DAYS.map((day, idx) => {
      let session = null

      if (TRACK_DAYS.has(idx)) {
        // Wednesday: track, Saturday: long run or track depending on week
        if (idx === 2) {
          const intervals = w === 0
            ? '6x400m'
            : w === 1
            ? '4x1000m'
            : '4x400m (activação)'
          session = {
            type: 'Pista',
            description: `Pista — ${intervals}`,
            pace: paceNote('CCR'),
            notes: '',
          }
        } else {
          // Saturday
          if (w === 2) {
            session = {
              type: 'CCL',
              description: w === 2 ? 'Corrida leve taper' : 'Corrida longa',
              distance: w === 2 ? 5 : objective === '10km' ? 12 : 8,
              pace: paceNote('CCL'),
              notes: '',
            }
          } else {
            session = {
              type: 'CCN',
              description: 'Corrida longa com variações',
              distance: objective === '10km' ? 10 + w * 2 : 7 + w,
              pace: paceNote('CCN'),
              notes: '',
            }
          }
        }
      } else if (NO_STRENGTH_DAYS.has(idx)) {
        // Tuesday / Friday — no strength, easy run or CCN
        if (idx === 1) {
          session = {
            type: 'CCL',
            description: 'Corrida suave',
            distance: 6,
            pace: paceNote('CCL'),
            notes: '',
          }
        } else {
          session = {
            type: 'CCN',
            description: w === 2 ? 'Corrida moderada (taper)' : 'Ritmo contínuo',
            distance: w === 2 ? 4 : 6,
            pace: paceNote('CCN'),
            notes: '',
          }
        }
      } else if (idx === 0) {
        // Monday
        session = {
          type: 'CCL',
          description: 'Corrida de recuperação',
          distance: 5,
          pace: paceNote('CCL'),
          notes: '',
        }
      } else if (idx === 3) {
        // Thursday — hills (week 1), blocks (week 2), rest/activation (week 3)
        if (w === 0) {
          session = {
            type: 'CCR',
            description: 'Subidas — 6x colinas 200m',
            pace: paceNote('CCR'),
            notes: hasSciatica ? 'Atenção à ciática: core activo, não inclinar o tronco.' : '',
          }
        } else if (w === 1) {
          session = {
            type: 'CCR',
            description: 'Blocos — 3x2km ao ritmo de corrida',
            pace: paceNote('CCR'),
            notes: hasSciatica ? 'Atenção à ciática: aquecimento prolongado.' : '',
          }
        } else {
          session = {
            type: 'CCL',
            description: 'Corrida suave activação',
            distance: 4,
            pace: paceNote('CCL'),
            notes: '',
          }
        }
      } else if (idx === 6) {
        // Sunday — rest
        session = { type: 'Descanso', description: 'Descanso / Mobilidade', notes: '' }
      } else {
        session = { type: 'Descanso', description: 'Descanso', notes: '' }
      }

      // Strength sessions: placed Monday (w0=A, w1=B, w2=C) — not day before track
      if (idx === 0 && !NO_STRENGTH_DAYS.has(idx) && !TRACK_DAYS.has(idx)) {
        const strengthLabel = ['A', 'B', 'C'][w] || 'A'
        session = {
          ...session,
          strength: `Força ${strengthLabel} — Ginásio (core, glúteos, mobilidade)`,
          strengthNotes: hasSciatica
            ? 'Evitar exercícios de carga axial pesada; priorizar McGill Big 3.'
            : '',
        }
      }

      return { day, idx, session }
    })

    planWeeks.push({ week: w + 1, label: weekLabel, days })
  }

  return planWeeks
}
