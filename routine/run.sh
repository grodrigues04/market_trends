#!/usr/bin/env bash
# Runs the research as `node`, in separate Claude sessions: one per country (the tables of the
# country, output/countries/country-NN.json), then one for the conclusions (output/highlights.json
# and DONE). store.py (root) saves the result afterwards. The limits (edition-b.md) are enforced by
# limit-hook.sh and here:
#   - per country, at most 5 subagents, 50 searches and 50 pages (each subagent at most 10 searches
#     and 10 pages), and no new search, page or subagent once the 5-hour usage window reaches the
#     share of the country (country N: N x 9%);
#   - the research stops at 65% of the 5-hour window: no new search, page or subagent, and the
#     countries not started yet are skipped. The rest of the window is for writing the tables with
#     what was researched and for the conclusions (which open no pages). A country session still
#     going at 75% is stopped, so the conclusions always have room (watch_usage).
# A session that ends without its file runs once more while the research has not stopped; finished
# files are never redone. A session cannot finish with an invalid JSON file (json-check-hook.sh).
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
STOPPED_FILE="$LIMITS_DIR/research-stopped"
# Share of the 5-hour window: the research stops at RESEARCH_MAX_UTILIZATION, country N stops
# searching at N x COUNTRY_UTILIZATION, and a country session is killed at
# COUNTRY_SESSION_MAX_UTILIZATION, leaving the rest of the window for the conclusions
RESEARCH_MAX_UTILIZATION=0.65
COUNTRY_UTILIZATION=0.09
COUNTRY_SESSION_MAX_UTILIZATION=0.75
MAX_SUBAGENTS_PER_COUNTRY=5
MAX_SEARCHES_PER_COUNTRY=50
MAX_PAGES_PER_COUNTRY=50
MAX_SEARCHES_PER_SUBAGENT=10
MAX_PAGES_PER_SUBAGENT=10
BASE_TOOLS=("Skill" "TodoWrite" "Read" "Write" "Edit" "Glob" "Grep" "Bash(mkdir:*)" "Bash(ls:*)"
            "Bash(wc:*)" "Bash(jq:*)" "Bash(tail:*)" "Bash(head:*)")
WEB_TOOLS=("Agent" "Task" "WebSearch" "WebFetch")
# The stream of the last session of this run, where the usage of the window is read between sessions
LAST_STREAM=""

# number | name in the blog | name for the research | notes folder
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

country_file() {
  printf '%s/output/countries/country-%02d.json' "$WORK_DIR" "$1"
}

country_complete() {
  jq -e -f /app/country-check.jq "$1" >/dev/null 2>&1
}

