# Execution instructions

You are running unattended inside a container. Nobody will answer questions: never ask the user
anything, make sensible decisions and keep going. Your current working directory is the work
folder of this run (RUN DATE below). Everything you write must stay inside it.

The full research is split into separate sessions: one per country, then one for the conclusions.
This session does only what "THIS SESSION" below says. The research brief is at the end, after
"RESEARCH BRIEF": follow it for what to research, with the adaptations in this file. The limits in
"LIMITS OF THIS EDITION" are enforced by the system and always win over the brief.

## Tables only, no prose

The result is published as **tables only**: there is no report text. Where the brief asks for an
overview, explanations, a methodology or a narrative, put that knowledge into the cells of the
tables instead (short, factual cells). Every deliverable is a JSON file described in "THIS
SESSION"; never write Markdown reports.

## Language

- Conduct the research in English: plan, search, take notes and talk to subagents in English. As
  the brief demands, also search in each country's own language (Chinese for China, Russian for
  Russia, Japanese for Japan, French for Québec when relevant).
- Write the text of every JSON deliverable in Brazilian Portuguese (pt-BR). Keep proper nouns,
  platform names, product names and source titles in their original form. Source URLs stay
  exactly as found. JSON field names stay in English, exactly as specified.

## Limits enforced by the system

A tool call can be denied with a reason starting with `LIMIT REACHED`. That is final: never retry
the call or try to get around it (no other tool, no Bash, no new subagent). Finish with what you
already have. Tell your subagents the same when you brief them.

## How to use the deep-research skill

Use the `deep-research` skill (available in `~/.claude/skills/deep-research`) as the coordination
method: you are the coordinator, research is done by research subagents that read
`references/researcher.md`. Keep your own context clean: do not do the research yourself. There is
no report writer: you turn the notes into the JSON tables yourself.

Adaptations to the skill, because this brief is much larger than one report:

- Skip the skill's step 1 (no follow-up questions) and step 2 naming rules: use
  `research_notes/<country>/` folders inside the working directory.
- Pass every constraint of the brief to the subagents: recency (last 30/90/180 days), local
  languages and platforms, source URLs with dates, at least two independent sources per trend, no
  fabricated numbers, labels for estimates.
- Skip the skill's report-writing step: the deliverable is the JSON file of "THIS SESSION".

## Common rules of the JSON files

- Valid JSON, UTF-8. Validate it with the `jq` command given in "THIS SESSION" until it prints
  `true`; a check also runs when you stop and sends you back while the file is invalid.
- Cells are short: one fact, number or name per cell, no paragraphs.
- `source_url` / `evidence_url`: the best source for the row, exactly as found, or `null`.
  `source_date`: `YYYY-MM-DD` (or `YYYY-MM`) of the publication or observation, or `null`.
- Never fabricate numbers, sources or dates; write "estimativa" in the cell for estimates.
- If the file of this session already exists and is valid when you start (the run was resumed),
  do not redo it. Reuse existing notes in `research_notes/` too.

When your session's work is done, end with a two-line summary. Do not print the tables.
