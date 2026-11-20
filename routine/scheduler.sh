#!/usr/bin/env bash
# Checks the wall clock every 30 seconds and starts the research once a day, from 05:00 on.
# If the computer was off or suspended at 05:00, the research of the day starts as soon as the
# container is running again (until 23:00); a day is never run twice (lock in /data/state/).
#
# Runs as root: run.sh drops to the `node` user before Claude starts, and store.py (root, never
# Claude) saves the result in MongoDB.
set -uo pipefail

FIRST_HOUR="${FIRST_HOUR:-5}"
LAST_HOUR="${LAST_HOUR:-22}"

echo "[scheduler] started at $(date '+%F %T %Z'), research runs every day from $(printf '%02d' "$FIRST_HOUR"):00"

while true; do
  today=$(date +%F)
  hour=$((10#$(date +%H)))

  if [ "$hour" -ge "$FIRST_HOUR" ] && [ "$hour" -le "$LAST_HOUR" ] \
     && [ ! -e "/data/state/$today.lock" ]; then
    /app/run_daily.sh "$today"
  fi

  sleep 30
done
