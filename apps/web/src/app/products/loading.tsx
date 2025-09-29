export default function ProductsLoading() {
  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        <div className="h-8 w-40 mb-6 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
        <div className="card-base card-glass p-3 mb-4">
          <div className="h-4 w-48 mb-2 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 w-16 rounded-full border bg-black/10 dark:bg-white/10 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-base card-glass">
              <div className="h-40 rounded mb-3 bg-black/10 dark:bg-white/10 animate-pulse" />
              <div className="h-4 w-36 mb-2 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-24 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
