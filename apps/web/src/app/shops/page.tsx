import { API_URL } from "@/lib/api";

// Public Shops index page
// Note: The API's GET /api/v1/shops endpoint is ADMIN-only.
// We attempt to fetch it; if unauthorized, we gracefully show an informational message.
// Individual shop pages are available publicly at /shops/[slug].

type Shop = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status?: string;
};

export default async function ShopsPage() {
  let shops: Shop[] = [];
  let error: string | null = null;
  try {
    const res = await fetch(`${API_URL}/api/v1/shops?take=12`, {
      // If the user is logged in as ADMIN in the same origin, cookies may allow this.
      // Otherwise, this will likely return 401/403 and we'll show a friendly message.
      cache: "no-store",
      credentials: "include",
    });
    if (res.ok) {
      const data = (await res.json()) as { items: Shop[] };
      shops = data.items || [];
    } else if (res.status === 401 || res.status === 403) {
      error = "You do not have permission to view all shops. This page requires ADMIN access.";
    } else {
      error = `Failed to load shops (${res.status})`;
    }
  } catch {
    error = "Failed to load shops";
  }

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-4">Shops</h1>
        {error && (
          <div className="card-base card-glass p-4 mb-6 text-sm text-light-muted dark:text-dark-muted">
            {error}
          </div>
        )}
        {shops.length === 0 ? (
          <div className="card-base card-glass p-6 text-sm text-light-muted dark:text-dark-muted">
            No shops to display.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((s) => (
              <article key={s.id} className="card-base card-glass card-hover p-4">
                <div className="h-32 w-full rounded-md bg-light-muted/10 dark:bg-dark-muted/10 mb-3 flex items-center justify-center text-xs text-light-muted dark:text-dark-muted">
                  Shop Cover
                </div>
                <h3 className="font-semibold mb-1">{s.name}</h3>
                {s.description && (
                  <p className="text-sm text-light-muted dark:text-dark-muted line-clamp-2">{s.description}</p>
                )}
                <a className="btn-primary inline-block mt-3" href={`/shops/${s.slug}`}>View shop</a>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
