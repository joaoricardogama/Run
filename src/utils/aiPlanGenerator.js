// AI-assisted weekly training plan generator
// Based on João Gama's Run Tejo training templates

const GROUPS = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6']

// Monday: depends on whether there's a race
function monday(hasRace) {
  return {
    G1: [{ type: hasRace ? 'CCL' : 'CCN', description: hasRace ? 'CCL pós-prova' : 'CCN', distance: hasRace ? 10 : 14, pace: '', notes: hasRace ? 'Recuperação ativa após prova' : '' }],
    G2: [{ type: hasRace ? 'CCL' : 'CCN', description: hasRace ? 'CCL pós-prova' : 'CCN', distance: hasRace ? 8 : 12, pace: '', notes: hasRace ? 'Recuperação ativa após prova' : '' }],
    G3: [{ type: hasRace ? 'CCL' : 'CCN', description: hasRace ? 'CCL pós-prova' : 'CCN', distance: hasRace ? 6 : 10, pace: '', notes: '' }],
    G4: [{ type: hasRace ? 'CCL' : 'CCN', description: hasRace ? 'CCL pós-prova' : 'CCN', distance: hasRace ? 6 : 8, pace: '', notes: '' }],
    G5: [{ type: hasRace ? 'CCL' : 'CCN', description: hasRace ? 'CCL pós-prova' : 'CCN', distance: hasRace ? 5 : 6, pace: '', notes: hasRace ? 'Pode substituir por caminhada rápida' : '' }],
    G6: [{ type: hasRace ? 'Descanso' : 'CCL', description: hasRace ? 'Caminhada ativa' : 'Caminhada', distance: hasRace ? 5 : 4, pace: '', notes: hasRace ? 'Caminhada de recuperação' : 'Caminhada ou CCN muito leve' }],
  }
}

// Tuesday: CCL
function tuesday() {
  return {
    G1: [{ type: 'CCL', description: 'CCL', distance: 12, pace: '', notes: '' }],
    G2: [{ type: 'CCL', description: 'CCL', distance: 10, pace: '', notes: '' }],
    G3: [{ type: 'CCL', description: 'CCL', distance: 8, pace: '', notes: '' }],
    G4: [{ type: 'CCL', description: 'CCL', distance: 8, pace: '', notes: '' }],
    G5: [{ type: 'CCL', description: 'CCL', distance: 6, pace: '', notes: '' }],
    G6: [{ type: 'CCL', description: 'CCL', distance: 5, pace: '', notes: '' }],
  }
}

// Wednesday: morning CCL (G1/G2) + afternoon track 300m series
function wednesday() {
  const trackSession = (reps, rest) => ({
    type: 'Pista',
    description: `Séries 300m — Pista do Jamor 19h30`,
    distance: null,
    pace: '',
    notes: `15' aquecimento + técnica de corrida + 4 retas | ${reps}x300m c/ ${rest} rec. | 10' CCL final`,
  })
  return {
    G1: [
      { type: 'CCL', description: 'CCL manhã', distance: 8, pace: '', notes: 'Opcional — grupos mais avançados' },
      trackSession('12', "1'"),
    ],
    G2: [
      { type: 'CCL', description: 'CCL manhã', distance: 6, pace: '', notes: 'Opcional' },
      trackSession('12', "1'15\""),
    ],
    G3: [trackSession('10', "1'30\"")],
    G4: [trackSession('8', "1'30\"")],
    G5: [trackSession('6', "2'")],
    G6: [trackSession('4', "2'30\"")],
  }
}

// Thursday: CCL
function thursday() {
  return {
    G1: [{ type: 'CCL', description: 'CCL', distance: 14, pace: '', notes: '' }],
    G2: [{ type: 'CCL', description: 'CCL', distance: 12, pace: '', notes: '' }],
    G3: [{ type: 'CCL', description: 'CCL', distance: 10, pace: '', notes: '' }],
    G4: [{ type: 'CCL', description: 'CCL', distance: 8, pace: '', notes: '' }],
    G5: [{ type: 'CCL', description: 'CCL', distance: 6, pace: '', notes: '' }],
    G6: [{ type: 'CCL', description: 'CCL', distance: 5, pace: '', notes: '' }],
  }
}

// Friday: CCL (G1/G2 only, rest = rest)
function friday() {
  return {
    G1: [{ type: 'CCL', description: 'CCL', distance: 10, pace: '', notes: '' }],
    G2: [{ type: 'CCL', description: 'CCL', distance: 8, pace: '', notes: '' }],
    G3: [{ type: 'Descanso', description: 'Descanso', distance: null, pace: '', notes: '' }],
    G4: [{ type: 'Descanso', description: 'Descanso', distance: null, pace: '', notes: '' }],
    G5: [{ type: 'Descanso', description: 'Descanso', distance: null, pace: '', notes: '' }],
    G6: [{ type: 'Descanso', description: 'Descanso', distance: null, pace: '', notes: '' }],
  }
}

// Saturday: 800m series — Pista Jamor 09h30
function saturday() {
  const trackSession = (reps, rest) => ({
    type: 'Pista',
    description: 'Séries 800m — Pista do Jamor 09h30',
    distance: null,
    pace: '',
    notes: `15' CCL aquecimento | ${reps}x800m c/ ${rest} rec. | 10' CCL final`,
  })
  return {
    G1: [trackSession('6', "2'30\"")],
    G2: [trackSession('5', "3'")],
    G3: [trackSession('4', "3'30\"")],
    G4: [trackSession('4', "4'")],
    G5: [trackSession('3', "4'30\"")],
    G6: [trackSession('2', "5'")],
  }
}

// Sunday: progressive long run
function sunday() {
  return {
    G1: [{ type: 'CCL', description: 'Progressivo longo', distance: 18, pace: '', notes: 'Progressão de ritmo no último terço' }],
    G2: [{ type: 'CCL', description: 'Progressivo longo', distance: 16, pace: '', notes: 'Progressão de ritmo no último terço' }],
    G3: [{ type: 'CCL', description: 'Progressivo longo', distance: 14, pace: '', notes: 'Progressão de ritmo no último terço' }],
    G4: [{ type: 'CCL', description: 'Progressivo longo', distance: 12, pace: '', notes: '' }],
    G5: [{ type: 'CCL', description: 'Progressivo longo', distance: 10, pace: '', notes: '' }],
    G6: [{ type: 'CCL', description: 'Caminhada/CCL longo', distance: 8, pace: '', notes: '' }],
  }
}

/**
 * Generate a full week content object for all groups.
 * @param {boolean} hasRaceMonday - true if there was a race the weekend before
 * @param {Function} getPaceZone - optional: (group, type) => pace string
 * @returns content object shaped for general_plans.content
 */
export function generateWeekPlan(hasRaceMonday = false) {
  const dayPlans = {
    segunda:  monday(hasRaceMonday),
    terça:    tuesday(),
    quarta:   wednesday(),
    quinta:   thursday(),
    sexta:    friday(),
    sábado:   saturday(),
    domingo:  sunday(),
  }

  const content = {}
  for (const group of GROUPS) {
    content[group] = {}
    for (const [day, groups] of Object.entries(dayPlans)) {
      const sessions = groups[group] || []
      if (sessions.length > 0) {
        content[group][day] = sessions
      }
    }
  }
  return content
}
