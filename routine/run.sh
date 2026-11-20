#!/usr/bin/env bash
# Runs Claude with the research brief, as `node`. Claude writes the 11 parts and highlights.json
# to /data/work/<date>/output; store.py (root) saves them afterwards. If the first pass ends
# without output/DONE (crash, usage limit, timeout), a second pass resumes from the unfinished
# parts.
set -uo pipefail

# Never run Claude as root: see run-as-claude-user.sh
source /app/run-as-claude-user.sh

RUN_DATE="${1:-$(date +%F)}"
WORK_DIR="/data/work/$RUN_DATE"
LOG_FILE="/data/logs/$RUN_DATE.log"
CLAUDE_TIMEOUT="${CLAUDE_TIMEOUT:-7h}"
CLAUDE_MAX_TURNS="${CLAUDE_MAX_TURNS:-500}"
CLAUDE_MODEL="${CLAUDE_MODEL:-claude-opus-5-5}"

log() {
  echo "[run $(date '+%F %T')] $*" | tee -a "$LOG_FILE"
}

fail() {
  mkdir -p "$WORK_DIR/output"
  printf '%s\n' "$1" > "$WORK_DIR/output/FAILED"
  log "FAILED: $1"
  exit 1
}

[ -n "${CLAUDE_CODE_OAUTH_TOKEN:-}" ] || fail "CLAUDE_CODE_OAUTH_TOKEN não está definido no .env."
[ -s "$HOME/.claude/skills/deep-research/SKILL.md" ] || log "WARNING: deep-research skill not found in ~/.claude/skills"
mkdir -p "$WORK_DIR/output/parts" || fail "não foi possível criar $WORK_DIR."
rm -f "$WORK_DIR/output/FAILED"
cd "$WORK_DIR" || fail "não foi possível entrar em $WORK_DIR."

run_claude() {
  {
    printf 'RUN DATE: %s. Use this date as "today" everywhere.\n\n' "$RUN_DATE"
    cat /app/instructions.md
    printf '\n\n---\n\nRESEARCH BRIEF\n\n'
    cat /app/prompt.md
  } | timeout "$CLAUDE_TIMEOUT" claude -p \
        --model "$CLAUDE_MODEL" \
        --max-turns "$CLAUDE_MAX_TURNS" \
        --output-format stream-json --verbose \
        --allowedTools "Agent" "Task" "Skill" "TodoWrite" "Read" "Write" "Edit" "Glob" "Grep" \
                       "WebSearch" "WebFetch" "Bash(mkdir:*)" "Bash(ls:*)" "Bash(wc:*)" \
                       "Bash(jq:*)" "Bash(tail:*)" "Bash(head:*)" \
        >> "$WORK_DIR/claude-$(date +%H%M%S).jsonl" 2>> "$LOG_FILE"
}

for pass in 1 2; do
  log "Claude pass $pass (model $CLAUDE_MODEL, timeout $CLAUDE_TIMEOUT, max turns $CLAUDE_MAX_TURNS)"
  run_claude
  exit_code=$?
  log "Claude pass $pass finished with exit code $exit_code"
  if [ -e "$WORK_DIR/output/DONE" ]; then
    log "Research finished"
    exit 0
  fi
done

fail "o Claude terminou (código $exit_code) sem gerar output/DONE. Veja data/logs/$RUN_DATE.log e data/work/$RUN_DATE/claude-*.jsonl."
