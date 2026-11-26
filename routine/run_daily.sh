#!/usr/bin/env bash
# One research: lock, mark as running in MongoDB, run Claude (as `node`), save the result.
#   run_daily.sh <date>
# Root only (it holds MONGO_URI). MANUAL_RUN=1 runs again a day that already has a lock, reusing
# the countries already finished in /data/work/<date>.
set -uo pipefail

RUN_DATE="${1:-$(date +%F)}"
LOCK_FILE="/data/state/$RUN_DATE.lock"
LOG_FILE="/data/logs/$RUN_DATE.log"
STORE="/opt/store/bin/python /app/store.py"

mkdir -p /data/state /data/logs /data/work
chown node:node /data/work /data/logs
# The log of the day is shared with run.sh, which runs as node
touch "$LOG_FILE" && chown node:node "$LOG_FILE"

log() {
  echo "[run_daily $(date '+%F %T')] $*" | tee -a "$LOG_FILE"
}

if [ -e "$LOCK_FILE" ] && [ "${MANUAL_RUN:-0}" != "1" ]; then
  log "Research of $RUN_DATE already attempted, skipping"
  exit 0
fi
date '+%F %T' > "$LOCK_FILE" || { echo "cannot create $LOCK_FILE"; exit 1; }

log "Starting research of $RUN_DATE"
$STORE start "$RUN_DATE" >> "$LOG_FILE" 2>&1 || log "WARNING: could not mark the research as running"

/app/run.sh "$RUN_DATE"
log "run.sh finished with exit code $?"

# store.py decides between completed and failed from the files in /data/work/<date>/output.
# Retries a few times: the research took hours, a network blip must not lose it.
for attempt in 1 2 3 4 5; do
  if $STORE finish "$RUN_DATE" >> "$LOG_FILE" 2>&1; then
    log "Result saved in MongoDB"
    exit 0
  fi
  log "Saving the result failed (attempt $attempt), retrying in 60s"
  sleep 60
done
log "ERROR: the result of $RUN_DATE was not saved. Run: docker exec market-trends /opt/store/bin/python /app/store.py finish $RUN_DATE"
exit 1
