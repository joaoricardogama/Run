import { supabase } from './supabase'

export async function getValidStravaToken(athlete, refreshAthlete) {
  let token = athlete?.strava_access_token
  if (!token) return null
  if (Date.now() > athlete.strava_token_expires_at * 1000 - 5 * 60 * 1000) {
    const res = await fetch(`/api/strava?action=refresh&refresh_token=${athlete.strava_refresh_token}`)
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    token = data.access_token
    await supabase.from('athletes').update({
      strava_access_token: data.access_token,
      strava_refresh_token: data.refresh_token,
      strava_token_expires_at: data.expires_at,
    }).eq('id', athlete.id)
    if (refreshAthlete) await refreshAthlete()
  }
  return token
}

export async function fetchStravaActivity(stravaId, token) {
  const res = await fetch(`https://www.strava.com/api/v3/activities/${stravaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}
