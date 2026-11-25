#!/usr/bin/env bash
# Runs the research as `node`, in separate Claude sessions: one per country (parts 1 to 6), then
# one for the conclusions (parts 7 to 11, highlights.json and DONE). store.py (root) saves the
# result afterwards. The limits (edition-b.md) are enforced by limit-hook.sh:
#   - per country, at most 2 subagents and 40 pages, and no new search, page or subagent once the
#     5-hour usage window reaches the budget of the country (country N: N x 9%);
#   - the conclusions open no pages;
#   - the whole research never goes past 70% of the 5-hour window: at 70% the running session is
#     killed and the research is cancelled (watch_usage).
# A session that ends without its part runs once more; finished parts are never redone. The
# conclusions session cannot finish with an invalid highlights.json (highlights-hook.sh).
set -uo pipefail

# Never run Claude as root: see run-as-claude-user.sh
source /app/run-as-claude-user.sh

RUN_DATE="${1:?usage: run.sh <date>}"
WORK_DIR="/data/work/$RUN_DATE"
LOG_FILE="/data/logs/$RUN_DATE.log"
CLAUDE_TIMEOUT="${CLAUDE_TIMEOUT:-3h}"
CLAUDE_MAX_TURNS="${CLAUDE_MAX_TURNS:-300}"
CLAUDE_MODEL="${CLAUDE_MODEL:-claude-opus-5-5}"
LIMITS_DIR="$WORK_DIR/limits"
CANCEL_FILE="$LIMITS_DIR/usage-cancelled"
# Share of the 5-hour window: the research is cancelled at MAX_UTILIZATION, and country N stops
# searching at N x COUNTRY_UTILIZATION, leaving room to write the parts and the conclusions
MAX_UTILIZATION=0.70
COUNTRY_UTILIZATION=0.09
MAX_PAGES_PER_COUNTRY=40
MAX_SUBAGENTS_PER_COUNTRY=2
PART_COMPLETE_MARKER="<!-- PARTE COMPLETA -->"
BASE_TOOLS=("Skill" "TodoWrite" "Read" "Write" "Edit" "Glob" "Grep" "Bash(mkdir:*)" "Bash(ls:*)"
            "Bash(wc:*)" "Bash(jq:*)" "Bash(tail:*)" "Bash(head:*)")
WEB_TOOLS=("Agent" "Task" "WebSearch" "WebFetch")

# part | heading in the report | name for the research | notes folder
COUNTRIES=(
  "1|Estados Unidos|the United States|united-states"
  "2|China|China|china"
  "3|Rússia|Russia|russia"
  "4|Reino Unido|the United Kingdom|united-kingdom"
  "5|Japão|Japan|japan"
  "6|Canadá|Canada|canada"
)

log() {
  echo "[run $(date '+%F %T')] $*" | tee -a "$LOG_FILE"
}

fail() {
  mkdir -p "$WORK_DIR/output"
  printf '%s\n' "$1" > "$WORK_DIR/output/FAILED"
  log "FAILED: $1"
  exit 1
}

part_file() {
  printf '%s/output/parts/part-%02d.md' "$WORK_DIR" "$1"
}

part_complete() {
  [ -f "$1" ] && awk 'NF { last = $0 } END { exit !(last ~ /^<!-- PARTE COMPLETA -->[[:space:]]*$/) }' "$1"
}

# Written by run.sh, not by Claude: a country that was not researched in this edition
write_skipped_part() {
  local number="$1" heading="$2" reason="$3"
  printf '# Parte %s — %s\n\n> %s\n\n%s\n' "$number" "$heading" "$reason" "$PART_COMPLETE_MARKER" > "$(part_file "$number")"
  echo "Parte $number ($heading): $reason" >> "$WORK_DIR/output/NOTICE"
  log "Part $number skipped: $reason"
}

