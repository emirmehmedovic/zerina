import { API_URL } from "@/lib/api";
import StaticImage from "@/components/StaticImage";
import Link from "next/link";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

async function fetchPost(slug: string) {
  const res = await fetch(`${API_URL}/api/v1/blog/${encodeURIComponent(slug)}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug);
  if (!post) {
    return (
      <main className="min-h-screen p-6 sm:p-10">
        <div className="max-w-3xl mx-auto">
          <p className="text-amber-900/70">Post not found.</p>
        </div>
      </main>
    );
  }

  const fileName = post.coverImageStorageKey ? `/uploads/${post.coverImageStorageKey.split('/').pop()}` : null;
  const html = renderMarkdown(String(post.content || ""));

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="relative w-full px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <nav className="mb-4 text-sm text-amber-900/70">
          <Link href="/artisan-chronicles" className="hover:underline">Artisan Chronicles</Link>
          <span className="mx-2">/</span>
          <span className="text-amber-900">{post.title}</span>
        </nav>

        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-amber-900">{post.title}</h1>
          <div className="mt-2 text-sm text-amber-900/70 flex flex-wrap gap-2 items-center">
            {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString()}</span>}
            {post.author?.name && <span>• by {post.author.name}</span>}
            {post.shop?.slug && (
              <>
                <span>•</span>
                <Link href={`/shops/${post.shop.slug}`} className="hover:underline">{post.shop.name}</Link>
              </>
            )}
          </div>
          {Array.isArray(post.tags) && post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((t: string) => (
                <Link key={t} href={`/artisan-chronicles?tag=${encodeURIComponent(t)}`} className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-100">#{t}</Link>
              ))}
            </div>
          )}
        </header>

        {fileName && (
          <div className="relative rounded-2xl overflow-hidden border border-amber-100 bg-white shadow-sm mb-6">
            <div className="relative h-72 w-full">
              <StaticImage fileName={fileName} alt={post.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            </div>
          </div>
        )}

        <article className="prose prose-sm sm:prose lg:prose-lg max-w-none prose-h1:text-amber-900 prose-h2:text-amber-900 prose-h3:text-amber-900 prose-p:text-amber-900/90">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      </div>
    </main>
  );
}
