The six country parts (`output/parts/part-01.md` to `part-06.md`) are done. Write the
conclusions: parts 7 to 11, then `output/highlights.json`, then `output/DONE`. Base them on the
six country parts and on the notes in `research_notes/`.

## Parts 7 to 11

Write them as "LIMITS OF THIS EDITION" says for the conclusions session.

## highlights.json

After the 11 parts are complete, write `output/highlights.json` (valid JSON, UTF-8, pt-BR text).
It feeds the blog home page and the YouTube Shorts routine, so it must mirror part 11 faithfully:

```json
{
  "title": "Manchete curta da edição (até 90 caracteres)",
  "summary": "Resumo de 3 a 5 frases com os achados mais importantes da edição.",
  "recommendations": [
    {
      "key": "most_promising",
      "title": "As 10 oportunidades mais promissoras",
      "items": [
        {
          "name": "Nome curto da oportunidade",
          "description": "1 a 3 frases explicando a oportunidade e por que ela importa",
          "country": "País de origem ou tração",
          "niche": "Nicho / subnicho",
          "evidence_url": "https://... (a melhor fonte, ou null)"
        }
      ]
    }
  ],
  "top_opportunities": [
    {
      "rank": 1,
      "opportunity": "...",
      "country": "...",
      "niche": "...",
      "subniche": "...",
      "growth_stage": "Consolidada | Em crescimento | Emergente | Viral",
      "competition": "Baixa | Média | Alta",
      "monetization": "...",
      "brazil_potential": "Baixo | Médio | Alto",
      "score": 87
    }
  ]
}
```

- `recommendations` is a JSON array with exactly 7 entries, in this order and with these keys:
  `most_promising`, `overlooked_micro_niches`, `growth_6_12_months`, `best_balance`,
  `faceless_content`, `saas_ai`, `adapt_to_brazil` (the 7 lists of part 11), each with 10 items.
- `top_opportunities` is the Top 50 of part 8 (all 50 rows).

## Finishing

When all 11 part files end with `<!-- PARTE COMPLETA -->` and `output/highlights.json` is valid
(check it with `jq`), write the empty file `output/DONE`. Write it only then: the run is
considered failed without it.
