import Link from "next/link";
import { Suspense } from "react";

import { ActiveNavigationLinks, NavigationLinks } from "@/components/navigation-links";

export function SiteHeader() {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <Link href="/" className="group">
          <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            Edições de seg a qua
          </span>
          <span className="font-serif text-4xl font-semibold tracking-tight group-hover:text-accent sm:text-5xl">
            Radar de Mercado
          </span>
        </Link>
        {/* usePathname is dynamic on /pesquisa/[date]: the fallback has the same links, without the active one */}
        <Suspense fallback={<NavigationLinks pathname="" />}>
          <ActiveNavigationLinks />
        </Suspense>
      </div>
    </header>
  );
}
