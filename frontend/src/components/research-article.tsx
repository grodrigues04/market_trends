import { EditionBadge } from "@/components/edition-badge";
import { Markdown } from "@/components/markdown";
import { formatLongDate, readingMinutes } from "@/lib/format";
import type { Recommendation, Research, TopOpportunity } from "@/lib/research";

// One accent per list of part 11, in the order of the brief
const RECOMMENDATION_STYLES: Record<string, { icon: string; color: string }> = {
  most_promising: { icon: "★", color: "#c2410c" },
  overlooked_micro_niches: { icon: "◎", color: "#7c3aed" },
  growth_6_12_months: { icon: "↗", color: "#059669" },
  best_balance: { icon: "⚖", color: "#0284c7" },
  faceless_content: { icon: "▶", color: "#db2777" },
  saas_ai: { icon: "⌘", color: "#4f46e5" },
  adapt_to_brazil: { icon: "✈", color: "#16a34a" },
};

const VISIBLE_OPPORTUNITIES = 10;

export function ResearchArticle({ research }: { research: Research }) {
  const fullText = research.parts.map((part) => part.markdown).join("\n");
  return (
    <article>
      <ResearchHero research={research} minutes={readingMinutes(fullText)} />
      {research.status !== "completed" && <StatusNotice research={research} />}
      {research.notices && research.notices.length > 0 && <EditionNotices notices={research.notices} />}
      {research.recommendations.length > 0 && <Recommendations recommendations={research.recommendations} />}
      {research.top_opportunities.length > 0 && <TopOpportunities opportunities={research.top_opportunities} />}
      {research.parts.length > 0 && <FullReport research={research} />}
    </article>
  );
}

function ResearchHero({ research, minutes }: { research: Research; minutes: number }) {
  return (
    <header className="border-b border-rule py-12 sm:py-16">
      <div className="flex flex-wrap items-center gap-3">
        <EditionBadge edition={research.edition} />
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Edição de {formatLongDate(research.date)}
        </p>
      </div>
      <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-6xl">
        {research.title}
      </h1>
      {research.summary && (
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-ink-soft sm:text-xl">{research.summary}</p>
      )}
      <p className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
        <span>6 países · 25 nichos</span>
        <span aria-hidden>•</span>
        <span>{research.parts.length} partes</span>
        <span aria-hidden>•</span>
        <span>{minutes} min de leitura</span>
      </p>
    </header>
  );
}

function StatusNotice({ research }: { research: Research }) {
  const message =
    research.status === "running"
      ? "Esta edição ainda está sendo pesquisada. As partes aparecem aqui quando a pesquisa terminar."
      : `Esta edição não terminou. ${research.error ?? ""}`;
  return (
    <p className="mt-8 rounded-xl border border-accent/40 bg-accent-soft px-5 py-4 text-sm leading-relaxed">{message}</p>
  );
}

function EditionNotices({ notices }: { notices: string[] }) {
  return (
    <div className="mt-8 rounded-xl border border-rule bg-paper-raised px-5 py-4 text-sm leading-relaxed text-ink-soft">
      <p className="font-semibold text-ink">Limites desta edição</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {notices.map((notice) => (
          <li key={notice}>{notice}</li>
        ))}
      </ul>
    </div>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink-soft">{kicker}</p>
      <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
    </div>
  );
}

