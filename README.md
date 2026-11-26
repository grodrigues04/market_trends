# market_trends

Pesquisa de tendências de mercado em 6 países (EUA, China, Rússia, Reino Unido, Japão e Canadá) e
25 nichos, com foco em oportunidades para o Brasil. Roda num container deste computador
**segunda, terça e quarta à 1h** (edição B, a única), salva o resultado no MongoDB Atlas e é
publicada num blog na Vercel. O resultado é **só tabelas**: o Claude não escreve texto corrido, e
o MongoDB guarda apenas as tabelas (as edições antigas mantêm o texto delas, que o blog não mostra).

| Limite | Valor |
|---|---|
| Uso da janela de 5h | A pesquisa **para em 65%**: nenhuma busca, página ou subagente novo, e os países que faltam ficam de fora. O restante da janela é só para escrever as tabelas com o que foi pesquisado e para as conclusões, que são salvas e publicadas normalmente. |
| Orçamento por país | O país N para de buscar quando a janela chega em N × 9% (EUA 9%, China 18%, ... Canadá 54%) e escreve as tabelas com o que tem. |
| Sessão de país | Uma sessão de país que ainda está rodando em **75%** é morta, para sobrar janela para as conclusões. |
| Por país | No máximo **2 subagentes** de pesquisa e **40 páginas** abertas; a própria sessão escreve as tabelas. As conclusões não abrem páginas. |

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
- `run.sh` roda o Claude (`claude -p`) em **sessões separadas**: uma por país
  (`output/countries/country-NN.json`, com as tabelas de tendências nos 25 nichos, formatos de
  conteúdo e oportunidades de negócio) e uma para as conclusões (`output/highlights.json`, com as
  tabelas das partes 7 a 11 do briefing: comparação entre países, Top 50, Top 20 de conteúdo, Top
  20 de negócio e as 7 listas de recomendações; depois `output/DONE`). Cada sessão recebe
  `routine/instructions.md`, a tarefa da sessão (`session-country.md` ou `session-synthesis.md`),
  os limites (`edition-b.md`) e `routine/prompt.md` (o briefing da pesquisa, igual ao pedido
  original). O Claude coordena a skill `deep-research`, pesquisa em inglês (e nos idiomas locais)
  e escreve as células em pt-BR. Uma sessão que termina sem o seu arquivo roda mais uma vez (se a
  pesquisa ainda não parou); arquivos prontos nunca são refeitos. Nenhuma sessão consegue terminar
  enquanto o seu JSON estiver fora da estrutura que o blog e o youtube_dark leem
  (`json-check-hook.sh`, um hook `Stop`, com `country-check.jq` e `highlights-check.jq`); se o
  `highlights.json` ainda assim ficar errado, é guardado como `highlights.invalid.json` e a sessão
  roda de novo.
- `store.py` grava um documento por data em `market_trends.researches`: `date`, `edition`,
  `status`, `title`, `countries[]` (as tabelas de cada país, ou `skipped` com o motivo),
  `comparison[]`, `top_opportunities[]`, `content_opportunities[]`, `business_opportunities[]`,
  `recommendations[]`, `notices[]` (o que os limites cortaram, mostrado no blog), `started_at`,
  `finished_at`, `error`. Os documentos antigos têm também `summary` e `parts[]` (o texto).

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
  país (N × 9%, nunca acima de 65%), nega toda busca, página e subagente novos, e a sessão escreve
  as tabelas com o que já tem.
- **Parada em 65%**: depois de cada sessão de país, `run.sh` lê o uso da janela. Em 65% ou mais,
  grava `limits/research-stopped` e um aviso, e os países seguintes viram `skipped` sem rodar. As
  conclusões rodam com o que foi pesquisado, e a edição sai como `completed`, com os avisos no
  blog. Durante uma sessão de país, `run.sh` lê o uso a cada 5s e a mata em 75%. O limite é sobre
  o uso total da janela, então uso seu de madrugada também conta.

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
ls data/work/$(date +%F)/output/countries
```

## Frontend

`frontend/` é um Next.js (App Router) publicado na Vercel (projeto `market-trends-front`, root
directory `frontend`, deploy automático a cada push na `main`). Variáveis: `MONGODB_URI` e
`MONGODB_DATABASE=market_trends`.

A edição é mostrada só em tabelas: Top 50 (com busca e filtros por país e potencial no Brasil),
as 7 listas de recomendações, Top 20 de conteúdo, Top 20 de negócio, comparação entre países e uma
aba por país com as tendências agrupadas pelos 25 nichos (filtro por estágio), as oportunidades e
os formatos de conteúdo. O texto das edições antigas não é mostrado.

- `/`: a edição mais recente concluída (aviso se a de hoje ainda está rodando).
- `/historico`: todas as edições, agrupadas por mês, com as edições A antigas destacadas.
- `/privacidade`: política de privacidade (exigida pelo Google para o app do youtube_dark).
- `/pesquisa/<data>`: uma edição específica.

```bash
cd frontend && cp .env.example .env.local && npm install && npm run dev
```
