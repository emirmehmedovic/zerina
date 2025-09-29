type Category = { id: string; name: string; parentId: string | null };

export default async function CategoriesPage() {
  let items: Category[] = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = (await res.json()) as { items: Category[] };
      items = data.items;
    }
  } catch {}

  return (
    <main>
      <h1 className="text-3xl font-bold mb-6">Categories</h1>
      {items.length === 0 ? (
        <p className="text-light-muted dark:text-dark-muted">No categories yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((cat) => (
            <a key={cat.id} href={`/categories/${encodeURIComponent(cat.name.toLowerCase().replace(/\s+/g, '-'))}`} className="card-base card-hover block">
              <h3 className="font-semibold mb-1">{cat.name}</h3>
              <p className="text-light-muted dark:text-dark-muted text-sm">Explore {cat.name}</p>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
