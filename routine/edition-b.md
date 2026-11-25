Edition B (Monday to Wednesday), the only edition. Hard limits, enforced by the system and never
exceeded:

- Usage budget: the whole research (6 countries and the conclusions) must fit in **70% of the
  5-hour usage window**; at 70% the system kills the session and the research is cancelled. Each
  country has its share: once the window reaches it, every new search, page and subagent is
  denied (`LIMIT REACHED`), and you write the part with what you already have. Spend little.
- Country sessions: at most **2 subagents** in the session and at most **40 pages** opened with
  WebFetch, counting the pages of every subagent and your own. The 3rd subagent and the 41st page
  are denied.
  - Plan for it: 2 research subagents in parallel, each with half of the 25 niches (and one of
    them also with local platforms, viral content and creators) and an explicit budget of at most
    20 pages. Tell each one its budget, to rely on search results and snippets and open a page
    only when a key number needs it, and to keep its notes short (facts, numbers and URLs, no
    prose). Then **you** write the part yourself from `research_notes/`: no writer subagent.
  - No additional round of research: the 2 subagents are spent by then.
  - Size of the country part: every `##` section has at most **2,000 characters**, except
    "Tendências relevantes nos 25 nichos", with at most **15,000 characters**, and "Fontes e
    evidências", with at most **6,000 characters**. Keep all 25 niches, one or two short rows
    each; in "Fontes e evidências", keep a line on the quality of the evidence and the most
    important sources, without repeating every link of the tables.
  - Check the size before finishing: find the line numbers of the `## ` headings with Grep, then
    `head -n <last line> <file> | tail -n +<first line> | wc -m` for each section, and cut any
    section above its limit.
- Conclusions session: no subagents, no WebSearch and no WebFetch (they are disabled). Write parts
  7 to 11 yourself, only from the six country parts and the notes in `research_notes/`.
  - Size: parts 7 to 11 together have at most **50,000 characters**: part 7 up to 7,000, part 8
    (the Top 50 table, with short cells) up to 14,000, part 9 up to 7,000, part 10 up to 7,000 and
    part 11 (the 7 lists of 10 items, one short line each) up to 15,000.
  - `output/highlights.json` has at most **50,000 characters**, on its own. Keep all its required
    content (the 7 lists with 10 items each and the 50 rows of the Top 50), with short
    descriptions.
  - Check with `wc -m output/parts/part-07.md ... part-11.md output/highlights.json` before
    writing `output/DONE`, and cut anything above its limit.
