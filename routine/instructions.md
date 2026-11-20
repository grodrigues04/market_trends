# Execution instructions for the daily run

You are running unattended inside a container, every day at 05:00 (America/Sao_Paulo). Nobody
will answer questions: never ask the user anything, make sensible decisions and keep going.
Your current working directory is the work folder of this run (RUN DATE below). Everything you
write must stay inside it.

The research brief is below, after "RESEARCH BRIEF". Follow it completely, with the adaptations
in this file.

## Language

- Conduct the research in English: plan, search, take notes and talk to subagents in English. As
  the brief demands, also search in each country's own language (Chinese for China, Russian for
  Russia, Japanese for Japan, French for Québec when relevant).
- Write every final deliverable (the part files and `highlights.json`) in Brazilian Portuguese
  (pt-BR). Keep proper nouns, platform names, product names and source titles in their original
  form. Source URLs stay exactly as found.

## How to use the deep-research skill

Use the `deep-research` skill (available in `~/.claude/skills/deep-research`) as the coordination
method: you are the coordinator, research is done by research subagents that read
`references/researcher.md`, and writing is done by writer subagents that read
`references/report-writer.md`. Keep your own context clean: do not do the research yourself.

Adaptations to the skill, because this brief is much larger than one report:

- Skip the skill's step 1 (no follow-up questions) and step 2 naming rules: use
  `research_notes/<country or part>/` folders inside the working directory.
- Run the skill once per country, in the order of the brief (United States, China, Russia,
  United Kingdom, Japan, Canada). For each country, spawn the research subagents in parallel,
  splitting the 25 niches between them so that every niche and subniche is covered (for example
  5 researchers with 5 niches each, plus 1 researcher for local platforms, viral content and
  creators of that country). Pass every constraint of the brief to them: recency (last 30/90/180
  days), local languages and platforms, source URLs with dates, at least two independent sources
  per trend, no fabricated numbers, labels for estimates.
- The skill's report writer writes the country's part file (see "Output files"), not a file in
  `reports/`. Tell it the exact path, the exact part heading and the structure required by the
  brief (country overview, trends across the 25 niches, most promising subniches, trending
  content formats, emerging business opportunities, sources and evidence).
- After the six countries, write parts 7 to 11 with writer subagents that read all the notes and
  the six country parts. Parts 8, 9, 10 and 11 can be written by separate writers in parallel
  after part 7 exists. Spawn extra research subagents only for real gaps (the Brazilian market
  check of the international transfer analysis usually needs one).
- The skill says "one additional round of research at most": apply that per country.

## Output files

Write the final report as one file per part, in `output/parts/`:

| File | Heading (first line) |
|---|---|
| `output/parts/part-01.md` | `# Parte 1 — Estados Unidos` |
| `output/parts/part-02.md` | `# Parte 2 — China` |
| `output/parts/part-03.md` | `# Parte 3 — Rússia` |
| `output/parts/part-04.md` | `# Parte 4 — Reino Unido` |
| `output/parts/part-05.md` | `# Parte 5 — Japão` |
| `output/parts/part-06.md` | `# Parte 6 — Canadá` |
| `output/parts/part-07.md` | `# Parte 7 — Comparação entre países` |
| `output/parts/part-08.md` | `# Parte 8 — Top 50 oportunidades globais` |
| `output/parts/part-09.md` | `# Parte 9 — Top 20 oportunidades de conteúdo` |
| `output/parts/part-10.md` | `# Parte 10 — Top 20 oportunidades de negócio` |
| `output/parts/part-11.md` | `# Parte 11 — Recomendações estratégicas finais` |

Rules for the part files:

- GitHub-flavored Markdown. Use `##` and `###` for sections inside a part (never another `#`).
  Tables are welcome (the Top 50 must be a table with the fields of the brief).
- Sources as Markdown links with the date, e.g. `[Título da fonte](https://...) (2026-10-14)`.
- The last line of every finished part file is exactly `<!-- PARTE COMPLETA -->`. A part file
  without that line is considered unfinished.
- If a part file already has `<!-- PARTE COMPLETA -->` when you start (the run was resumed after
  an interruption), do not redo it: reuse it and continue from the first unfinished part. Reuse
  existing notes in `research_notes/` too.

## highlights.json

After the 11 parts are complete, write `output/highlights.json` (valid JSON, UTF-8, pt-BR text).
It feeds the blog home page and the daily YouTube Shorts routine, so it must mirror part 11
faithfully:

```json
{
  "title": "Manchete curta da edição do dia (até 90 caracteres)",
  "summary": "Resumo de 3 a 5 frases com os achados mais importantes do dia.",
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

- `recommendations` has exactly 7 entries, in this order and with these keys: `most_promising`,
  `overlooked_micro_niches`, `growth_6_12_months`, `best_balance`, `faceless_content`, `saas_ai`,
  `adapt_to_brazil` (the 7 lists of part 11), each with 10 items.
- `top_opportunities` is the Top 50 of part 8 (all 50 rows).

## Finishing

When all 11 part files end with `<!-- PARTE COMPLETA -->` and `output/highlights.json` is valid,
write the empty file `output/DONE`. Write it only then: the run is considered failed without it.
Do not print the report in your final message; a two-line summary is enough.
