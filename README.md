# market_trends

Pesquisa de tendências de mercado em 6 países (EUA, China, Rússia, Reino Unido, Japão e Canadá) e
25 nichos, com foco em oportunidades para o Brasil. Roda num container deste computador
**segunda, terça e quarta à 1h** (edição B, a única), salva o resultado no MongoDB Atlas e é
publicada num blog na Vercel.

| Limite | Valor |
|---|---|
| Uso da janela de 5h | A pesquisa inteira cabe em **70%**: ao chegar em 70%, a sessão é morta e a pesquisa é **cancelada** (`failed`). |
| Orçamento por país | O país N para de buscar quando a janela chega em N × 9% (EUA 9%, China 18%, ... Canadá 54%) e escreve a parte com o que tem; o resto fica para escrever as partes e as conclusões. |
| Por país | No máximo **2 subagentes** de pesquisa e **40 páginas** abertas; a própria sessão escreve a parte. As conclusões não abrem páginas. |

A edição A (completa, de quinta à noite) foi desligada porque passava do limite de uso; as edições
A antigas continuam no histórico.

```
container market-trends ──Claude + deep-research──▶ /data/work/<data>/output
        │ store.py (root)
        ▼
MongoDB Atlas  market_trends.researches ──▶ frontend (Vercel): edição mais recente e histórico
        │
        └──▶ youtube_dark (às 6h, usa a pesquisa concluída mais recente)
```

## Como funciona

- `routine/scheduler.sh` olha o relógio a cada 30s e roda `routine/run_daily.sh <data>` de
  segunda a quarta à 1h (lock em `data/state/<data>.lock`). Se o computador estava desligado no
  horário, a pesquisa começa assim que o container voltar, até 05h59.
- `run_daily.sh` marca a pesquisa como `running` no MongoDB, roda `run.sh` e salva o resultado
  (`completed` ou `failed`) com `store.py`.
- `run.sh` roda o Claude (`claude -p`) em **sessões separadas**: uma por país (partes 1 a 6) e
  uma para as conclusões (partes 7 a 11, `output/highlights.json` com as 7 listas da Parte 11 e o
  Top 50, e `output/DONE`). Cada sessão recebe `routine/instructions.md`, a tarefa da sessão
  (`session-country.md` ou `session-synthesis.md`), os limites (`edition-b.md`) e `routine/prompt.md` (o briefing da pesquisa, igual ao pedido original). O
  Claude coordena a skill `deep-research`, pesquisa em inglês (e nos idiomas locais) e escreve
  em pt-BR. Uma sessão que termina sem a sua parte roda mais uma vez; partes prontas nunca são
  refeitas. A sessão das conclusões não consegue terminar enquanto o `highlights.json` estiver
  fora da estrutura que o blog e o youtube_dark leem (`highlights-hook.sh`, um hook `Stop`); se
  mesmo assim ele ficar errado, é guardado como `highlights.invalid.json` e a sessão roda de novo.
- `store.py` grava um documento por data em `market_trends.researches`: `date`, `edition`,
  `status`, `title`, `summary`, `parts[]`, `recommendations[]` (Parte 11), `top_opportunities[]`
  (Parte 8), `notices[]` (o que os limites cortaram, mostrado no blog), `started_at`,
  `finished_at`, `error`.

### Como os limites são garantidos

Os limites não dependem do Claude contar certo: `routine/limit-hook.sh` é um hook `PreToolUse`
do Claude Code, chamado antes de cada ferramenta, inclusive nos subagentes. Uma chamada negada
não roda, e o Claude recebe o motivo (`LIMIT REACHED`) para fechar a parte com o que tem.

- **Páginas e subagentes**: conta as chamadas de `WebFetch` e `Agent` da sessão do país em
  `data/work/<data>/limits/country-N/` e nega a 41ª página e o 3º subagente. Os contadores
  continuam numa segunda tentativa, que nunca ganha um limite novo. A sessão das conclusões roda
  sem `WebFetch`, `WebSearch` e `Agent`.
- **Orçamento de uso por país**: lê o uso da janela de 5h que o Claude Code grava no stream
  (`rate_limit_event`, a cada 1% da janela, contando os subagentes). Quando chega no orçamento do
  país (N × 9%), nega toda busca, página e subagente novos, e a sessão escreve a parte com o que
  já tem.
- **Teto de 70%**: `run.sh` lê o mesmo dado a cada 5s durante cada sessão. Ao chegar em 70%,
  mata a sessão, grava `limits/usage-cancelled` e encerra a pesquisa como `failed` ("pesquisa
  cancelada"); o blog continua mostrando a edição anterior. O teto é sobre o uso total da janela,
  então uso seu de madrugada também conta.

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
docker exec -e MANUAL_RUN=1 market-trends /app/run_daily.sh $(date +%F)

# Acompanhar
tail -f data/logs/$(date +%F).log
ls data/work/$(date +%F)/output/parts
```

## Frontend

`frontend/` é um Next.js (App Router) publicado na Vercel (projeto `market-trends-front`, root
directory `frontend`, deploy automático a cada push na `main`). Variáveis: `MONGODB_URI` e
`MONGODB_DATABASE=market_trends`.

- `/`: a edição mais recente concluída (aviso se a de hoje ainda está rodando).
- `/historico`: todas as edições, agrupadas por mês, com as edições A antigas destacadas.
- `/privacidade`: política de privacidade (exigida pelo Google para o app do youtube_dark).
- `/pesquisa/<data>`: uma edição específica.

```bash
cd frontend && cp .env.example .env.local && npm install && npm run dev
```
