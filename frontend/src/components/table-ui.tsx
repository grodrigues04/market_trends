// Building blocks shared by the tables of an edition (server and client components)

const STAGE_STYLES: Record<string, string> = {
  Consolidada: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  "Em crescimento": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  Emergente: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  Viral: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300",
  "Mercado carente": "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  "Em declínio": "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
  // Patterns of the comparison between countries
  Simultânea: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  Concentrada: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  "Em expansão": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  "Ainda não mainstream": "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
};

const NEUTRAL = "bg-paper text-ink-soft ring-1 ring-rule";
const GOOD = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
const MIDDLE = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
const BAD = "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

// "higher is better" for the potential in Brazil, "lower is better" for competition and complexity
function levelStyle(value: string, higherIsBetter: boolean): string {
  const level = normalize(value);
  if (level.startsWith("med")) return MIDDLE;
  if (level.startsWith("alt")) return higherIsBetter ? GOOD : BAD;
  if (level.startsWith("baix")) return higherIsBetter ? BAD : GOOD;
  return NEUTRAL;
}

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}

export function StageBadge({ stage }: { stage?: string | null }) {
  if (!stage) {
    return <span className="text-ink-soft">–</span>;
  }
  return <Pill className={STAGE_STYLES[stage] ?? NEUTRAL}>{stage}</Pill>;
}

export function LevelBadge({ value, higherIsBetter }: { value?: string | null; higherIsBetter: boolean }) {
  if (!value) {
    return <span className="text-ink-soft">–</span>;
  }
  return <Pill className={levelStyle(value, higherIsBetter)}>{value}</Pill>;
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <Pill className={NEUTRAL}>{children}</Pill>;
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "fonte";
  }
}

export function SourceLink({ url, date }: { url?: string | null; date?: string | null }) {
  if (!url) {
    return <span className="text-ink-soft">–</span>;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={url}
      className="inline-flex max-w-40 flex-col text-xs leading-tight text-accent hover:underline"
    >
      <span className="truncate font-medium">{hostname(url)} ↗</span>
      {date && <span className="text-ink-soft">{date}</span>}
    </a>
  );
}

export function ScoreBar({ score }: { score?: number | null }) {
  const width = Math.max(0, Math.min(100, score ?? 0));
  return (
    <div className="flex items-center gap-2">
      <span className="w-7 font-semibold tabular-nums">{score ?? "–"}</span>
      <span className="h-1.5 w-14 rounded-full bg-rule">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${width}%` }} />
      </span>
    </div>
  );
}

export function TableShell({ minWidth, children }: { minWidth: number; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-rule bg-paper-raised">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function HeaderRow({ columns }: { columns: string[] }) {
  return (
    <thead className="border-b border-rule text-xs uppercase tracking-wider text-ink-soft">
      <tr>
        {columns.map((column) => (
          <th key={column} scope="col" className="px-3 py-3 font-semibold whitespace-nowrap">
            {column}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export const ROW = "border-b border-rule last:border-0 align-top";
export const CELL = "px-3 py-3";
export const RANK = "w-10 px-3 py-3 font-serif text-lg font-semibold text-accent tabular-nums";

export function SectionTitle({ id, kicker, title, count }: { id: string; kicker: string; title: string; count?: number }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink-soft">{kicker}</p>
        <h2 id={id} className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h2>
      </div>
      {count !== undefined && <p className="text-sm text-ink-soft">{count} linhas</p>}
    </div>
  );
}
