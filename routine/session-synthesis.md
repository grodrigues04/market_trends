The research of the countries is over: their tables are in `output/countries/country-01.json` to
`country-06.json`. A country with a `skipped` field was not researched in this edition (the usage
limit stopped the research, or it failed): use only the other countries, and do not mention the
missing ones in the tables. Write the conclusions in `output/highlights.json`, then `output/DONE`.
Base them only on the country files and on the notes in `research_notes/`.

## highlights.json

The conclusions of the brief (parts 7 to 11) as tables, in pt-BR. Exactly this structure:

```json
{
  "title": "Manchete curta da edição (até 90 caracteres)",
  "comparison": [
    {
      "trend": "Tendência vista em mais de um país, ou concentrada em um",
      "countries": ["Estados Unidos", "Japão"],
      "pattern": "Simultânea",
      "leader": "Estados Unidos",
      "note": "O que a comparação mostra (até 140 caracteres)"
    }
  ],
  "top_opportunities": [
    {
      "rank": 1,
      "opportunity": "...",
      "country": "...",
      "niche": "...",
      "subniche": "...",
      "evidence": "O dado que comprova (até 140 caracteres)",
      "evidence_url": "https://... ou null",
      "growth_stage": "Consolidada | Em crescimento | Emergente | Viral",
      "competition": "Baixa | Média | Alta",
      "monetization": "...",
      "brazil_potential": "Baixo | Médio | Alto",
      "score": 87
    }
  ],
  "content_opportunities": [
    {
      "rank": 1,
      "theme": "Tema",
      "audience": "Público-alvo",
      "positioning": "Posicionamento",
      "platforms": "Plataformas",
      "ideas": ["5 ideias de conteúdo", "...", "...", "...", "..."],
      "hooks": ["3 ganchos virais", "...", "..."],
      "monetization": "Monetização",
      "example": "Exemplo internacional de sucesso"
    }
  ],
  "business_opportunities": [
    {
      "rank": 1,
      "concept": "Conceito do negócio",
      "problem": "Problema resolvido",
      "audience": "Público-alvo",
      "mvp": "MVP",
      "monetization": "Monetização",
      "competitors": "Concorrentes",
      "complexity": "Baixa | Média | Alta",
      "brazil_potential": "Baixo | Médio | Alto"
    }
  ],
  "recommendations": [
    {
      "key": "most_promising",
      "title": "As 10 oportunidades mais promissoras",
      "items": [
        {
          "name": "Nome curto da oportunidade",
          "description": "Uma frase: por que ela importa (até 160 caracteres)",
          "country": "País de origem ou tração",
          "niche": "Nicho / subnicho",
          "evidence_url": "https://... ou null"
        }
      ]
    }
  ]
}
```

- `comparison` (part 7): 8 to 15 rows. `pattern`: `Simultânea` (in several countries),
  `Concentrada` (one country), `Em expansão` (spreading from one country to others) or
  `Ainda não mainstream`.
- `top_opportunities` (part 8): the Top 50, ranked by `score` (0 to 100, the weighted score of the
  brief).
- `content_opportunities` (part 9): the Top 20, each with exactly 5 `ideas` and 3 `hooks`.
- `business_opportunities` (part 10): the Top 20, realistic for individuals or small teams.
- `recommendations` (part 11): a JSON array with exactly 7 entries, in this order and with these
  keys: `most_promising`, `overlooked_micro_niches`, `growth_6_12_months`, `best_balance`,
  `faceless_content`, `saas_ai`, `adapt_to_brazil` (the 7 lists of part 11), each with 10 items.
- With few countries researched, the lists may be shorter (at least 10 rows in the Top 50, 5 in
  the Top 20s and 5 items per recommendation), but never invent rows to fill them.
- Use exactly these field names, in English: no other keys, no other structure. Each list item is
  an object, except `countries`, `ideas` and `hooks`, which are lists of strings.
- Validate it with `jq -e -f /app/highlights-check.jq output/highlights.json`: it must print
  `true`. If it prints `false`, fix the file and run it again.
- If `output/highlights.invalid.json` exists, a previous session wrote `highlights.json` with the
  wrong structure and it was rejected: write a new `output/highlights.json` in the structure above
  (you may reuse its content), validate it, and only then write `output/DONE`.

## Finishing

When the validation above prints `true`, write the empty file `output/DONE`. Write it only then:
the run is considered failed without it.
