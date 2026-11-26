import { CountryTables } from "@/components/country-tables";
import { EditionBadge } from "@/components/edition-badge";
import {
  CELL,
  HeaderRow,
  LevelBadge,
  RANK,
  ROW,
  SectionTitle,
  StageBadge,
  TableShell,
  Tag,
} from "@/components/table-ui";
import { TopOpportunities } from "@/components/top-opportunities";
import { formatLongDate } from "@/lib/format";
import type {
  BusinessOpportunity,
  ComparisonRow,
  ContentOpportunity,
  Recommendation,
  Research,
} from "@/lib/research";

// One accent per list of the final recommendations, in the order of the brief
const RECOMMENDATION_STYLES: Record<string, { icon: string; color: string }> = {
  most_promising: { icon: "★", color: "#c2410c" },
  overlooked_micro_niches: { icon: "◎", color: "#7c3aed" },
  growth_6_12_months: { icon: "↗", color: "#059669" },
  best_balance: { icon: "⚖", color: "#0284c7" },
  faceless_content: { icon: "▶", color: "#db2777" },
  saas_ai: { icon: "⌘", color: "#4f46e5" },
  adapt_to_brazil: { icon: "✈", color: "#16a34a" },
};

// The edition as tables only: the text of the older editions is not shown
export function ResearchArticle({ research }: { research: Research }) {
  const countries = research.countries ?? [];
  const sections = [
    { id: "top-oportunidades", label: "Top oportunidades", show: research.top_opportunities.length > 0 },
    { id: "recomendacoes", label: "Recomendações", show: research.recommendations.length > 0 },
    { id: "conteudo", label: "Conteúdo", show: (research.content_opportunities ?? []).length > 0 },
    { id: "negocios", label: "Negócios", show: (research.business_opportunities ?? []).length > 0 },
    { id: "comparacao", label: "Entre países", show: (research.comparison ?? []).length > 0 },
    { id: "paises", label: "Por país", show: countries.length > 0 },
  ].filter((section) => section.show);

  return (
    <article>
      <ResearchHero research={research} />
      {research.status !== "completed" && <StatusNotice research={research} />}
      {research.notices && research.notices.length > 0 && <EditionNotices notices={research.notices} />}
      {sections.length > 1 && (
        <nav
          aria-label="Tabelas da edição"
          className="sticky top-0 z-20 -mx-4 mt-8 flex gap-2 overflow-x-auto border-b border-rule bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"
        >
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="shrink-0 rounded-full border border-rule px-3 py-1.5 text-sm text-ink-soft hover:border-accent hover:text-ink"
            >
              {section.label}
            </a>
          ))}
        </nav>
      )}
      {research.top_opportunities.length > 0 && (
        <Section id="top-oportunidades">
          <SectionTitle
            id="top-oportunidades-titulo"
            kicker="Ranking global"
            title={`Top ${research.top_opportunities.length} oportunidades`}
          />
          <TopOpportunities opportunities={research.top_opportunities} />
        </Section>
      )}
      {research.recommendations.length > 0 && <Recommendations recommendations={research.recommendations} />}
      {(research.content_opportunities ?? []).length > 0 && (
        <ContentOpportunities opportunities={research.content_opportunities ?? []} />
      )}
      {(research.business_opportunities ?? []).length > 0 && (
        <BusinessOpportunities opportunities={research.business_opportunities ?? []} />
      )}
      {(research.comparison ?? []).length > 0 && <Comparison rows={research.comparison ?? []} />}
      {countries.length > 0 && (
        <Section id="paises">
          <SectionTitle id="paises-titulo" kicker="Pesquisa de cada país" title="Tendências por país" />
          <CountryTables countries={countries} />
        </Section>
      )}
    </article>
  );
}

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-20 border-b border-rule py-14 last:border-0">
      {children}
    </section>
  );
}

function ResearchHero({ research }: { research: Research }) {
  const countries = research.countries ?? [];
  const researched = countries.filter((country) => !country.skipped);
  const trendCount = researched.reduce((total, country) => total + (country.trends?.length ?? 0), 0);
  const stats = [
    countries.length > 0 ? `${researched.length} de ${countries.length} países` : "6 países",
    "25 nichos",
    trendCount > 0 ? `${trendCount} tendências` : null,
    research.top_opportunities.length > 0 ? `${research.top_opportunities.length} oportunidades no ranking` : null,
  ].filter(Boolean);
  return (
    <header className="border-b border-rule py-12 sm:py-14">
      <div className="flex flex-wrap items-center gap-3">
        <EditionBadge edition={research.edition} />
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Edição de {formatLongDate(research.date)}
        </p>
      </div>
      <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
        {research.title}
      </h1>
      <ul className="mt-6 flex flex-wrap gap-2 text-sm">
        {stats.map((stat) => (
          <li key={stat} className="rounded-full border border-rule bg-paper-raised px-3 py-1 text-ink-soft">
            {stat}
          </li>
        ))}
      </ul>
    </header>
  );
}

