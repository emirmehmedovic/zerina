export default function RootLoading() {
  return (
    <main className="min-h-screen p-6 sm:p-10">
      <section className="relative mb-8 overflow-hidden rounded-[var(--radius-card-lg)]">
        <div className="h-40 sm:h-60 w-full bg-black/10 dark:bg-white/10 animate-pulse" />
      </section>
      <section>
        <div className="h-6 w-48 mb-4 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card-base card-glass">
              <div className="h-36 rounded mb-3 bg-black/10 dark:bg-white/10 animate-pulse" />
              <div className="h-4 w-32 mb-2 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-20 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
