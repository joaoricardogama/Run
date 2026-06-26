function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function extractRaceFromImage(file) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('API key não configurada')

  const base64 = await fileToBase64(file)
  const mediaType = file.type || 'image/jpeg'

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-client-side-api-key': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: `Analisa esta imagem de uma prova de corrida/atletismo e extrai a informação.
Devolve APENAS um objeto JSON válido com estes campos (sem texto adicional):
{
  "name": "nome completo da prova",
  "date": "YYYY-MM-DD",
  "distance_km": número,
  "location": "cidade ou local",
  "description": "breve descrição da prova",
  "registration_url": "URL ou null"
}
Regras: date sempre em formato YYYY-MM-DD. distance_km é número (ex: 10, 21.1, 42.195). Se um campo não for visível usa null.`,
          },
        ],
      }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Erro ${res.status}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text || ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('A IA não devolveu dados reconhecíveis')
  return JSON.parse(match[0])
}
