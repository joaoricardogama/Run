// Vercel serverless — analyze workout screenshot with Claude Vision
// POST { imageBase64: string, mimeType: string }
// Returns structured workout metrics

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { imageBase64, mimeType = 'image/jpeg' } = req.body || {}
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' })

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })

  const prompt = `Analyze this workout screenshot from Garmin Connect, Apple Fitness, Polar, Suunto, or similar app.

Extract ALL visible metrics and return ONLY valid JSON (no markdown, no explanation):

{
  "source_app": "Garmin|Apple|Polar|Suunto|Other",
  "workout_type": "Run|Bike|Swim|Other",
  "date": "YYYY-MM-DD or null",
  "distance_km": number or null,
  "duration_sec": number or null,
  "pace_avg": "M:SS/km or null",
  "pace_best": "M:SS/km or null",
  "hr_avg": number or null,
  "hr_max": number or null,
  "cadence_avg": number or null,
  "power_avg": number or null,
  "elevation_m": number or null,
  "calories": number or null,
  "laps": [
    {
      "lap": 1,
      "distance_km": number,
      "duration_sec": number,
      "pace": "M:SS/km",
      "hr": number or null,
      "cadence": number or null,
      "type": "warmup|easy|tempo|interval|sprint|recovery|cooldown|unknown"
    }
  ],
  "hr_zones": {
    "z1": {"label": "Recuperação", "pct": number, "sec": number},
    "z2": {"label": "Fácil",       "pct": number, "sec": number},
    "z3": {"label": "Aeróbico",    "pct": number, "sec": number},
    "z4": {"label": "Limiar",      "pct": number, "sec": number},
    "z5": {"label": "VO2max",      "pct": number, "sec": number}
  },
  "power_zones": {
    "z1": {"label": "Ativo", "pct": number},
    "z2": {"label": "Endurance", "pct": number},
    "z3": {"label": "Tempo", "pct": number},
    "z4": {"label": "Limiar", "pct": number},
    "z5": {"label": "VO2max", "pct": number},
    "z6": {"label": "Neuromuscular", "pct": number}
  },
  "ai_summary": "1-2 sentence description of the workout structure in Portuguese"
}

For laps, identify the type:
- Laps with pace > 8:00/km = warmup or recovery
- Laps around 5:00-7:00/km with 1km = easy/tempo
- Laps 30s or very short with fast pace = sprint or interval
- Laps between fast ones = recovery

If a section is not visible in the screenshot, use null or empty array [].
Return ONLY the JSON object, nothing else.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: imageBase64 }
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(500).json({ error: 'Claude API error', details: err })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    // Extract JSON from response
    let parsed
    try {
      // Remove any markdown code blocks if present
      const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      return res.status(500).json({ error: 'Failed to parse Claude response', raw: text })
    }

    return res.status(200).json(parsed)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
