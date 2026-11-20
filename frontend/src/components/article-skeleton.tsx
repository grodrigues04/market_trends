export function ArticleSkeleton() {
  return (
    <div className="animate-pulse py-16" aria-label="Carregando">
      <div className="h-4 w-56 rounded bg-rule" />
      <div className="mt-6 h-12 w-full max-w-3xl rounded bg-rule" />
      <div className="mt-3 h-12 w-2/3 max-w-2xl rounded bg-rule" />
      <div className="mt-8 h-5 w-full max-w-3xl rounded bg-rule" />
      <div className="mt-3 h-5 w-5/6 max-w-3xl rounded bg-rule" />
      <div className="mt-16 grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-64 rounded-2xl bg-rule" />
        ))}
      </div>
    </div>
  );
}
