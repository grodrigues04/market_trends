#!/usr/bin/env bash
# PreToolUse hook of the research sessions (runs as `node`, called by Claude Code before every
# tool call, including the calls of the subagents). It enforces the limits of the edition for
# real, so they never depend on Claude counting right. A denied call reaches Claude with the
# reason below, and the tool does not run.
#
#   limit-hook.sh budget <counter_dir> <max_pages> <max_subagents>
#       Edition B, one country per session: at most <max_pages> WebFetch calls and
#       <max_subagents> Agent calls in the session, counted in <counter_dir> (kept across retries).
#   limit-hook.sh usage <stream_file> <latch_file> <max_utilization>
#       Edition A: once the 5-hour usage window reaches <max_utilization> (0.87), writes
#       <latch_file> and from then on denies every new WebSearch, WebFetch and subagent.
set -uo pipefail

input=$(cat)
tool=$(jq -r '.tool_name // empty' <<<"$input")

deny() {
  jq -n --arg reason "$1" \
    '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $reason}}'
  exit 0
}

case "${1:-}" in
  budget)
    counter_dir="$2"
    case "$tool" in
      WebFetch) counter=pages; max="$3"
        message="LIMIT REACHED: this country already opened its $3 pages, the hard limit of this edition. Do not call WebFetch again. Finish with the notes you already have: save them and return (or write the part)." ;;
      Agent|Task) counter=subagents; max="$4"
        message="LIMIT REACHED: this country already used its $4 subagents, the hard limit of this edition. Do not call Agent again. Write the part yourself from research_notes/." ;;
      *) exit 0 ;;
    esac
    mkdir -p "$counter_dir"
    # Subagents run in parallel: the counter is read and written under a lock
    exec 9>"$counter_dir/$counter.lock"
    flock 9
    count=$(cat "$counter_dir/$counter" 2>/dev/null || echo 0)
    if [ "$count" -ge "$max" ]; then
      deny "$message"
    fi
    echo $((count + 1)) > "$counter_dir/$counter"
    ;;
  usage)
    stream_file="$2"
    latch_file="$3"
    max_utilization="$4"
    case "$tool" in
      WebFetch|WebSearch|Agent|Task) ;;
      *) exit 0 ;;
    esac
    if [ ! -e "$latch_file" ]; then
      # Claude Code writes a rate_limit_event to the stream with the usage of the 5-hour window
      utilization=$(tail -c 5000000 "$stream_file" 2>/dev/null | grep '"rate_limit_event"' | tail -n 1 \
        | jq -r '.rate_limit_info.unifiedWindows.five_hour.utilization // 0' 2>/dev/null)
      if awk -v used="${utilization:-0}" -v max="$max_utilization" 'BEGIN { exit !(used >= max) }'; then
        echo "$(date '+%F %T') five_hour utilization $utilization" > "$latch_file"
      fi
    fi
    if [ -e "$latch_file" ]; then
      deny "LIMIT REACHED: the session usage reached ${max_utilization} of the 5-hour window. No new searches, pages or subagents. Finish only what is in progress with what you already have: save your notes and return, or write the part from research_notes/."
    fi
    ;;
esac
exit 0
