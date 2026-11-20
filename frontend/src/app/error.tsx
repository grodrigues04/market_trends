"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-24 text-center">
      <h1 className="font-serif text-4xl font-semibold">Não foi possível carregar a pesquisa</h1>
      <p className="mt-4 text-ink-soft">O banco de dados não respondeu. Tente de novo em instantes.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper"
      >
        Tentar de novo
      </button>
    </div>
  );
}
