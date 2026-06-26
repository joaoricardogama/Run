// Vercel serverless function — Strava OAuth
// Mantém o STRAVA_CLIENT_SECRET server-side, nunca exposto ao browser.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const CLIENT_ID     = process.env.STRAVA_CLIENT_ID
  const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET
  const { action, code, refresh_token } = req.query

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: 'Strava credentials not configured on server.' })
  }

  // ── Troca código inicial por tokens ─────────────────────────
  if (action === 'exchange') {
    if (!code) return res.status(400).json({ error: 'Missing code' })

    const stravaRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    })

    const data = await stravaRes.json()

    if (!stravaRes.ok) {
      return res.status(400).json({ error: data.message || 'Strava exchange failed' })
    }

    return res.status(200).json({
      access_token:       data.access_token,
      refresh_token:      data.refresh_token,
      expires_at:         data.expires_at,
      strava_athlete_id:  data.athlete?.id,
    })
  }

  // ── Refresh de token expirado ────────────────────────────────
  if (action === 'refresh') {
    if (!refresh_token) return res.status(400).json({ error: 'Missing refresh_token' })

    const stravaRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    const data = await stravaRes.json()

    if (!stravaRes.ok) {
      return res.status(400).json({ error: data.message || 'Strava refresh failed' })
    }

    return res.status(200).json({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_at:    data.expires_at,
    })
  }

  return res.status(400).json({ error: 'Invalid action. Use ?action=exchange or ?action=refresh' })
}
