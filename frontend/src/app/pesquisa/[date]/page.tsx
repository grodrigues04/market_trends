import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ArticleSkeleton } from "@/components/article-skeleton";
import { ResearchArticle } from "@/components/research-article";
import { formatLongDate } from "@/lib/format";
import { getResearch } from "@/lib/research";

export async function generateMetadata({ params }: PageProps<"/pesquisa/[date]">): Promise<Metadata> {
  const { date } = await params;
  return { title: /^\d{4}-\d{2}-\d{2}$/.test(date) ? `Edição de ${formatLongDate(date)}` : "Pesquisa" };
}

export default function ResearchPage({ params }: PageProps<"/pesquisa/[date]">) {
  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <Edition params={params} />
    </Suspense>
  );
}

async function Edition({ params }: { params: PageProps<"/pesquisa/[date]">["params"] }) {
  const { date } = await params;
  const research = await getResearch(date);
  if (!research) {
    notFound();
  }
  return <ResearchArticle research={research} />;
}
