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
  /opt/store/bin/python /app/store.py finish "$TEST_DATE" B && echo "OK: $TEST_DATE saved in MongoDB"
  exit $?
fi

TEST_DATE="$1"
cd "/data/work/$TEST_DATE" || exit 1
mkdir -p output/parts
claude -p --max-turns 30 --model "${CLAUDE_MODEL:-claude-opus-5-5}" \
  --allowedTools "Write" "Read" "Bash(mkdir:*)" "Bash(ls:*)" <<'PROMPT'
This is a pipeline test. Do exactly this and nothing else:
1. Check that the file ~/.claude/skills/deep-research/SKILL.md exists (Read it) and say in one line whether the skill is available.
2. For N from 1 to 11, write output/parts/part-NN.md (NN with two digits) containing a heading "# Parte N — Teste", one short paragraph in Brazilian Portuguese and, as the last line, <!-- PARTE COMPLETA -->.
3. Write output/highlights.json with: title "Edição de teste", summary "Teste do pipeline.", recommendations as a JSON array of 7 objects, each with "key", "title" and "items", using the keys most_promising, overlooked_micro_niches, growth_6_12_months, best_balance, faceless_content, saas_ai, adapt_to_brazil (titles in pt-BR, 2 items each with name, description, country, niche, evidence_url null) and top_opportunities with 3 rows (rank, opportunity, country, niche, subniche, growth_stage, competition, monetization, brazil_potential, score).
4. Write the empty file output/DONE.
PROMPT
[ -e output/DONE ] || { echo "FAILED: output/DONE was not created"; exit 1; }
