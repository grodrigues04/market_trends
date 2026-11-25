#!/usr/bin/env bash
# Stop hook of the conclusions session (runs as `node`, called by Claude Code when Claude tries to
# finish). While output/highlights.json exists with a structure the blog and youtube_dark cannot
# read, Claude is sent back to fix it, so a wrong file never depends on Claude remembering to
# validate it. Gives up after a few blocks: run.sh still rejects the file afterwards.
#
#   highlights-hook.sh <work_dir> <counter_file>
set -uo pipefail

work_dir="$1"
counter_file="$2"
highlights="$work_dir/output/highlights.json"
MAX_BLOCKS=3

cat > /dev/null  # the hook input is not needed
[ -e "$highlights" ] || exit 0
jq -e -f /app/highlights-check.jq "$highlights" > /dev/null 2>&1 && exit 0

count=$(cat "$counter_file" 2>/dev/null || echo 0)
[ "$count" -ge "$MAX_BLOCKS" ] && exit 0
echo $((count + 1)) > "$counter_file"
# Without a valid file the run is not finished: DONE only comes back after the fix
rm -f "$work_dir/output/DONE"

jq -n --arg reason "output/highlights.json has the wrong structure: \`jq -e -f /app/highlights-check.jq output/highlights.json\` does not print true. Rewrite it exactly in the structure of the \"highlights.json\" section (top-level keys title, summary, recommendations and top_opportunities; field names in English; each list item an object with name and description), validate it with that command until it prints true, and only then write output/DONE." \
  '{decision: "block", reason: $reason}'
