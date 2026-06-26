// Auto-assign G1–G6 based on sex and 10km PR (seconds)
// Thresholds from Run Tejo group criteria image
const THRESHOLDS = {
  M: [
    { group: 'G1', max: 33 * 60 },           // sub 33:00
    { group: 'G2', max: 38 * 60 },           // sub 38:00
    { group: 'G3', max: 45 * 60 },           // sub 45:00
    { group: 'G4', max: 52 * 60 + 30 },      // sub 52:30
    { group: 'G5', max: 60 * 60 },           // sub 60:00
    { group: 'G6', max: Infinity },           // +60:00
  ],
  F: [
    { group: 'G1', max: 37 * 60 + 30 },      // sub 37:30
    { group: 'G2', max: 42 * 60 + 30 },      // sub 42:30
    { group: 'G3', max: 50 * 60 },           // sub 50:00
    { group: 'G4', max: 57 * 60 + 30 },      // sub 57:30
    { group: 'G5', max: 65 * 60 },           // sub 65:00
    { group: 'G6', max: Infinity },           // +65:00
  ],
}

export function assignGroup(sex, pr10kmSeconds) {
  if (!sex || !pr10kmSeconds) return null
  const tiers = THRESHOLDS[sex]
  if (!tiers) return null
  for (const { group, max } of tiers) {
    if (pr10kmSeconds < max) return group
  }
  return 'G6'
}

export const MODALITIES = ['Atletismo', 'Ciclismo', 'Outro']

export const SPECIALIZATIONS = {
  Atletismo: [
    { group: 'Estrada', items: ['5km Estrada', '10km Estrada', 'Meia Maratona', 'Maratona', 'Trail / Ultra'] },
    { group: 'Pista',   items: ['100m', '200m', '400m', '800m', '1500m', '3000m', '5000m', '10000m', '110m/100m Barreiras', '400m Barreiras', '3000m Obstáculos'] },
    { group: 'Campo',   items: ['Salto em Comprimento', 'Salto em Altura', 'Salto com Vara', 'Triplo Salto', 'Lançamento do Peso', 'Lançamento do Disco', 'Lançamento do Martelo', 'Lançamento do Dardo', 'Pentatlo / Heptatlo / Decatlo'] },
  ],
  Ciclismo: [
    { group: 'Modalidade', items: ['Estrada', 'Montanha (MTB)', 'Pista', 'Ciclocross', 'Gravel', 'Triatlo'] },
  ],
  Outro: [
    { group: 'Outro', items: ['Natação', 'Ténis', 'Futebol', 'Padel', 'Basquetebol', 'Outro'] },
  ],
}
