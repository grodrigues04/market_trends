Edition B (daily edition, Monday to Wednesday). Hard limits, enforced by the system and never
exceeded:

- Country sessions: at most **5 subagents** in the session, counting everyone (researchers and the
  writer), and at most **110 pages** opened with WebFetch, counting the pages of every subagent and
  your own. The 6th subagent and the 111th page are denied.
  - Plan for it: 4 research subagents in parallel, each with a share of the 25 niches and an
    explicit budget of at most 25 pages (tell each one its budget and to prefer search results
    and snippets before opening pages), and then 1 writer subagent that opens no pages. The
    remaining pages are a reserve, not a target.
  - No additional round of research: the 5 subagents are spent by then.
  - Size of the country part: every `##` section has at most **3,000 characters**, except
    "Tendências relevantes nos 25 nichos" and "Fontes e evidências", with at most **30,000
    characters** each. Give these limits to the writer subagent in its brief. Keep all 25 niches,
    with fewer and shorter rows each; in "Fontes e evidências", keep the notes on the quality of
    the evidence and the most important sources, without repeating every link of the tables.
  - The writer checks the size before finishing: find the line numbers of the `## ` headings with
    Grep, then `head -n <last line> <file> | tail -n +<first line> | wc -m` for each section, and
    cuts any section above its limit.
- Conclusions session: no subagents, no WebSearch and no WebFetch (they are disabled). Write parts
  7 to 11 yourself, only from the six country parts and the notes in `research_notes/`.
  - Size: parts 7 to 11 together have at most **50,000 characters**: part 7 up to 7,000, part 8
    (the Top 50 table, with short cells) up to 14,000, part 9 up to 7,000, part 10 up to 7,000 and
    part 11 (the 7 lists of 10 items, one short line each) up to 15,000. `highlights.json` does not
    count, but keep its descriptions short.
  - Check with `wc -m output/parts/part-07.md ... part-11.md` before writing `output/DONE`, and
    cut any part above its limit.
