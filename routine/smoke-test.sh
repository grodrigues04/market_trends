#!/usr/bin/env bash
# Manual test of the chain (Claude auth, skill, MongoDB, frontend) with a tiny fake research.
# Saves it under the date "teste-<timestamp>" (the frontend only lists real dates), so it never
# replaces a real research. Run as root: docker exec market-trends /app/smoke-test.sh
set -uo pipefail

if [ "$(id -u)" = "0" ]; then
  TEST_DATE="teste-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "/data/work/$TEST_DATE" && chown node:node "/data/work/$TEST_DATE"
  setpriv --reuid=node --regid=node --init-groups env -i HOME=/home/node PATH="$PATH" \
    CLAUDE_CODE_OAUTH_TOKEN="${CLAUDE_CODE_OAUTH_TOKEN:-}" "$0" "$TEST_DATE" || exit 1
  /opt/store/bin/python /app/store.py finish "$TEST_DATE" && echo "OK: $TEST_DATE saved in MongoDB"
  exit $?
fi

TEST_DATE="$1"
cd "/data/work/$TEST_DATE" || exit 1
mkdir -p output/countries
claude -p --max-turns 30 --model "${CLAUDE_MODEL:-claude-opus-5-5}" \
  --allowedTools "Write" "Read" "Bash(mkdir:*)" "Bash(ls:*)" <<'PROMPT'
This is a pipeline test. Do exactly this and nothing else:
1. Check that the file ~/.claude/skills/deep-research/SKILL.md exists (Read it) and say in one line whether the skill is available.
2. Write output/countries/country-01.json with: country "Estados Unidos", trends (2 rows with niche 1 and 2, subniche, trend, stage "Emergente", longevity "Média", platforms, evidence, source_url null, source_date null), content_formats (1 row with format, platforms, example, source_url null) and opportunities (1 row with opportunity, type "SaaS", niche 1, audience, problem, monetization, competition "Baixa", brazil_potential "Alto", source_url null). All text in Brazilian Portuguese.
3. For N from 2 to 6, write output/countries/country-0N.json with {"country": "País N", "skipped": "Teste do pipeline."}.
4. Write output/highlights.json with: title "Edição de teste"; comparison with 1 row (trend, countries ["Estados Unidos"], pattern "Concentrada", leader "Estados Unidos", note); top_opportunities with 3 rows (rank, opportunity, country, niche, subniche, evidence, evidence_url null, growth_stage, competition, monetization, brazil_potential, score); content_opportunities with 1 row (rank, theme, audience, positioning, platforms, ideas with 5 strings, hooks with 3 strings, monetization, example); business_opportunities with 1 row (rank, concept, problem, audience, mvp, monetization, competitors, complexity, brazil_potential); recommendations as a JSON array of 7 objects, each with "key", "title" and "items", using the keys most_promising, overlooked_micro_niches, growth_6_12_months, best_balance, faceless_content, saas_ai, adapt_to_brazil (titles in pt-BR, 2 items each with name, description, country, niche, evidence_url null).
5. Write the empty file output/DONE.
PROMPT
[ -e output/DONE ] || { echo "FAILED: output/DONE was not created"; exit 1; }
