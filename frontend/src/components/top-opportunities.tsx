"use client";

import { useMemo, useState } from "react";

import { CELL, HeaderRow, LevelBadge, RANK, ROW, ScoreBar, SourceLink, StageBadge, TableShell } from "@/components/table-ui";
import type { TopOpportunity } from "@/lib/research";

const COLLAPSED_ROWS = 15;
const ALL = "";

function unique(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort((first, second) =>
    first.localeCompare(second, "pt-BR"),
  );
}

function matches(opportunity: TopOpportunity, query: string): boolean {
  const text = [opportunity.opportunity, opportunity.niche, opportunity.subniche, opportunity.monetization, opportunity.evidence]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return text.includes(query.toLowerCase());
}

// The Top 50, filterable by country, potential in Brazil and text
export function TopOpportunities({ opportunities }: { opportunities: TopOpportunity[] }) {
  const [country, setCountry] = useState(ALL);
  const [potential, setPotential] = useState(ALL);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const countries = useMemo(() => unique(opportunities.map((opportunity) => opportunity.country)), [opportunities]);
  const potentials = useMemo(
    () => unique(opportunities.map((opportunity) => opportunity.brazil_potential)),
    [opportunities],
  );
  const hasEvidence = opportunities.some((opportunity) => opportunity.evidence || opportunity.evidence_url);

  const filtered = opportunities.filter(
    (opportunity) =>
      (country === ALL || opportunity.country === country) &&
      (potential === ALL || opportunity.brazil_potential === potential) &&
      (query.trim() === "" || matches(opportunity, query.trim())),
  );
  const filtering = country !== ALL || potential !== ALL || query.trim() !== "";
  const visible = filtering || expanded ? filtered : filtered.slice(0, COLLAPSED_ROWS);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar oportunidade, nicho…"
          aria-label="Buscar nas oportunidades"
          className="min-w-0 flex-1 rounded-full border border-rule bg-paper-raised px-4 py-2 text-sm outline-none focus:border-accent sm:max-w-xs"
        />
        <Select label="País" value={country} onChange={setCountry} options={countries} />
        <Select label="Potencial no Brasil" value={potential} onChange={setPotential} options={potentials} />
      </div>
      <TableShell minWidth={hasEvidence ? 980 : 820}>
        <HeaderRow
          columns={[
            "#",
            "Oportunidade",
            "País",
            "Estágio",
            "Concorrência",
            "Brasil",
            "Monetização",
            ...(hasEvidence ? ["Evidência"] : []),
            "Score",
          ]}
        />
        <tbody>
          {visible.map((opportunity) => (
            <tr key={opportunity.rank} className={ROW}>
              <td className={RANK}>{opportunity.rank}</td>
              <td className={`${CELL} min-w-48`}>
                <p className="font-medium">{opportunity.opportunity}</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {[opportunity.niche, opportunity.subniche].filter(Boolean).join(" · ")}
                </p>
              </td>
              <td className={`${CELL} whitespace-nowrap`}>{opportunity.country}</td>
              <td className={CELL}>
                <StageBadge stage={opportunity.growth_stage} />
              </td>
              <td className={CELL}>
                <LevelBadge value={opportunity.competition} higherIsBetter={false} />
              </td>
              <td className={CELL}>
                <LevelBadge value={opportunity.brazil_potential} higherIsBetter />
              </td>
              <td className={`${CELL} min-w-28 text-ink-soft`}>{opportunity.monetization}</td>
              {hasEvidence && (
                <td className={`${CELL} min-w-44`}>
                  {opportunity.evidence && <p className="text-xs text-ink-soft">{opportunity.evidence}</p>}
                  <SourceLink url={opportunity.evidence_url} />
                </td>
              )}
              <td className={CELL}>
                <ScoreBar score={opportunity.score} />
              </td>
            </tr>
          ))}
          {visible.length === 0 && (
            <tr>
              <td colSpan={9} className="px-3 py-8 text-center text-ink-soft">
                Nenhuma oportunidade com esses filtros.
              </td>
            </tr>
          )}
        </tbody>
      </TableShell>
      {!filtering && filtered.length > COLLAPSED_ROWS && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 rounded-full border border-rule px-4 py-2 text-sm font-medium text-accent hover:border-accent"
        >
          {expanded ? "Mostrar menos" : `Mostrar todas as ${filtered.length}`}
        </button>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  if (options.length < 2) {
    return null;
  }
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      className="rounded-full border border-rule bg-paper-raised px-4 py-2 text-sm outline-none focus:border-accent"
    >
      <option value={ALL}>{label}: todos</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
