import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="font-serif text-4xl font-semibold">Edição não encontrada</h1>
      <p className="mt-4 text-ink-soft">Não existe pesquisa para essa data.</p>
      <Link href="/historico" className="mt-8 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper">
        Ver o histórico
      </Link>
    </div>
  );
}
