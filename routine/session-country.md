Research ONLY **{{COUNTRY}}** and write its tables in `output/countries/country-{{PART2}}.json`.
Do not touch the files of the other countries and do not write `output/highlights.json` or
`output/DONE`: other sessions do that.

Run the deep-research skill once for this country. Spawn the research subagents in parallel,
splitting the 25 niches of the brief between them so that every niche and subniche is covered,
plus local platforms, viral content and creators of {{COUNTRY}}. Keep the notes in
`research_notes/{{SLUG}}/`. Then write the JSON yourself from the notes:

```json
{
  "country": "{{HEADING}}",
  "trends": [
    {
      "niche": 1,
      "subniche": "Subnicho",
      "trend": "Nome curto da tendência",
      "stage": "Em crescimento",
      "longevity": "Média",
      "platforms": "TikTok, Reddit",
      "evidence": "O dado que comprova, com número (até 200 caracteres)",
      "source_url": "https://...",
      "source_date": "2026-10-14"
    }
  ],
  "content_formats": [
    {
      "format": "Formato de conteúdo em alta",
      "platforms": "YouTube Shorts",
      "example": "Criador, canal ou exemplo concreto e por que funciona",
      "source_url": "https://..."
    }
  ],
  "opportunities": [
    {
      "opportunity": "Oportunidade de negócio emergente",
      "type": "SaaS",
      "niche": 11,
      "audience": "Público-alvo",
      "problem": "Problema resolvido",
      "monetization": "Modelo de monetização",
      "competition": "Média",
      "brazil_potential": "Alto",
      "source_url": "https://..."
    }
  ]
}
```

- `niche` is the number of the niche in the brief (1 to 25). `trends` covers **all 25 niches**:
  at least 1 and at most 3 rows per niche, the most promising subniches first.
- `stage`: one of `Consolidada`, `Em crescimento`, `Emergente`, `Viral`, `Mercado carente`,
  `Em declínio`. `longevity`: `Curta`, `Média` or `Longa`.
- `type`: `SaaS`, `App`, `Ferramenta de IA`, `Produto digital`, `Curso`, `Assinatura`,
  `Marketplace`, `Agência`, `B2B`, `Produto físico`, `Consultoria` or `Comunidade`.
- `competition`: `Baixa`, `Média` or `Alta`. `brazil_potential`: `Baixo`, `Médio` or `Alto`.
- If a niche had no relevant finding, write one row for it with `"trend": "Sem sinal relevante"`,
  `"stage": null` and `source_url` `null`.
- Validate with `jq -e -f /app/country-check.jq output/countries/country-{{PART2}}.json`: it must
  print `true`.