# The usage of the 5-hour window (0 to 1), from the last rate_limit_event Claude Code wrote to a
# stream. It comes every 1% of the window and counts the subagents too.
utilization() {
  tail -c 5000000 "$1" 2>/dev/null | grep '"rate_limit_event"' | tail -n 1 \
    | jq -r '.rate_limit_info.unifiedWindows.five_hour.utilization // 0' 2>/dev/null
}

at_least() {
  awk -v used="${1:-0}" -v max="$2" 'BEGIN { exit !(used >= max) }'
}

# Kills the session <pid> when the window reaches MAX_UTILIZATION (the research is cancelled)
watch_usage() {
  local pid="$1" stream="$2" used
  while kill -0 "$pid" 2>/dev/null; do
    used=$(utilization "$stream")
    if at_least "$used" "$MAX_UTILIZATION"; then
      echo "$(date '+%F %T') five_hour utilization $used" > "$CANCEL_FILE"
      log "The 5-hour window reached $used, killing the session"
      kill -TERM "$pid" 2>/dev/null
      return
    fi
    sleep 5
  done
}

cancel_if_over() {
  [ -e "$CANCEL_FILE" ] || return 0
  fail "pesquisa cancelada: chegou a $(awk '{print $NF * 100}' "$CANCEL_FILE")% da janela de 5 horas de uso (o máximo é $(awk -v max="$MAX_UTILIZATION" 'BEGIN {print max * 100}')%)."
}

# run_session <label> <session prompt file> <hook command or ""> <web tools: yes|no> [sed args]
run_session() {
  local label="$1" session_file="$2" hook="$3" web="$4"
  shift 4
  local stream="$WORK_DIR/claude-$label-$(date +%H%M%S).jsonl"
  local settings="$LIMITS_DIR/settings-$label.json"
  local tools=("${BASE_TOOLS[@]}")
  local disallowed=()
  if [ "$web" = "yes" ]; then
    tools+=("${WEB_TOOLS[@]}")
  else
    disallowed=(--disallowedTools "${WEB_TOOLS[@]}")
  fi
  hook="${hook//STREAM_FILE/$stream}"
  if [ -n "$hook" ]; then
    jq -n --arg command "$hook" \
      '{hooks: {PreToolUse: [{matcher: "WebFetch|WebSearch|Agent|Task", hooks: [{type: "command", command: $command}]}]}}' \
      > "$settings"
  else
    echo '{}' > "$settings"
  fi
  if [ "$label" = "conclusions" ]; then
    # Claude cannot finish while highlights.json has the wrong structure
    jq --arg command "/app/highlights-hook.sh $WORK_DIR $LIMITS_DIR/highlights-blocks" \
      '.hooks.Stop = [{hooks: [{type: "command", command: $command}]}]' "$settings" > "$settings.tmp" \
      && mv "$settings.tmp" "$settings"
  fi

  local prompt="$LIMITS_DIR/prompt-$label.md"
  {
    printf 'RUN DATE: %s. Use this date as "today" everywhere.\n\n' "$RUN_DATE"
    cat /app/instructions.md
    printf '\n\n---\n\nTHIS SESSION\n\n'
    sed "$@" "$session_file"
    printf '\n\n---\n\nLIMITS OF THIS EDITION\n\n'
    cat /app/edition-b.md
    printf '\n\n---\n\nRESEARCH BRIEF\n\n'
    cat /app/prompt.md
  } > "$prompt"

  log "Claude $label (model $CLAUDE_MODEL, timeout $CLAUDE_TIMEOUT)"
  timeout "$CLAUDE_TIMEOUT" claude -p \
        --model "$CLAUDE_MODEL" \
        --max-turns "$CLAUDE_MAX_TURNS" \
        --settings "$settings" \
        --output-format stream-json --verbose \
        --allowedTools "${tools[@]}" \
        "${disallowed[@]}" \
        < "$prompt" >> "$stream" 2>> "$LOG_FILE" &
  local pid=$!
  watch_usage "$pid" "$stream" &
  local watcher=$!
  wait "$pid"
  local code=$?
  kill "$watcher" 2>/dev/null
  wait "$watcher" 2>/dev/null
  log "Claude $label finished with exit code $code (5-hour window at $(utilization "$stream"))"
  cancel_if_over
}

