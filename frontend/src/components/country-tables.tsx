"use client";

import { Fragment, useState } from "react";

import { CELL, HeaderRow, LevelBadge, ROW, SourceLink, StageBadge, TableShell, Tag } from "@/components/table-ui";
import { nicheName } from "@/lib/niches";
import type { CountryTables as Country, CountryTrend } from "@/lib/research";

const ALL = "";

// One tab per country, with its trends in the 25 niches, content formats and opportunities
export function CountryTables({ countries }: { countries: Country[] }) {
  const firstResearched = countries.find((country) => !country.skipped) ?? countries[0];
  const [selected, setSelected] = useState(firstResearched.number);
  const country = countries.find((entry) => entry.number === selected) ?? firstResearched;

  return (
    <div>
      <div role="tablist" aria-label="Países" className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {countries.map((entry) => {
          const active = entry.number === country.number;
          return (
            <button
              key={entry.number}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelected(entry.number)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-ink bg-ink text-paper"
                  : entry.skipped
                    ? "border-dashed border-rule text-ink-soft/70 hover:border-ink-soft"
                    : "border-rule text-ink-soft hover:border-accent hover:text-ink"
              }`}
            >
              {entry.country}
              {!entry.skipped && <span className="ml-1.5 text-xs opacity-70">{entry.trends?.length ?? 0}</span>}
            </button>
          );
        })}
      </div>
      {country.skipped ? (
        <p className="rounded-xl border border-dashed border-rule px-5 py-8 text-center text-ink-soft">
          {country.country} {country.skipped}
        </p>
      ) : (
        <CountryPanel key={country.number} country={country} />
      )}
    </div>
  );
}

function CountryPanel({ country }: { country: Country }) {
  const trends = country.trends ?? [];
  const [stage, setStage] = useState(ALL);
  const stages = [...new Set(trends.map((trend) => trend.stage).filter((value): value is string => Boolean(value)))];
  const filtered = trends.filter((trend) => stage === ALL || trend.stage === stage);

  const byNiche = new Map<number, CountryTrend[]>();
  for (const trend of [...filtered].sort((first, second) => first.niche - second.niche)) {
    byNiche.set(trend.niche, [...(byNiche.get(trend.niche) ?? []), trend]);
  }

  return (
    <div className="space-y-10">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-serif text-2xl font-semibold">Tendências nos 25 nichos</h3>
          {stages.length > 1 && (
            <div className="flex flex-wrap gap-1.5" aria-label="Filtrar por estágio">
              <FilterChip active={stage === ALL} onClick={() => setStage(ALL)}>
                Todas
              </FilterChip>
              {stages.map((value) => (
                <FilterChip key={value} active={stage === value} onClick={() => setStage(value)}>
                  {value}
                </FilterChip>
              ))}
            </div>
          )}
        </div>
        <TableShell minWidth={900}>
          <HeaderRow columns={["Tendência", "Estágio", "Longevidade", "Plataformas", "Evidência", "Fonte"]} />
          <tbody>
            {[...byNiche.entries()].map(([niche, rows]) => (
              <Fragment key={niche}>
                <tr className="border-b border-rule bg-paper">
                  <th colSpan={6} scope="rowgroup" className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    <span className="mr-2 text-accent tabular-nums">{niche}</span>
                    {nicheName(niche)}
                  </th>
                </tr>
                {rows.map((trend, index) => (
                  <tr key={`${niche}-${index}`} className={ROW}>
                    <td className={`${CELL} min-w-56`}>
                      <p className="font-medium">{trend.trend}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">{trend.subniche}</p>
                    </td>
                    <td className={CELL}>
                      <StageBadge stage={trend.stage} />
                    </td>
                    <td className={`${CELL} text-ink-soft`}>{trend.longevity ?? "–"}</td>
                    <td className={`${CELL} min-w-32 text-ink-soft`}>{trend.platforms ?? "–"}</td>
                    <td className={`${CELL} min-w-64 text-ink-soft`}>{trend.evidence ?? "–"}</td>
                    <td className={CELL}>
                      <SourceLink url={trend.source_url} date={trend.source_date} />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </TableShell>
      </div>

      {(country.opportunities ?? []).length > 0 && (
        <div>
          <h3 className="mb-3 font-serif text-2xl font-semibold">Oportunidades de negócio</h3>
          <TableShell minWidth={980}>
            <HeaderRow columns={["Oportunidade", "Tipo", "Público", "Problema", "Monetização", "Concorrência", "Brasil", "Fonte"]} />
            <tbody>
              {(country.opportunities ?? []).map((opportunity, index) => (
                <tr key={index} className={ROW}>
                  <td className={`${CELL} min-w-52`}>
                    <p className="font-medium">{opportunity.opportunity}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">{nicheName(opportunity.niche)}</p>
                  </td>
                  <td className={CELL}>{opportunity.type ? <Tag>{opportunity.type}</Tag> : "–"}</td>
                  <td className={`${CELL} min-w-32 text-ink-soft`}>{opportunity.audience ?? "–"}</td>
                  <td className={`${CELL} min-w-40 text-ink-soft`}>{opportunity.problem ?? "–"}</td>
                  <td className={`${CELL} min-w-32 text-ink-soft`}>{opportunity.monetization ?? "–"}</td>
                  <td className={CELL}>
                    <LevelBadge value={opportunity.competition} higherIsBetter={false} />
                  </td>
                  <td className={CELL}>
                    <LevelBadge value={opportunity.brazil_potential} higherIsBetter />
                  </td>
                  <td className={CELL}>
                    <SourceLink url={opportunity.source_url} />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </div>
      )}

      {(country.content_formats ?? []).length > 0 && (
        <div>
          <h3 className="mb-3 font-serif text-2xl font-semibold">Formatos de conteúdo em alta</h3>
          <TableShell minWidth={720}>
            <HeaderRow columns={["Formato", "Plataformas", "Exemplo", "Fonte"]} />
            <tbody>
              {(country.content_formats ?? []).map((format, index) => (
                <tr key={index} className={ROW}>
                  <td className={`${CELL} min-w-48 font-medium`}>{format.format}</td>
                  <td className={`${CELL} min-w-32 text-ink-soft`}>{format.platforms ?? "–"}</td>
                  <td className={`${CELL} min-w-64 text-ink-soft`}>{format.example ?? "–"}</td>
                  <td className={CELL}>
                    <SourceLink url={format.source_url} />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active ? "border-accent bg-accent text-paper" : "border-rule text-ink-soft hover:border-accent hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
