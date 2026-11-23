import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EditionBadge } from "@/components/edition-badge";
import { formatMonth, formatShortDate } from "@/lib/format";
import { listResearches, type ResearchStatus, type ResearchSummary } from "@/lib/research";

export const metadata: Metadata = { title: "Histórico" };

const STATUS_LABELS: Record<ResearchStatus, { label: string; className: string }> = {
  completed: { label: "Concluída", className: "border-emerald-600/30 text-emerald-700 dark:text-emerald-400" },
  running: { label: "Em andamento", className: "border-accent/40 text-accent" },
  failed: { label: "Incompleta", className: "border-red-600/30 text-red-700 dark:text-red-400" },
};

export default function HistoryPage() {
  return (
    <div className="py-12 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Arquivo</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Histórico de pesquisas</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">
        Todas as edições do radar, da mais recente para a mais antiga. A edição completa sai às quintas; as
        diárias, de segunda a quarta.
      </p>
      <Suspense fallback={<HistorySkeleton />}>
        <HistoryList />
      </Suspense>
    </div>
  );
}

async function HistoryList() {
  const researches = await listResearches();
  if (researches.length === 0) {
    return <p className="mt-12 text-ink-soft">Nenhuma pesquisa ainda.</p>;
  }

  const months = new Map<string, ResearchSummary[]>();
  for (const research of researches) {
    const month = research.date.slice(0, 7);
    months.set(month, [...(months.get(month) ?? []), research]);
  }

  return (
    <div className="mt-12 space-y-14">
      {[...months.entries()].map(([month, entries]) => (
        <section key={month}>
          <h2 className="sticky top-0 z-10 border-b border-rule bg-paper/95 py-3 font-serif text-2xl font-semibold backdrop-blur">
            {formatMonth(entries[0].date)}
          </h2>
          <ol className="divide-y divide-rule">
            {entries.map((research) => (
              <HistoryEntry key={research.date} research={research} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function HistoryEntry({ research }: { research: ResearchSummary }) {
  const status = STATUS_LABELS[research.status] ?? STATUS_LABELS.failed;
  const [day, month] = formatShortDate(research.date).split(" de ");
  return (
    <li>
      <Link
        href={`/pesquisa/${research.date}`}
        className={`group flex gap-5 py-6 sm:gap-8 ${research.edition === "A" ? "-mx-4 rounded-xl bg-accent-soft px-4" : ""}`}
      >
        <div className="w-14 shrink-0 text-center">
          <p className="font-serif text-3xl font-semibold leading-none text-accent">{day}</p>
          <p className="mt-1 text-xs uppercase tracking-wider text-ink-soft">{month}</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <EditionBadge edition={research.edition} />
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
              {status.label}
            </span>
            {research.part_count > 0 && <span className="text-xs text-ink-soft">{research.part_count} partes</span>}
          </div>
          <h3 className="mt-2 font-serif text-xl font-semibold leading-snug group-hover:text-accent sm:text-2xl">
            {research.title || `Pesquisa de ${research.date}`}
          </h3>
          {research.summary && <p className="mt-2 line-clamp-2 text-ink-soft">{research.summary}</p>}
        </div>
      </Link>
    </li>
  );
}

function HistorySkeleton() {
  return (
    <div className="mt-12 animate-pulse space-y-6">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex gap-6">
          <div className="h-14 w-14 rounded bg-rule" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-2/3 rounded bg-rule" />
            <div className="h-4 w-full rounded bg-rule" />
          </div>
        </div>
      ))}
    </div>
  );
}