[ -n "${CLAUDE_CODE_OAUTH_TOKEN:-}" ] || fail "CLAUDE_CODE_OAUTH_TOKEN não está definido no .env."
[ -s "$HOME/.claude/skills/deep-research/SKILL.md" ] || log "WARNING: deep-research skill not found in ~/.claude/skills"
mkdir -p "$WORK_DIR/output/parts" "$LIMITS_DIR" || fail "não foi possível criar $WORK_DIR."
# A manual run (MANUAL_RUN=1) of a cancelled day starts again, with the same budgets
rm -f "$WORK_DIR/output/FAILED" "$CANCEL_FILE"
cd "$WORK_DIR" || fail "não foi possível entrar em $WORK_DIR."

# 1. One session per country
for country in "${COUNTRIES[@]}"; do
  IFS='|' read -r number heading name slug <<<"$country"
  file=$(part_file "$number")
  for attempt in 1 2; do
    part_complete "$file" && break
    # The counters stay in limits/ across retries: a second attempt never gets a new budget
    budget=$(awk -v number="$number" -v share="$COUNTRY_UTILIZATION" 'BEGIN { printf "%.2f", number * share }')
    hook="/app/limit-hook.sh budget $LIMITS_DIR/country-$number $MAX_PAGES_PER_COUNTRY $MAX_SUBAGENTS_PER_COUNTRY STREAM_FILE $budget"
    run_session "part-$number" /app/session-country.md "$hook" yes \
      -e "s/{{PART}}/$number/g" -e "s/{{PART2}}/$(printf '%02d' "$number")/g" \
      -e "s/{{HEADING}}/$heading/g" -e "s/{{COUNTRY}}/$name/g" -e "s/{{SLUG}}/$slug/g"
  done
  if ! part_complete "$file"; then
    write_skipped_part "$number" "$heading" "Este país não foi concluído nesta edição por uma falha na pesquisa."
  fi
  log "Part $number used $(cat "$LIMITS_DIR/country-$number/pages" 2>/dev/null || echo 0) pages and $(cat "$LIMITS_DIR/country-$number/subagents" 2>/dev/null || echo 0) subagents"
done

if [ "$(grep -l 'não foi concluído nesta edição' "$WORK_DIR"/output/parts/part-0[1-6].md 2>/dev/null | wc -l)" = "6" ]; then
  fail "nenhum país foi pesquisado. Veja data/logs/$RUN_DATE.log e data/work/$RUN_DATE/claude-*.jsonl."
fi

highlights_valid() {
  jq -e -f /app/highlights-check.jq "$WORK_DIR/output/highlights.json" >/dev/null 2>&1
}

# 2. Conclusions: parts 7 to 11, highlights.json and DONE
for attempt in 1 2; do
  # DONE only counts with a highlights.json the blog and youtube_dark can read
  if [ -e "$WORK_DIR/output/DONE" ] && ! highlights_valid; then
    log "highlights.json has the wrong structure, the conclusions session runs again"
    rm -f "$WORK_DIR/output/DONE"
    # Set aside, so the next session writes it again (session-synthesis.md explains the file)
    mv "$WORK_DIR/output/highlights.json" "$WORK_DIR/output/highlights.invalid.json"
  fi
  [ -e "$WORK_DIR/output/DONE" ] && break
  run_session conclusions /app/session-synthesis.md "" no
done

if [ -e "$WORK_DIR/output/DONE" ] && ! highlights_valid; then
  rm -f "$WORK_DIR/output/DONE"
  fail "output/highlights.json ficou com a estrutura errada depois de duas tentativas."
fi
[ -e "$WORK_DIR/output/DONE" ] || fail "o Claude terminou sem gerar output/DONE. Veja data/logs/$RUN_DATE.log e data/work/$RUN_DATE/claude-*.jsonl."
log "Research finished"
