"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Edição do dia" },
  { href: "/historico", label: "Histórico" },
];

export function ActiveNavigationLinks() {
  return <NavigationLinks pathname={usePathname()} />;
}

export function NavigationLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="flex gap-1 text-sm font-medium">
      {LINKS.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href) || pathname.startsWith("/pesquisa");
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-2 transition-colors ${
              active ? "bg-ink text-paper" : "text-ink-soft hover:bg-accent-soft hover:text-ink"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
