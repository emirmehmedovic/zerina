export default function CategoriesLoading() {
  return (
    <main>
      <div className="h-8 w-44 mb-6 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-base card-glass">
            <div className="h-24 rounded mb-3 bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="h-4 w-40 mb-2 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-28 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  );
}
