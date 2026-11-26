Edition B (Monday to Wednesday), the only edition. Hard limits, enforced by the system and never
exceeded:

- Usage: the research stops at **65% of the 5-hour usage window**. From then on every new search,
  page and subagent is denied (`LIMIT REACHED`), the countries not started yet are skipped, and
  the rest of the window is only for writing the tables with what was already researched and for
  the conclusions. Each country also has its own share of the window: once the window reaches it,
  the research of that country stops the same way and you write its tables with what you have.
- Country sessions: at most **5 subagents** in the session, **50 searches** (WebSearch) and **50
  pages** (WebFetch) in the country, and at most **10 searches and 10 pages in each subagent**. The
  6th subagent, the 51st search or page of the country and the 11th search or page of a subagent
  are denied.
  - Plan for it: 5 research subagents in parallel, each with 5 of the 25 niches, also noting the
    local platforms, viral content and creators they find in those niches. Tell each one its
    budget (10 searches and 10 pages), to choose its searches well so they cover all its niches,
    and to keep its notes short (facts, numbers and URLs, no prose). Then **you** write the JSON
    yourself from `research_notes/`.
  - Do not search or open pages yourself: the budget is for the subagents. No additional round
    of research: the 5 subagents are spent by then.
  - Size: the country file has at most **30,000 characters** (check with
    `wc -m output/countries/country-NN.json` and shorten cells above it).
- Conclusions session: no subagents, no WebSearch and no WebFetch (they are disabled). Write the
  tables yourself, only from the country files and the notes in `research_notes/`.
  - Size: `output/highlights.json` has at most **60,000 characters**. Keep all its rows, with
    short cells; check with `wc -m output/highlights.json` before writing `output/DONE`.
