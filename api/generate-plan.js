// api/generate-plan.js — Gerador de plano semanal por IA (Claude)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { athlete } = req.body || {}
  if (!athlete) return res.status(400).json({ error: 'athlete required' })

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured' })

  // Calcular idade
  const age = athlete.date_of_birth
    ? Math.floor((Date.now() - new Date(athlete.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  // Nível do grupo
  const groupLevel = {
    G1: 'Elite / Alto rendimento (sub 33min 10km)',
    G2: 'Avançado (33-37min 10km)',
    G3: 'Intermédio-avançado (37-42min 10km)',
    G4: 'Intermédio (42-48min 10km)',
    G5: 'Iniciante-intermédio (48-55min 10km)',
    G6: 'Iniciante (acima de 55min 10km)',
  }[athlete.group] || 'Nível desconhecido'

  function secsToStr(s) {
    if (!s) return null
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  const pr10 = secsToStr(athlete.pr_10km)
  const pr5  = secsToStr(athlete.pr_5km)

  const prompt = `És um treinador de atletismo português especializado em planeamento de treino. Cria um plano semanal personalizado para este atleta.

PERFIL DO ATLETA:
- Nome: ${athlete.name}
- Sexo: ${athlete.sex === 'M' ? 'Masculino' : 'Feminino'}${age ? ` (${age} anos)` : ''}
- Grupo: ${athlete.group} — ${groupLevel}
- PR 10km: ${pr10 || 'desconhecido'}
- PR 5km: ${pr5 || 'desconhecido'}
- Modalidades: ${athlete.modalities?.join(', ') || 'Corrida de fundo'}
- Notas do treinador: ${athlete.notes || 'nenhuma'}

TIPOS DE SESSÃO DISPONÍVEIS:
- CCL: Corrida Contínua Leve — ritmo fácil, aeróbio base
- CCN: Corrida Contínua Normal — ritmo moderado, limiar aeróbio
- CCR: Corrida Contínua Rápida / Intervalos — ritmo de prova, treino de velocidade
- Pista: Sessão de pista — repetições, velocidade, técnica de corrida
- Subidas: Treino em subidas — força específica, potência
- Força: Reforço muscular / ginásio — core, pernas, mobilidade, prevenção de lesões
- Descanso: Dia de descanso ativo ou total
- Blocos: Treino de blocos de ritmo variado
- Prova: Dia de prova / competição

REGRAS PARA O PLANO:
1. Segunda a Domingo (7 dias)
2. 4-5 dias de treino, 2-3 de descanso
3. OBRIGATÓRIO: 1-2 sessões de Força por semana (reforço muscular)
4. Distribuição: CCL nas recuperações, CCN base, CCR ou Pista 1x semana
5. Nunca dias duros consecutivos (CCR, Pista, Subidas)
6. Descanso depois dos treinos mais intensos
7. Ritmos calculados com base nos PRs: CCL = PR10km + 1:30/km, CCN = PR10km + 0:45/km, CCR = PR10km pace
8. Distâncias adequadas ao nível: G1-G2 maiores volumes, G5-G6 menores
9. Sessões de Força: inclui exercícios específicos na descrição (ex: agachamentos, lunges, core, elásticos, isométricos)
10. Se não há PR, usa distâncias conservadoras e ritmos por esforço percebido

RESPONDE APENAS COM JSON VÁLIDO, sem texto antes ou depois, sem markdown, sem blocos de código:
{
  "segunda": [{"type": "CCL", "description": "Corrida contínua leve", "distance": 8, "pace": "5:45-6:00/km", "notes": "Ritmo conversacional"}],
  "terça": [{"type": "Força", "description": "Reforço muscular", "distance": null, "pace": null, "notes": "Agachamentos 3x12, lunges 3x10, core 3x1min, elásticos glúteos"}],
  "quarta": [],
  "quinta": [{"type": "CCN", "description": "Corrida a ritmo moderado", "distance": 10, "pace": "5:15-5:30/km", "notes": "Ritmo confortavelmente difícil"}],
  "sexta": [],
  "sábado": [{"type": "CCR", "description": "Intervalos 6x1km", "distance": 10, "pace": "4:45/km nos intervalos", "notes": "Recuperação 90s entre repetições"}],
  "domingo": []
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    if (data.error) return res.status(500).json({ error: data.error.message })

    const text = data.content?.[0]?.text || ''

    // Parse JSON da resposta
    let plan
    try {
      // Remove possível markdown se houver
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      plan = JSON.parse(cleaned)
    } catch (e) {
      return res.status(500).json({ error: 'Resposta da IA inválida', raw: text })
    }

    // Normalizar — garantir que todos os dias existem
    const DAYS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']
    const normalized = {}
    for (const day of DAYS) {
      normalized[day] = Array.isArray(plan[day]) ? plan[day] : []
    }

    return res.status(200).json({ plan: normalized })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
