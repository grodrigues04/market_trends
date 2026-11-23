#!/usr/bin/env bash
# Checks the wall clock every 30 seconds and starts the research of the day:
#   edition B (daily, with limits): Monday, Tuesday and Wednesday at 01:00
#   edition A (complete):           Thursday at 21:00
# Friday, Saturday and Sunday have no research (Friday 01:00 would share the 5-hour usage window
# of Thursday's edition A). If the computer was off or suspended at the start time, the research
# starts as soon as the container is running again, until the last hour of its slot (B until
# 05:59, A until 23:59); a day is never run twice (lock in /data/state/).
#
# Runs as root: run.sh drops to the `node` user before Claude starts, and store.py (root, never
# Claude) saves the result in MongoDB.
set -uo pipefail

echo "[scheduler] started at $(date '+%F %T %Z'): edition B Mon-Wed 01:00, edition A Thu 21:00"

while true; do
  today=$(date +%F)
  hour=$((10#$(date +%H)))
  weekday=$(date +%u)  # 1 = Monday ... 7 = Sunday

  edition=""
  case "$weekday" in
    1|2|3) [ "$hour" -ge 1 ] && [ "$hour" -le 5 ] && edition=B ;;
    4) [ "$hour" -ge 21 ] && edition=A ;;
  esac

  if [ -n "$edition" ] && [ ! -e "/data/state/$today.lock" ]; then
    /app/run_daily.sh "$today" "$edition"
  fi

  sleep 30
done
