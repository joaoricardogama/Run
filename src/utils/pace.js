/**
 * Format seconds into MM:SS string
 */
export function formatTime(seconds) {
  if (!seconds && seconds !== 0) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Parse MM:SS string to total seconds
 */
export function parseTime(str) {
  if (!str) return null
  const parts = str.split(':')
  if (parts.length !== 2) return null
  const m = parseInt(parts[0], 10)
  const s = parseInt(parts[1], 10)
  if (isNaN(m) || isNaN(s)) return null
  return m * 60 + s
}

/**
 * Calculate pace zones from a PR in seconds over a distance in km
 * Returns object with CCL, CCN, CCR each having min and max seconds/km
 */
export function calculateZones(prSeconds, distanceKm) {
  if (!prSeconds || !distanceKm) return null
  const base = prSeconds / distanceKm
  return {
    base,
    CCL: { min: base + 60, max: base + 75 },
    CCN: { min: base + 30, max: base + 45 },
    CCR: { min: base, max: base + 15 },
  }
}

/**
 * Format a pace zone range as "MM:SS - MM:SS /km"
 */
export function formatZoneRange(zone) {
  if (!zone) return '--:-- - --:--'
  return `${formatTime(Math.round(zone.min))} - ${formatTime(Math.round(zone.max))} /km`
}

/**
 * Calculate pace per km from time in seconds and distance in km
 */
export function calcPacePerKm(timeSeconds, distanceKm) {
  if (!timeSeconds || !distanceKm) return null
  return timeSeconds / distanceKm
}

/**
 * Format a date as dd/mm/yyyy (Portuguese format)
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Format distance in km: show integer if whole, else 1 decimal
 */
export function formatDistance(km) {
  if (!km && km !== 0) return ''
  return Number.isInteger(km) ? `${km}` : km.toFixed(1)
}
