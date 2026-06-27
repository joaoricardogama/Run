/**
 * Escalões da Federação Portuguesa de Atletismo (FPA)
 * Fonte: Normas de Atuação Administrativa 2025/2026
 *
 * Regra: o escalão é determinado pela idade que o atleta atinge no ano civil
 * (ano corrente − ano de nascimento), independentemente da data do aniversário.
 * Exceção: Veteranos — a mudança de categoria ocorre no próprio dia do aniversário.
 */

export function getEscalao(dateOfBirth, sex) {
  if (!dateOfBirth || !sex) return null

  const birthYear  = new Date(dateOfBirth).getFullYear()
  const birthDate  = new Date(dateOfBirth)
  const today      = new Date()
  const ageInYear  = today.getFullYear() - birthYear   // idade no ano civil

  const sfx = sex === 'M' ? 'M' : 'F'

  // Veteranos — a partir do dia do 35º aniversário
  if (ageInYear >= 35) {
    // idade real (considera se o aniversário já passou este ano)
    let realAge = today.getFullYear() - birthYear
    if (
      today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
    ) {
      realAge--
    }

    if (realAge < 35)  return `Sub-23 ${sfx}` // ainda não fez 35
    if (realAge < 40)  return `V35 ${sfx}`
    if (realAge < 45)  return `V40 ${sfx}`
    if (realAge < 50)  return `V45 ${sfx}`
    if (realAge < 55)  return `V50 ${sfx}`
    if (realAge < 60)  return `V55 ${sfx}`
    if (realAge < 65)  return `V60 ${sfx}`
    if (realAge < 70)  return `V65 ${sfx}`
    return `V70 ${sfx}`
  }

  // Todos os outros escalões — por idade no ano civil
  if (ageInYear <= 9)  return `Benjamim A ${sfx}`
  if (ageInYear <= 11) return `Benjamim B ${sfx}`
  if (ageInYear <= 13) return `Infantil ${sfx}`
  if (ageInYear <= 15) return `Iniciado ${sfx}`
  if (ageInYear <= 17) return `Sub-18 ${sfx}`
  if (ageInYear <= 19) return `Sub-20 ${sfx}`
  if (ageInYear <= 22) return `Sub-23 ${sfx}`
  return `Sénior ${sfx}`
}

export const ESCALAO_COLORS = {
  'Benjamim A': '#FFD60A',
  'Benjamim B': '#FFD60A',
  'Infantil':   '#30D158',
  'Iniciado':   '#34C759',
  'Sub-18':     '#0A84FF',
  'Sub-20':     '#007AFF',
  'Sub-23':     '#5E5CE6',
  'Sénior':     '#BF5AF2',
  'V35':        '#FF6B35',
  'V40':        '#FF9F0A',
  'V45':        '#FF9F0A',
  'V50':        '#FF453A',
  'V55':        '#FF453A',
  'V60':        '#FF453A',
  'V65':        '#FF453A',
  'V70':        '#FF453A',
}

export function escalaoColor(escalao) {
  if (!escalao) return 'var(--text-muted)'
  const key = Object.keys(ESCALAO_COLORS).find(k => escalao.startsWith(k))
  return key ? ESCALAO_COLORS[key] : 'var(--text-muted)'
}

/**
 * Formata tempo em segundos para exibição por distância
 * 100m/200m/400m → SS.cs   ex: 11.42s
 * 800m/1500m/3000m → M:SS.cs   ex: 2:01.50
 * 5km+ → MM:SS   ex: 35:40
 */
export function formatTime(seconds, distance) {
  if (!seconds) return '—'
  const s = Number(seconds)
  if (['100m','200m','400m'].includes(distance)) {
    return s.toFixed(2) + 's'
  }
  if (['800m','1500m','3000m'].includes(distance)) {
    const mins = Math.floor(s / 60)
    const secs = (s % 60).toFixed(2).padStart(5, '0')
    return `${mins}:${secs}`
  }
  const mins = Math.floor(s / 60)
  const secs = String(Math.floor(s % 60)).padStart(2, '0')
  return `${mins}:${secs}`
}

export const DISTANCES = [
  '100m','200m','400m','800m','1500m','3000m',
  '5km','10km','Meia Maratona','Maratona','Corta-Mato','Marcha','Estafetas','Outra',
]

export const MEDAL_COLORS = {
  ouro:    { bg: 'rgba(255,214,10,0.15)',   text: '#FFD60A', border: 'rgba(255,214,10,0.4)',   emoji: '🥇' },
  prata:   { bg: 'rgba(192,192,192,0.15)', text: '#C0C0C0', border: 'rgba(192,192,192,0.4)', emoji: '🥈' },
  bronze:  { bg: 'rgba(205,127,50,0.15)',  text: '#CD7F32', border: 'rgba(205,127,50,0.4)',  emoji: '🥉' },
  default: { bg: 'rgba(255,255,255,0.05)', text: 'var(--text-muted)', border: 'var(--border)', emoji: '🏅' },
}

export function getMedalFromPosition(pos) {
  if (pos === 1) return 'ouro'
  if (pos === 2) return 'prata'
  if (pos === 3) return 'bronze'
  return null
}
