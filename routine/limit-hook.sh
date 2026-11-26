#!/usr/bin/env bash
# PreToolUse hook of the country sessions (runs as `node`, called by Claude Code before every tool
# call, including the calls of the subagents). It enforces the limits of the research for real, so
# they never depend on Claude counting right. A denied call reaches Claude with the reason below,
# and the tool does not run.
#
#   limit-hook.sh budget <counter_dir> <stream_file> <max_utilization> <max_subagents>
#                 <max_searches> <max_pages> <max_searches_per_subagent> <max_pages_per_subagent>
#       One country per session: at most <max_subagents> Agent calls, <max_searches> WebSearch
#       calls and <max_pages> WebFetch calls in the country, and at most
#       <max_searches_per_subagent> and <max_pages_per_subagent> in each subagent (Claude Code
#       sends `agent_id` only from inside a subagent). Counted in <counter_dir>, kept across
#       retries. No WebSearch, WebFetch or Agent once the 5-hour usage window reaches
#       <max_utilization> (read from <stream_file>): the share of the country, never above the 65%
#       where the whole research stops.
set -uo pipefail

input=$(cat)
tool=$(jq -r '.tool_name // empty' <<<"$input")
agent_id=$(jq -r '.agent_id // empty' <<<"$input" | tr -cd 'A-Za-z0-9_-')

deny() {
  jq -n --arg reason "$1" \
    '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $reason}}'
  exit 0
}

[ "${1:-}" = "budget" ] || exit 0
counter_dir="$2"
stream_file="$3"
max_utilization="$4"
max_subagents="$5"
max_searches="$6"
max_pages="$7"
max_searches_per_subagent="$8"
max_pages_per_subagent="$9"

case "$tool" in
  WebFetch) counter=pages; max="$max_pages"; max_per_subagent="$max_pages_per_subagent"; what="pages" ;;
  WebSearch) counter=searches; max="$max_searches"; max_per_subagent="$max_searches_per_subagent"; what="searches" ;;
  Agent|Task) counter=subagents; max="$max_subagents"; max_per_subagent="" ;;
  *) exit 0 ;;
esac

# Claude Code writes a rate_limit_event to the stream every 1% of the 5-hour window
utilization=$(tail -c 5000000 "$stream_file" 2>/dev/null | grep '"rate_limit_event"' | tail -n 1 \
  | jq -r '.rate_limit_info.unifiedWindows.five_hour.utilization // 0' 2>/dev/null)
if awk -v used="${utilization:-0}" -v max="$max_utilization" 'BEGIN { exit !(used >= max) }'; then
  deny "LIMIT REACHED: the research of this country is over (the 5-hour usage window is at ${utilization}, the limit for this country is ${max_utilization}). No new searches, pages or subagents. Finish only what is in progress with what you already have: save your notes and return, or write the JSON of the country from research_notes/."
fi

mkdir -p "$counter_dir/subagents.d"
# Subagents run in parallel: the counters are read and written under a lock
exec 9>"$counter_dir/counters.lock"
flock 9

count=$(cat "$counter_dir/$counter" 2>/dev/null || echo 0)
if [ "$count" -ge "$max" ]; then
  if [ "$counter" = "subagents" ]; then
    deny "LIMIT REACHED: this country already used its $max subagents, the hard limit of this edition. Do not call Agent again. Write the JSON of the country yourself from research_notes/."
  fi
  deny "LIMIT REACHED: this country already used its $max $what, the hard limit of this edition. Do not call $tool again. Finish with the notes you already have: save them and return (or write the JSON of the country)."
fi

if [ -n "$max_per_subagent" ] && [ -n "$agent_id" ]; then
  agent_counter="$counter_dir/subagents.d/$agent_id.$counter"
  agent_count=$(cat "$agent_counter" 2>/dev/null || echo 0)
  if [ "$agent_count" -ge "$max_per_subagent" ]; then
    deny "LIMIT REACHED: this subagent already used its $max_per_subagent $what, the hard limit of each subagent. Do not call $tool again. Save your notes with what you already have and return."
  fi
  echo $((agent_count + 1)) > "$agent_counter"
fi
echo $((count + 1)) > "$counter_dir/$counter"
exit 0
