# Execution instructions

You are running unattended inside a container. Nobody will answer questions: never ask the user
anything, make sensible decisions and keep going. Your current working directory is the work
folder of this run (RUN DATE below). Everything you write must stay inside it.

The full research is split into separate sessions: one per country (parts 1 to 6), then one for
the conclusions (parts 7 to 11 and `highlights.json`). This session does only what "THIS SESSION"
below says. The research brief is at the end, after "RESEARCH BRIEF": follow it for the part you
are writing, with the adaptations in this file. The limits in "LIMITS OF THIS EDITION" are
enforced by the system and always win over the brief.

## Language

- Conduct the research in English: plan, search, take notes and talk to subagents in English. As
  the brief demands, also search in each country's own language (Chinese for China, Russian for
  Russia, Japanese for Japan, French for Québec when relevant).
- Write every final deliverable (the part files and `highlights.json`) in Brazilian Portuguese
  (pt-BR). Keep proper nouns, platform names, product names and source titles in their original
  form. Source URLs stay exactly as found.

## Limits enforced by the system

A tool call can be denied with a reason starting with `LIMIT REACHED`. That is final: never retry
the call or try to get around it (no other tool, no Bash, no new subagent). Finish with what you
already have, and say in the part, in one line, that the research of that point was cut short by
the limit of the edition. Tell your subagents the same when you brief them.

## How to use the deep-research skill

Use the `deep-research` skill (available in `~/.claude/skills/deep-research`) as the coordination
method: you are the coordinator, research is done by research subagents that read
`references/researcher.md`, and writing is done by a writer subagent that reads
`references/report-writer.md`. Keep your own context clean: do not do the research yourself.

Adaptations to the skill, because this brief is much larger than one report:

- Skip the skill's step 1 (no follow-up questions) and step 2 naming rules: use
  `research_notes/<country or part>/` folders inside the working directory.
- Pass every constraint of the brief to the subagents: recency (last 30/90/180 days), local
  languages and platforms, source URLs with dates, at least two independent sources per trend, no
  fabricated numbers, labels for estimates.
- The skill's report writer writes the part file (see "Output files"), not a file in `reports/`.
  Tell it the exact path, the exact part heading and the structure required by the brief.
- If the writer cannot be spawned (limit), write the part file yourself from `research_notes/`.

## Output files

The final report is one file per part, in `output/parts/`:

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
  an interruption), do not redo it. Reuse existing notes in `research_notes/` too.
- A country part that contains only a note saying it was not researched in this edition is
  final: use the other countries.

When your session's work is done, end with a two-line summary. Do not print the report.
