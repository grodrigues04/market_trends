#!/usr/bin/env bash
# Runs the research as `node`, in separate Claude sessions: one per country (parts 1 to 6), then
# one for the conclusions (parts 7 to 11, highlights.json and DONE). store.py (root) saves the
# result afterwards. Every session gets the limits of its edition, enforced by limit-hook.sh:
#   A (complete): no limit on subagents or pages. When the 5-hour window reaches 87%, no new
#      searches, pages or subagents; the countries not started yet are skipped and the
#      conclusions are written from the countries that are ready.
#   B (daily): per country, at most 5 subagents and 110 pages; the conclusions open no pages.
# A session that ends without its part runs once more; finished parts are never redone.
set -uo pipefail

# Never run Claude as root: see run-as-claude-user.sh
source /app/run-as-claude-user.sh

RUN_DATE="${1:?usage: run.sh <date> <A|B>}"
EDITION="${2:?usage: run.sh <date> <A|B>}"
WORK_DIR="/data/work/$RUN_DATE"
LOG_FILE="/data/logs/$RUN_DATE.log"
CLAUDE_TIMEOUT="${CLAUDE_TIMEOUT:-3h}"
CLAUDE_MAX_TURNS="${CLAUDE_MAX_TURNS:-300}"
CLAUDE_MODEL="${CLAUDE_MODEL:-claude-opus-5-5}"
LIMITS_DIR="$WORK_DIR/limits"
USAGE_LATCH="$LIMITS_DIR/usage-limit-reached"
MAX_UTILIZATION=0.87
MAX_PAGES_PER_COUNTRY=110
MAX_SUBAGENTS_PER_COUNTRY=5
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

# Edition A: the usage of the 5-hour window, read from the last rate_limit_event of a stream
check_usage() {
  [ "$EDITION" = "A" ] && [ ! -e "$USAGE_LATCH" ] || return 0
  local utilization
  utilization=$(grep '"rate_limit_event"' "$1" 2>/dev/null | tail -n 1 \
    | jq -r '.rate_limit_info.unifiedWindows.five_hour.utilization // 0' 2>/dev/null)
  if awk -v used="${utilization:-0}" -v max="$MAX_UTILIZATION" 'BEGIN { exit !(used >= max) }'; then
    echo "$(date '+%F %T') five_hour utilization $utilization" > "$USAGE_LATCH"
  fi
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

  log "Claude $label (edition $EDITION, model $CLAUDE_MODEL, timeout $CLAUDE_TIMEOUT)"
  {
    printf 'RUN DATE: %s. Use this date as "today" everywhere.\n\n' "$RUN_DATE"
    cat /app/instructions.md
    printf '\n\n---\n\nTHIS SESSION\n\n'
    sed "$@" "$session_file"
    printf '\n\n---\n\nLIMITS OF THIS EDITION\n\n'
    cat "/app/edition-$(tr '[:upper:]' '[:lower:]' <<<"$EDITION").md"
    printf '\n\n---\n\nRESEARCH BRIEF\n\n'
    cat /app/prompt.md
  } | timeout "$CLAUDE_TIMEOUT" claude -p \
        --model "$CLAUDE_MODEL" \
        --max-turns "$CLAUDE_MAX_TURNS" \
        --settings "$settings" \
        --output-format stream-json --verbose \
        --allowedTools "${tools[@]}" \
        "${disallowed[@]}" \
        >> "$stream" 2>> "$LOG_FILE"
  log "Claude $label finished with exit code $?"
  check_usage "$stream"
}

[ -n "${CLAUDE_CODE_OAUTH_TOKEN:-}" ] || fail "CLAUDE_CODE_OAUTH_TOKEN não está definido no .env."
[[ "$EDITION" =~ ^[AB]$ ]] || fail "edição desconhecida: $EDITION (use A ou B)."
[ -s "$HOME/.claude/skills/deep-research/SKILL.md" ] || log "WARNING: deep-research skill not found in ~/.claude/skills"
mkdir -p "$WORK_DIR/output/parts" "$LIMITS_DIR" || fail "não foi possível criar $WORK_DIR."
rm -f "$WORK_DIR/output/FAILED"
cd "$WORK_DIR" || fail "não foi possível entrar em $WORK_DIR."

# 1. One session per country
for country in "${COUNTRIES[@]}"; do
  IFS='|' read -r number heading name slug <<<"$country"
  file=$(part_file "$number")
  for attempt in 1 2; do
    part_complete "$file" && break
    if [ -e "$USAGE_LATCH" ]; then
      write_skipped_part "$number" "$heading" \
        "Este país não foi pesquisado nesta edição: a pesquisa parou ao atingir 87% do limite de uso da sessão."
      break
    fi
    if [ "$EDITION" = "A" ]; then
      hook="/app/limit-hook.sh usage STREAM_FILE $USAGE_LATCH $MAX_UTILIZATION"
    else
      # The counters stay in limits/ across retries: a second attempt never gets a new budget
      hook="/app/limit-hook.sh budget $LIMITS_DIR/country-$number $MAX_PAGES_PER_COUNTRY $MAX_SUBAGENTS_PER_COUNTRY"
    fi
    run_session "part-$number" /app/session-country.md "$hook" yes \
      -e "s/{{PART}}/$number/g" -e "s/{{PART2}}/$(printf '%02d' "$number")/g" \
      -e "s/{{HEADING}}/$heading/g" -e "s/{{COUNTRY}}/$name/g" -e "s/{{SLUG}}/$slug/g"
  done
  if ! part_complete "$file"; then
    write_skipped_part "$number" "$heading" "Este país não foi concluído nesta edição por uma falha na pesquisa."
  fi
  [ "$EDITION" = "B" ] && log "Part $number used $(cat "$LIMITS_DIR/country-$number/pages" 2>/dev/null || echo 0) pages and $(cat "$LIMITS_DIR/country-$number/subagents" 2>/dev/null || echo 0) subagents"
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
  fi
  [ -e "$WORK_DIR/output/DONE" ] && break
  if [ "$EDITION" = "B" ] || [ -e "$USAGE_LATCH" ]; then
    run_session conclusions /app/session-synthesis.md "" no
  else
    run_session conclusions /app/session-synthesis.md \
      "/app/limit-hook.sh usage STREAM_FILE $USAGE_LATCH $MAX_UTILIZATION" yes
  fi
done

if [ -e "$USAGE_LATCH" ]; then
  log "Usage limit of edition A reached: $(cat "$USAGE_LATCH")"
  grep -q 'limite de uso' "$WORK_DIR/output/NOTICE" 2>/dev/null \
    || echo "A pesquisa parou de buscar novas fontes ao atingir 87% do limite de uso da sessão; o restante foi escrito com o que já tinha sido pesquisado." >> "$WORK_DIR/output/NOTICE"
fi
if [ -e "$WORK_DIR/output/DONE" ] && ! highlights_valid; then
  rm -f "$WORK_DIR/output/DONE"
  fail "output/highlights.json ficou com a estrutura errada depois de duas tentativas."
fi
[ -e "$WORK_DIR/output/DONE" ] || fail "o Claude terminou sem gerar output/DONE. Veja data/logs/$RUN_DATE.log e data/work/$RUN_DATE/claude-*.jsonl."
log "Research finished"
