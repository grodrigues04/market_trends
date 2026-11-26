#!/usr/bin/env bash
# Stop hook of the sessions that write a JSON file (runs as `node`, called by Claude Code when
# Claude tries to finish). While <file> exists with a structure the blog and youtube_dark cannot
# read, Claude is sent back to fix it, so a wrong file never depends on Claude remembering to
# validate it. Gives up after a few blocks: run.sh still rejects the file afterwards.
#
#   json-check-hook.sh <file> <check.jq> <counter_file> [<done_file>]
#       <done_file> (the DONE of the conclusions) is removed while <file> is invalid.
set -uo pipefail

file="$1"
check="$2"
counter_file="$3"
done_file="${4:-}"
MAX_BLOCKS=3

cat > /dev/null  # the hook input is not needed
[ -e "$file" ] || exit 0
jq -e -f "$check" "$file" > /dev/null 2>&1 && exit 0

count=$(cat "$counter_file" 2>/dev/null || echo 0)
[ "$count" -ge "$MAX_BLOCKS" ] && exit 0
echo $((count + 1)) > "$counter_file"
# Without a valid file the run is not finished: DONE only comes back after the fix
[ -n "$done_file" ] && rm -f "$done_file"

jq -n --arg reason "$file has the wrong structure: \`jq -e -f $check $file\` does not print true. Rewrite it exactly in the structure of \"THIS SESSION\" (field names in English, each list item an object, the required number of rows), and validate it with that command until it prints true before finishing." \
  '{decision: "block", reason: $reason}'
