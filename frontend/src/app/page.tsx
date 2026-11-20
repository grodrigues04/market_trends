import { Suspense } from "react";

import { ArticleSkeleton } from "@/components/article-skeleton";
import { ResearchArticle } from "@/components/research-article";
import { formatLongDate } from "@/lib/format";
import { getLatestResearch, getRunningResearch } from "@/lib/research";

export default function HomePage() {
  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <LatestEdition />
    </Suspense>
  );
}

async function LatestEdition() {
  const [latest, running] = await Promise.all([getLatestResearch(), getRunningResearch()]);
  const runningIsNewer = running && (!latest || running.date > latest.date);

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
      {latest ? (
        <ResearchArticle research={latest} />
      ) : (
        <div className="py-24 text-center">
          <h1 className="font-serif text-4xl font-semibold">A primeira edição ainda não saiu</h1>
          <p className="mt-4 text-ink-soft">A pesquisa roda todos os dias às 5h. Volte mais tarde.</p>
        </div>
      )}
    </>
  );
}
