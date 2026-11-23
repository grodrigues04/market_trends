import Link from "next/link";
import { Suspense } from "react";

import { ArticleSkeleton } from "@/components/article-skeleton";
import { ResearchArticle } from "@/components/research-article";
import { formatLongDate } from "@/lib/format";
import { getLatestResearch, getRunningResearch, type Research } from "@/lib/research";

export default function HomePage() {
  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <LatestEdition />
    </Suspense>
  );
}

async function LatestEdition() {
  const [latest, latestComplete, running] = await Promise.all([
    getLatestResearch(),
    getLatestResearch("A"),
    getRunningResearch(),
  ]);
  const runningIsNewer = running && (!latest || running.date > latest.date);
  // The complete edition of the week stays highlighted while the daily ones come out
  const featureComplete = latestComplete && latest && latestComplete.date !== latest.date;

  return (
    <>
      {runningIsNewer && (
        <p className="mt-8 flex items-center gap-3 rounded-xl border border-rule bg-paper-raised px-5 py-4 text-sm">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
          </span>
          A edição de {formatLongDate(running.date)} está sendo pesquisada agora.
          {latest && " Enquanto isso, veja a edição anterior."}
        </p>
      )}
      {featureComplete && <CompleteEditionFeature research={latestComplete} />}
      {latest ? (
        <ResearchArticle research={latest} />
      ) : (
        <div className="py-24 text-center">
          <h1 className="font-serif text-4xl font-semibold">A primeira edição ainda não saiu</h1>
          <p className="mt-4 text-ink-soft">
            As edições diárias saem de segunda a quarta, e a completa às quintas. Volte mais tarde.
          </p>
        </div>
      )}
    </>
  );
}

function CompleteEditionFeature({ research }: { research: Research }) {
  return (
    <Link
      href={`/pesquisa/${research.date}`}
      className="group mt-8 block rounded-2xl border-2 border-accent bg-accent-soft p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
        ★ Edição completa da semana · {formatLongDate(research.date)}
      </p>
      <h2 className="mt-3 font-serif text-2xl leading-tight font-semibold text-balance group-hover:text-accent sm:text-4xl">
        {research.title}
      </h2>
      {research.summary && <p className="mt-3 line-clamp-3 max-w-3xl text-ink-soft sm:text-lg">{research.summary}</p>}
      <p className="mt-4 text-sm font-semibold text-accent">Ler a edição completa →</p>
    </Link>
  );
}
