Write ONLY part {{PART}}: the research of **{{COUNTRY}}**, in `output/parts/part-{{PART2}}.md`,
with the heading `# Parte {{PART}} — {{HEADING}}`. Do not touch the other parts and do not write
`highlights.json` or `output/DONE`: other sessions do that.

Run the deep-research skill once for this country. Spawn the research subagents in parallel,
splitting the 25 niches of the brief between them so that every niche and subniche is covered,
plus local platforms, viral content and creators of {{COUNTRY}}. Then one writer subagent writes
the part with the structure required by the brief (country overview, trends across the 25 niches,
most promising subniches, trending content formats, emerging business opportunities, sources and
evidence). Keep the notes in `research_notes/{{SLUG}}/`.
