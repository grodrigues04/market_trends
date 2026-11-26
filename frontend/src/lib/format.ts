const LONG_DATE = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const MONTH = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

const SHORT_DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });

function fromIsoDate(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

export function formatLongDate(date: string): string {
  return LONG_DATE.format(fromIsoDate(date));
}

export function formatMonth(date: string): string {
  const month = MONTH.format(fromIsoDate(date));
  return month.charAt(0).toUpperCase() + month.slice(1);
}

export function formatShortDate(date: string): string {
  return SHORT_DATE.format(fromIsoDate(date)).replace(".", "");
}
