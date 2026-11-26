#!/usr/bin/env bash
# PreToolUse hook of the country sessions (runs as `node`, called by Claude Code before every tool
# call, including the calls of the subagents). It enforces the limits of the research for real, so
# they never depend on Claude counting right. A denied call reaches Claude with the reason below,
# and the tool does not run.
#
#   limit-hook.sh budget <counter_dir> <max_pages> <max_subagents> <stream_file> <max_utilization>
#       One country per session: at most <max_pages> WebFetch calls and <max_subagents> Agent
#       calls, counted in <counter_dir> (kept across retries), and no WebSearch, WebFetch or Agent
#       once the 5-hour usage window reaches <max_utilization> (read from <stream_file>): the
#       share of the country, never above the 65% where the whole research stops.
set -uo pipefail

input=$(cat)
tool=$(jq -r '.tool_name // empty' <<<"$input")

deny() {
  jq -n --arg reason "$1" \
    '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $reason}}'
  exit 0
}

[ "${1:-}" = "budget" ] || exit 0
counter_dir="$2"
stream_file="$5"
max_utilization="$6"

case "$tool" in
  WebFetch) counter=pages; max="$3"
    message="LIMIT REACHED: this country already opened its $3 pages, the hard limit of this edition. Do not call WebFetch again. Finish with the notes you already have: save them and return (or write the JSON of the country)." ;;
  Agent|Task) counter=subagents; max="$4"
    message="LIMIT REACHED: this country already used its $4 subagents, the hard limit of this edition. Do not call Agent again. Write the JSON of the country yourself from research_notes/." ;;
  WebSearch) counter="" ;;
  *) exit 0 ;;
esac

# Claude Code writes a rate_limit_event to the stream every 1% of the 5-hour window
utilization=$(tail -c 5000000 "$stream_file" 2>/dev/null | grep '"rate_limit_event"' | tail -n 1 \
  | jq -r '.rate_limit_info.unifiedWindows.five_hour.utilization // 0' 2>/dev/null)
if awk -v used="${utilization:-0}" -v max="$max_utilization" 'BEGIN { exit !(used >= max) }'; then
  deny "LIMIT REACHED: the research of this country is over (the 5-hour usage window is at ${utilization}, the limit for this country is ${max_utilization}). No new searches, pages or subagents. Finish only what is in progress with what you already have: save your notes and return, or write the JSON of the country from research_notes/."
fi

[ -n "$counter" ] || exit 0
mkdir -p "$counter_dir"
# Subagents run in parallel: the counter is read and written under a lock
exec 9>"$counter_dir/$counter.lock"
flock 9
count=$(cat "$counter_dir/$counter" 2>/dev/null || echo 0)
if [ "$count" -ge "$max" ]; then
  deny "$message"
fi
echo $((count + 1)) > "$counter_dir/$counter"
exit 0