function StatusNotice({ research }: { research: Research }) {
  const message =
    research.status === "running"
      ? "Esta edição ainda está sendo pesquisada. As tabelas aparecem aqui quando a pesquisa terminar."
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

function Recommendations({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <Section id="recomendacoes">
      <SectionTitle id="recomendacoes-titulo" kicker="Recomendações finais" title="7 listas de 10" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {recommendations.map((recommendation) => {
          const style = RECOMMENDATION_STYLES[recommendation.key] ?? { icon: "•", color: "var(--accent)" };
          return (
            <div
              key={recommendation.key}
              className="rounded-2xl border border-rule bg-paper-raised p-5"
              style={{ borderTop: `4px solid ${style.color}` }}
            >
              <h3 className="flex items-center gap-3 font-serif text-lg leading-snug font-semibold">
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-full text-sm text-white"
                  style={{ background: style.color }}
                  aria-hidden
                >
                  {style.icon}
                </span>
                {recommendation.title}
              </h3>
              <ol className="mt-4 space-y-0.5">
                {recommendation.items.map((item, index) => (
                  <li key={`${recommendation.key}-${index}`}>
                    <details className="group rounded-lg px-2 py-1.5 open:bg-paper hover:bg-paper">
                      <summary className="flex cursor-pointer gap-3 text-sm leading-snug">
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
                        <p className="flex flex-wrap items-center gap-2">
                          {item.country && <Tag>{item.country}</Tag>}
                          {item.niche && <Tag>{item.niche}</Tag>}
                          {item.evidence_url && (
                            <a
                              href={item.evidence_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-accent hover:underline"
                            >
                              Fonte ↗
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
    </Section>
  );
}

function ContentOpportunities({ opportunities }: { opportunities: ContentOpportunity[] }) {
  return (
    <Section id="conteudo">
      <SectionTitle id="conteudo-titulo" kicker="Para criar conteúdo" title={`Top ${opportunities.length} de conteúdo`} />
      <TableShell minWidth={1100}>
        <HeaderRow columns={["#", "Tema", "Plataformas", "5 ideias", "3 ganchos", "Monetização", "Exemplo"]} />
        <tbody>
          {opportunities.map((opportunity) => (
            <tr key={opportunity.rank} className={ROW}>
              <td className={RANK}>{opportunity.rank}</td>
              <td className={`${CELL} min-w-48`}>
                <p className="font-medium">{opportunity.theme}</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {[opportunity.audience, opportunity.positioning].filter(Boolean).join(" · ")}
                </p>
              </td>
              <td className={`${CELL} min-w-28 text-ink-soft`}>{opportunity.platforms ?? "–"}</td>
              <td className={`${CELL} min-w-60`}>
                <ul className="list-disc space-y-0.5 pl-4 text-ink-soft marker:text-accent">
                  {opportunity.ideas.map((idea) => (
                    <li key={idea}>{idea}</li>
                  ))}
                </ul>
              </td>
              <td className={`${CELL} min-w-56`}>
                <ul className="space-y-1">
                  {opportunity.hooks.map((hook) => (
                    <li key={hook} className="border-l-2 border-accent pl-2 italic">
                      {hook}
                    </li>
                  ))}
                </ul>
              </td>
              <td className={`${CELL} min-w-32 text-ink-soft`}>{opportunity.monetization ?? "–"}</td>
              <td className={`${CELL} min-w-32 text-ink-soft`}>{opportunity.example ?? "–"}</td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </Section>
  );
}

function BusinessOpportunities({ opportunities }: { opportunities: BusinessOpportunity[] }) {
  return (
    <Section id="negocios">
      <SectionTitle id="negocios-titulo" kicker="Para abrir um negócio" title={`Top ${opportunities.length} de negócio`} />
      <TableShell minWidth={1100}>
        <HeaderRow columns={["#", "Negócio", "Público", "MVP", "Monetização", "Concorrentes", "Complexidade", "Brasil"]} />
        <tbody>
          {opportunities.map((opportunity) => (
            <tr key={opportunity.rank} className={ROW}>
              <td className={RANK}>{opportunity.rank}</td>
              <td className={`${CELL} min-w-56`}>
                <p className="font-medium">{opportunity.concept}</p>
                {opportunity.problem && <p className="mt-0.5 text-xs text-ink-soft">{opportunity.problem}</p>}
              </td>
              <td className={`${CELL} min-w-32 text-ink-soft`}>{opportunity.audience ?? "–"}</td>
              <td className={`${CELL} min-w-48 text-ink-soft`}>{opportunity.mvp ?? "–"}</td>
              <td className={`${CELL} min-w-32 text-ink-soft`}>{opportunity.monetization ?? "–"}</td>
              <td className={`${CELL} min-w-36 text-ink-soft`}>{opportunity.competitors ?? "–"}</td>
              <td className={CELL}>
                <LevelBadge value={opportunity.complexity} higherIsBetter={false} />
              </td>
              <td className={CELL}>
                <LevelBadge value={opportunity.brazil_potential} higherIsBetter />
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </Section>
  );
}

function Comparison({ rows }: { rows: ComparisonRow[] }) {
  return (
    <Section id="comparacao">
      <SectionTitle id="comparacao-titulo" kicker="Comparação" title="O que aparece entre países" />
      <TableShell minWidth={860}>
        <HeaderRow columns={["Tendência", "Países", "Padrão", "Lidera", "Observação"]} />
        <tbody>
          {rows.map((row) => (
            <tr key={row.trend} className={ROW}>
              <td className={`${CELL} min-w-52 font-medium`}>{row.trend}</td>
              <td className={`${CELL} min-w-44`}>
                <span className="flex flex-wrap gap-1">
                  {row.countries.map((country) => (
                    <Tag key={country}>{country}</Tag>
                  ))}
                </span>
              </td>
              <td className={CELL}>
                <StageBadge stage={row.pattern} />
              </td>
              <td className={`${CELL} whitespace-nowrap`}>{row.leader ?? "–"}</td>
              <td className={`${CELL} min-w-64 text-ink-soft`}>{row.note ?? "–"}</td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </Section>
  );
}
