#!/usr/bin/env bash
# Checks the wall clock every 30 seconds and starts the research of the day: Monday, Tuesday and
# Wednesday at 01:00. If the computer was off or suspended at 01:00, the research starts as soon as
# the container is running again, until 05:59; a day is never run twice (lock in /data/state/).
#
# Runs as root: run.sh drops to the `node` user before Claude starts, and store.py (root, never
# Claude) saves the result in MongoDB.
set -uo pipefail

echo "[scheduler] started at $(date '+%F %T %Z'): research Mon-Wed 01:00"

while true; do
  today=$(date +%F)
  hour=$((10#$(date +%H)))
  weekday=$(date +%u)  # 1 = Monday ... 7 = Sunday

  if [ "$weekday" -le 3 ] && [ "$hour" -ge 1 ] && [ "$hour" -le 5 ] && [ ! -e "/data/state/$today.lock" ]; then
    /app/run_daily.sh "$today"
  fi

  sleep 30
done