# Written by run.sh, not by Claude: a country that was not researched in this edition
write_skipped_country() {
  local number="$1" heading="$2" reason="$3"
  jq -n --arg country "$heading" --arg skipped "$reason" '{country: $country, skipped: $skipped}' \
    > "$(country_file "$number")"
  echo "$heading $reason" >> "$WORK_DIR/output/NOTICE"
  log "Country $number skipped: $reason"
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

percent() {
  awk -v share="$1" 'BEGIN { print share * 100 }'
}

# Kills the session <pid> when the window reaches <max> (a country session that keeps writing)
watch_usage() {
  local pid="$1" stream="$2" max="$3" used
  while kill -0 "$pid" 2>/dev/null; do
    used=$(utilization "$stream")
    if at_least "$used" "$max"; then
      log "The 5-hour window reached $used, killing the session"
      kill -TERM "$pid" 2>/dev/null
      return
    fi
    sleep 5
  done
}

# research_stopped <when>: marks the research as stopped once the window reaches
# RESEARCH_MAX_UTILIZATION. Returns 0 when it is stopped.
research_stopped() {
  local when="$1" used
  [ -e "$STOPPED_FILE" ] && return 0
  [ -n "$LAST_STREAM" ] || return 1
  used=$(utilization "$LAST_STREAM")
  at_least "$used" "$RESEARCH_MAX_UTILIZATION" || return 1
  echo "$(date '+%F %T') five_hour utilization $used" > "$STOPPED_FILE"
  echo "A pesquisa parou $when, ao chegar em $(percent "$RESEARCH_MAX_UTILIZATION")% da janela de 5 horas de uso; o restante ficou para as tabelas e as conclusões." >> "$WORK_DIR/output/NOTICE"
  log "The research stopped: the 5-hour window is at $used"
  return 0
}

# run_session <label> <session prompt file> <PreToolUse hook or ""> <web tools: yes|no>
#             <Stop hook or ""> <utilization that kills the session, or ""> [sed args]
run_session() {
  local label="$1" session_file="$2" hook="$3" web="$4" stop_hook="$5" max_utilization="$6"
  shift 6
  local stream="$WORK_DIR/claude-$label-$(date +%H%M%S).jsonl"
  local settings="$LIMITS_DIR/settings-$label.json"
  local tools=("${BASE_TOOLS[@]}")
  local disallowed=()
  LAST_STREAM="$stream"
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
  if [ -n "$stop_hook" ]; then
    # Claude cannot finish while the JSON file of the session has the wrong structure
    jq --arg command "$stop_hook" \
      '.hooks.Stop = [{hooks: [{type: "command", command: $command}]}]' "$settings" > "$settings.tmp" \
      && mv "$settings.tmp" "$settings"
  fi

  local prompt="$LIMITS_DIR/prompt-$label.md"
  {
    printf 'RUN DATE: %s. Use this date as "today" everywhere.\n\n' "$RUN_DATE"
    cat /app/instructions.md
    printf '\n\n---\n\nTHIS SESSION\n\n'
    # Without sed args (the conclusions), sed would read the file name as its script
    if [ $# -gt 0 ]; then sed "$@" "$session_file"; else cat "$session_file"; fi
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
  local watcher=""
  if [ -n "$max_utilization" ]; then
    watch_usage "$pid" "$stream" "$max_utilization" &
    watcher=$!
  fi
  wait "$pid"
  local code=$?
  if [ -n "$watcher" ]; then
    kill "$watcher" 2>/dev/null
    wait "$watcher" 2>/dev/null
  fi
  log "Claude $label finished with exit code $code (5-hour window at $(utilization "$stream"))"
}

[ -n "${CLAUDE_CODE_OAUTH_TOKEN:-}" ] || fail "CLAUDE_CODE_OAUTH_TOKEN não está definido no .env."
[ -s "$HOME/.claude/skills/deep-research/SKILL.md" ] || log "WARNING: deep-research skill not found in ~/.claude/skills"
mkdir -p "$WORK_DIR/output/countries" "$LIMITS_DIR" || fail "não foi possível criar $WORK_DIR."
# A manual run (MANUAL_RUN=1) of a failed day starts again, with the same page and subagent budgets
rm -f "$WORK_DIR/output/FAILED" "$STOPPED_FILE"
cd "$WORK_DIR" || fail "não foi possível entrar em $WORK_DIR."

# 1. One session per country
for country in "${COUNTRIES[@]}"; do
  IFS='|' read -r number heading name slug <<<"$country"
  file=$(country_file "$number")
  for attempt in 1 2; do
    country_complete "$file" && break
    # Past the limit nothing is researched anymore: the rest of the window is for the conclusions
    research_stopped "antes de $heading" && break
    # The counters stay in limits/ across retries: a second attempt never gets a new budget
    budget=$(awk -v number="$number" -v share="$COUNTRY_UTILIZATION" -v max="$RESEARCH_MAX_UTILIZATION" \
      'BEGIN { budget = number * share; printf "%.2f", (budget < max ? budget : max) }')
    hook="/app/limit-hook.sh budget $LIMITS_DIR/country-$number STREAM_FILE $budget $MAX_SUBAGENTS_PER_COUNTRY $MAX_SEARCHES_PER_COUNTRY $MAX_PAGES_PER_COUNTRY $MAX_SEARCHES_PER_SUBAGENT $MAX_PAGES_PER_SUBAGENT"
    stop_hook="/app/json-check-hook.sh $file /app/country-check.jq $LIMITS_DIR/country-$number-check-blocks"
    run_session "country-$number" /app/session-country.md "$hook" yes "$stop_hook" "$COUNTRY_SESSION_MAX_UTILIZATION" \
      -e "s/{{PART2}}/$(printf '%02d' "$number")/g" \
      -e "s/{{HEADING}}/$heading/g" -e "s/{{COUNTRY}}/$name/g" -e "s/{{SLUG}}/$slug/g"
    research_stopped "durante $heading" || true
  done
  if ! country_complete "$file"; then
    if [ -e "$STOPPED_FILE" ]; then
      write_skipped_country "$number" "$heading" "não foi pesquisado nesta edição: a pesquisa parou no limite de uso."
    else
      write_skipped_country "$number" "$heading" "não foi concluído nesta edição por uma falha na pesquisa."
    fi
  fi
  used=()
  for counter in subagents searches pages; do
    used+=("$(cat "$LIMITS_DIR/country-$number/$counter" 2>/dev/null || echo 0) $counter")
  done
  log "Country $number used ${used[0]}, ${used[1]} and ${used[2]}"
done

researched=0
for number in 1 2 3 4 5 6; do
  jq -e 'has("skipped") | not' "$(country_file "$number")" >/dev/null 2>&1 && researched=$((researched + 1))
done
[ "$researched" -gt 0 ] || fail "nenhum país foi pesquisado. Veja data/logs/$RUN_DATE.log e data/work/$RUN_DATE/claude-*.jsonl."

highlights_valid() {
  jq -e -f /app/highlights-check.jq "$WORK_DIR/output/highlights.json" >/dev/null 2>&1
}

# 2. Conclusions: highlights.json and DONE, with the rest of the window
for attempt in 1 2; do
  # DONE only counts with a highlights.json the blog and youtube_dark can read
  if [ -e "$WORK_DIR/output/DONE" ] && ! highlights_valid; then
    log "highlights.json has the wrong structure, the conclusions session runs again"
    rm -f "$WORK_DIR/output/DONE"
    # Set aside, so the next session writes it again (session-synthesis.md explains the file)
    mv "$WORK_DIR/output/highlights.json" "$WORK_DIR/output/highlights.invalid.json"
  fi
  [ -e "$WORK_DIR/output/DONE" ] && break
  stop_hook="/app/json-check-hook.sh $WORK_DIR/output/highlights.json /app/highlights-check.jq $LIMITS_DIR/highlights-blocks $WORK_DIR/output/DONE"
  run_session conclusions /app/session-synthesis.md "" no "$stop_hook" ""
done

if [ -e "$WORK_DIR/output/DONE" ] && ! highlights_valid; then
  rm -f "$WORK_DIR/output/DONE"
  fail "output/highlights.json ficou com a estrutura errada depois de duas tentativas."
fi
[ -e "$WORK_DIR/output/DONE" ] || fail "o Claude terminou sem gerar output/DONE. Veja data/logs/$RUN_DATE.log e data/work/$RUN_DATE/claude-*.jsonl."
log "Research finished"
