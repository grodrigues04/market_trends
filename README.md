# market_trends

Pesquisa de tendências de mercado em 6 países (EUA, China, Rússia, Reino Unido, Japão e Canadá) e
25 nichos, com foco em oportunidades para o Brasil. Roda num container deste computador em duas
edições, salva o resultado no MongoDB Atlas e é publicada num blog na Vercel.

| Edição | Quando | Limites |
|---|---|---|
| **A, completa** | quinta, 21h | Sem limite de subagentes nem de páginas. Quando a janela de uso de 5h chega em **87%**, para de buscar (veja abaixo). |
| **B, diária** | segunda, terça e quarta, 1h | Por país, no máximo **5 subagentes** e **110 páginas** abertas (660 no total). As conclusões não abrem páginas. |

Sexta, sábado e domingo não têm pesquisa (a de sexta à 1h cairia na mesma janela de 5h da
edição A de quinta).

```
container market-trends ──Claude + deep-research──▶ /data/work/<data>/output
        │ store.py (root)
        ▼
MongoDB Atlas  market_trends.researches ──▶ frontend (Vercel): edição mais recente, edição A em destaque, histórico
        │
        └──▶ youtube_dark (às 6h, usa a edição A mais recente; nunca roda logo depois da pesquisa)
```

## Como funciona

- `routine/scheduler.sh` olha o relógio a cada 30s e roda `routine/run_daily.sh <data> <A|B>` no
  horário da edição (lock em `data/state/<data>.lock`). Se o computador estava desligado no
  horário, a pesquisa começa assim que o container voltar, até o fim da faixa (B até 05h59, A até
  23h59 de quinta).
- `run_daily.sh` marca a pesquisa como `running` no MongoDB, roda `run.sh` e salva o resultado
  (`completed` ou `failed`) com `store.py`.
- `run.sh` roda o Claude (`claude -p`) em **sessões separadas**: uma por país (partes 1 a 6) e
  uma para as conclusões (partes 7 a 11, `output/highlights.json` com as 7 listas da Parte 11 e o
  Top 50, e `output/DONE`). Cada sessão recebe `routine/instructions.md`, a tarefa da sessão
  (`session-country.md` ou `session-synthesis.md`), os limites da edição (`edition-a.md` ou
  `edition-b.md`) e `routine/prompt.md` (o briefing da pesquisa, igual ao pedido original). O
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

- **Edição B**: conta as chamadas de `WebFetch` (páginas) e `Agent` (subagentes) da sessão do
  país em `data/work/<data>/limits/country-N/` e nega a 111ª página e o 6º subagente. Os
  contadores continuam numa segunda tentativa, que nunca ganha um limite novo. A sessão das
  conclusões roda sem `WebFetch`, `WebSearch` e `Agent`.
- **Edição A**: lê o uso da janela de 5h que o Claude Code grava no stream (`rate_limit_event`).
  Ao chegar em 87%, grava `limits/usage-limit-reached` e daí em diante nega toda busca, página e
  subagente novos, mesmo que a janela renove. O que já estava sendo lido termina. Os países que
  ainda não tinham começado entram como "não pesquisado nesta edição", e as conclusões são
  escritas sem pesquisa nova, a partir dos países prontos.

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

# Rodar (ou retomar) a pesquisa de hoje agora, edição A ou B
docker exec -e MANUAL_RUN=1 market-trends /app/run_daily.sh $(date +%F) B

# Acompanhar
tail -f data/logs/$(date +%F).log
ls data/work/$(date +%F)/output/parts
```

## Frontend

`frontend/` é um Next.js (App Router) publicado na Vercel (projeto `market-trends-front`, root
directory `frontend`, deploy automático a cada push na `main`). Variáveis: `MONGODB_URI` e
`MONGODB_DATABASE=market_trends`.

- `/`: a edição mais recente concluída (aviso se a de hoje ainda está rodando), com a edição A
  mais recente em destaque no topo quando a mais recente é uma B.
- `/historico`: todas as edições, agrupadas por mês, com as edições A destacadas.
- `/privacidade`: política de privacidade (exigida pelo Google para o app do youtube_dark).
- `/pesquisa/<data>`: uma edição específica.

```bash
cd frontend && cp .env.example .env.local && npm install && npm run dev
```
