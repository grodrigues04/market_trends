import type { ResearchEdition } from "@/lib/research";

export const EDITION_LABELS: Record<ResearchEdition, string> = {
  A: "Edição completa",
  B: "Edição diária",
};

export function EditionBadge({ edition, className = "" }: { edition?: ResearchEdition; className?: string }) {
  if (!edition) {
    return null;
  }
  const style =
    edition === "A"
      ? "border-accent bg-accent text-paper"
      : "border-rule text-ink-soft";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style} ${className}`}
    >
      {edition === "A" && <span aria-hidden>★</span>}
      {EDITION_LABELS[edition]}
    </span>
  );
}
