# market_trends

Pesquisa diária de tendências de mercado em 6 países (EUA, China, Rússia, Reino Unido, Japão e
Canadá) e 25 nichos, com foco em oportunidades para o Brasil. Roda todo dia às **5h** num container
deste computador, salva o resultado no MongoDB Atlas e é publicada num blog na Vercel.

```
container market-trends (05:00) ──Claude + deep-research──▶ /data/work/<data>/output
        │ store.py (root)
        ▼
MongoDB Atlas  market_trends.researches ──▶ frontend (Vercel): edição do dia + histórico
        │
        └──▶ youtube_dark (espera a pesquisa do dia terminar e gera os Shorts)
```

## Como funciona

- `routine/scheduler.sh` olha o relógio a cada 30s e, a partir das 05:00, roda
  `routine/run_daily.sh` uma vez por dia (lock em `data/state/<data>.lock`). Se o computador
  estava desligado às 5h, a pesquisa do dia começa assim que o container voltar (até 22h59).
- `run_daily.sh` marca a pesquisa como `running` no MongoDB, roda `run.sh` e salva o resultado
  (`completed` ou `failed`) com `store.py`.
- `run.sh` roda o Claude (`claude -p`) com `routine/instructions.md` + `routine/prompt.md` (o
  briefing da pesquisa, igual ao pedido original). O Claude coordena a skill `deep-research`
  país por país, pesquisa em inglês (e nos idiomas locais) e escreve o resultado em pt-BR:
  `output/parts/part-01.md` a `part-11.md` e `output/highlights.json` (as 7 listas da Parte 11 e o
  Top 50). Se a primeira passada terminar sem `output/DONE`, uma segunda passada retoma das
  partes que faltam.
- `store.py` grava um documento por data em `market_trends.researches`: `date`, `status`,
  `title`, `summary`, `parts[]`, `recommendations[]` (Parte 11), `top_opportunities[]`
  (Parte 8), `started_at`, `finished_at`, `error`.

## Segurança

O Claude lê páginas que podem ter prompt injection, então nunca vê a `MONGO_URI`: o container
começa como root, e `run-as-claude-user.sh` roda o Claude como o usuário `node` com ambiente
limpo (só o token do Claude). Quem fala com o MongoDB é o `store.py`, como root, depois que o
Claude termina.

## Configuração

```bash
cp .env.example .env    # token do Claude e MONGO_URI do Atlas
# A skill deep-research vem da sua conta do Claude (não vai para o git):
cp -r ~/.claude/skills/synced/*/deep-research routine/skills/
docker compose up -d --build
```

No MongoDB Atlas, **Network Access** precisa liberar o IP deste computador e o da Vercel (a
Vercel não tem IP fixo, então na prática `0.0.0.0/0`).

## Comandos úteis

```bash
# Teste rápido da cadeia (Claude, skill, MongoDB) com uma pesquisa falsa "teste-<data>",
# que o blog não lista
docker exec market-trends /app/smoke-test.sh

# Rodar (ou retomar) a pesquisa de hoje agora
docker exec -e MANUAL_RUN=1 market-trends /app/run_daily.sh

# Acompanhar
tail -f data/logs/$(date +%F).log
ls data/work/$(date +%F)/output/parts
```

## Frontend

`frontend/` é um Next.js (App Router) publicado na Vercel (projeto `market-trends-front`, root
directory `frontend`, deploy automático a cada push na `main`). Variáveis: `MONGODB_URI` e
`MONGODB_DATABASE=market_trends`.

- `/`: a edição mais recente concluída (aviso se a de hoje ainda está rodando).
- `/historico`: todas as edições, agrupadas por mês.
- `/pesquisa/<data>`: uma edição específica.

```bash
cd frontend && cp .env.example .env.local && npm install && npm run dev
```
