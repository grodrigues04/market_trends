FROM node:22-bookworm-slim

ENV TZ=America/Sao_Paulo \
    DISABLE_AUTOUPDATER=1 \
    DISABLE_TELEMETRY=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      jq ca-certificates tzdata coreutils util-linux python3 python3-venv \
 && rm -rf /var/lib/apt/lists/*

RUN npm install -g @anthropic-ai/claude-code@2.1.328 && npm cache clean --force

# pymongo only for the root scripts (store.py): Claude never sees MONGO_URI
RUN python3 -m venv /opt/store \
 && /opt/store/bin/pip install --no-cache-dir "pymongo[srv]==4.20.1"

# ~/.claude must belong to node (the skills folder is mounted inside it)
RUN mkdir -p /home/node/.claude/skills && chown -R node:node /home/node/.claude

COPY --chmod=755 scheduler.sh run_daily.sh run.sh run-as-claude-user.sh limit-hook.sh \
     json-check-hook.sh smoke-test.sh /app/
COPY --chmod=644 store.py prompt.md instructions.md session-country.md session-synthesis.md \
     edition-b.md country-check.jq highlights-check.jq /app/

# Starts as root on purpose: see run-as-claude-user.sh
WORKDIR /data

CMD ["/app/scheduler.sh"]