function Recommendations({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <section className="border-b border-rule py-14" aria-labelledby="recomendacoes">
      <SectionTitle kicker="Parte 11 em resumo" title="Recomendações estratégicas" />
      <div className="grid gap-6 md:grid-cols-2">
        {recommendations.map((recommendation) => {
          const style = RECOMMENDATION_STYLES[recommendation.key] ?? { icon: "•", color: "var(--accent)" };
          return (
            <div
              key={recommendation.key}
              className="rounded-2xl border border-rule bg-paper-raised p-6 shadow-[0_1px_0_var(--rule)]"
              style={{ borderTop: `4px solid ${style.color}` }}
            >
              <h3 className="flex items-center gap-3 font-serif text-xl font-semibold">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-full text-base text-white"
                  style={{ background: style.color }}
                  aria-hidden
                >
                  {style.icon}
                </span>
                {recommendation.title}
              </h3>
              <ol className="mt-5 space-y-1">
                {recommendation.items.map((item, index) => (
                  <li key={`${recommendation.key}-${index}`}>
                    <details className="group rounded-lg px-2 py-1.5 open:bg-paper hover:bg-paper">
                      <summary className="flex cursor-pointer gap-3 text-[15px] leading-snug">
                        <span className="w-5 shrink-0 text-right font-semibold tabular-nums" style={{ color: style.color }}>
                          {index + 1}
                        </span>
                        <span className="flex-1 font-medium">{item.name}</span>
                        <span className="text-ink-soft transition-transform group-open:rotate-45" aria-hidden>
                          +
                        </span>
                      </summary>
                      <div className="mt-2 space-y-2 pl-8 text-sm leading-relaxed text-ink-soft">
                        <p>{item.description}</p>
                        <p className="flex flex-wrap gap-2">
                          {item.country && <Chip>{item.country}</Chip>}
                          {item.niche && <Chip>{item.niche}</Chip>}
                          {item.evidence_url && (
                            <a
                              href={item.evidence_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-accent underline underline-offset-2"
                            >
                              Fonte
                            </a>
                          )}
                        </p>
                      </div>
                    </details>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-rule px-2.5 py-0.5 text-xs text-ink">{children}</span>;
}

function TopOpportunities({ opportunities }: { opportunities: TopOpportunity[] }) {
  const visible = opportunities.slice(0, VISIBLE_OPPORTUNITIES);
  const hidden = opportunities.slice(VISIBLE_OPPORTUNITIES);
  return (
    <section className="border-b border-rule py-14" aria-labelledby="top-oportunidades">
      <SectionTitle kicker="Parte 8 em resumo" title={`Top ${opportunities.length} oportunidades globais`} />
      <div className="overflow-x-auto rounded-2xl border border-rule bg-paper-raised">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-rule text-xs uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Oportunidade</th>
              <th className="px-4 py-3 font-semibold">País</th>
              <th className="px-4 py-3 font-semibold">Estágio</th>
              <th className="px-4 py-3 font-semibold">Concorrência</th>
              <th className="px-4 py-3 font-semibold">Brasil</th>
              <th className="px-4 py-3 font-semibold">Score</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((opportunity) => (
              <OpportunityRow key={opportunity.rank} opportunity={opportunity} />
            ))}
          </tbody>
        </table>
        {hidden.length > 0 && (
          <details className="group border-t border-rule">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-accent">
              <span className="group-open:hidden">Ver as outras {hidden.length}</span>
              <span className="hidden group-open:inline">Esconder</span>
            </summary>
            <table className="w-full min-w-[760px] text-left text-sm">
              <tbody>
                {hidden.map((opportunity) => (
                  <OpportunityRow key={opportunity.rank} opportunity={opportunity} />
                ))}
              </tbody>
            </table>
          </details>
        )}
      </div>
    </section>
  );
}

function OpportunityRow({ opportunity }: { opportunity: TopOpportunity }) {
  const score = Math.max(0, Math.min(100, opportunity.score ?? 0));
  return (
    <tr className="border-b border-rule last:border-0 align-top">
      <td className="w-10 px-4 py-3 font-serif text-lg font-semibold text-accent tabular-nums">{opportunity.rank}</td>
      <td className="px-4 py-3">
        <p className="font-medium">{opportunity.opportunity}</p>
        <p className="mt-0.5 text-xs text-ink-soft">
          {[opportunity.niche, opportunity.subniche].filter(Boolean).join(" · ")}
        </p>
      </td>
      <td className="w-28 px-4 py-3">{opportunity.country}</td>
      <td className="w-32 px-4 py-3">{opportunity.growth_stage}</td>
      <td className="w-28 px-4 py-3">{opportunity.competition}</td>
      <td className="w-20 px-4 py-3">{opportunity.brazil_potential}</td>
      <td className="w-32 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="w-7 font-semibold tabular-nums">{opportunity.score ?? "–"}</span>
          <span className="h-1.5 flex-1 rounded-full bg-rule">
            <span className="block h-full rounded-full bg-accent" style={{ width: `${score}%` }} />
          </span>
        </div>
      </td>
    </tr>
  );
}

function FullReport({ research }: { research: Research }) {
  return (
    <section className="py-14" aria-labelledby="relatorio">
      <SectionTitle kicker="Relatório completo" title="A pesquisa, parte por parte" />
      <div className="grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="lg:sticky lg:top-6 lg:self-start" aria-label="Partes do relatório">
          <ol className="flex gap-2 overflow-x-auto pb-2 text-sm lg:flex-col lg:gap-1 lg:overflow-visible">
            {research.parts.map((part) => (
              <li key={part.number} className="shrink-0">
                <a
                  href={`#parte-${part.number}`}
                  className="block rounded-lg border border-rule px-3 py-1.5 text-ink-soft hover:border-accent hover:text-ink lg:border-transparent"
                >
                  {part.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="min-w-0 space-y-16">
          {research.parts.map((part) => (
            <section key={part.number} id={`parte-${part.number}`} className="scroll-mt-6">
              <h2 className="mb-6 border-b border-rule pb-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                {part.title}
              </h2>
              <Markdown>{part.markdown}</Markdown>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
