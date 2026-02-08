import { MetadataRoute } from 'next';
import { API_URL } from '@/lib/api';

type Product = { slug: string; updatedAt?: string };
type Category = { id: string; slug: string };
type Shop = { slug: string };
type BlogPost = { slug: string; publishedAt?: string; updatedAt?: string };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://handmadelovefilled.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shops`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/artisan-chronicles`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/become-a-seller`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Fetch dynamic content
  let products: Product[] = [];
  let categories: Category[] = [];
  let shops: Shop[] = [];
  let blogPosts: BlogPost[] = [];

  try {
    // Fetch all products (paginated if needed)
    const resProducts = await fetch(`${API_URL}/api/v1/products?take=1000`, {
      cache: 'no-store',
      next: { revalidate: 3600 } // Revalidate every hour
    });
    if (resProducts.ok) {
      const data = await resProducts.json();
      products = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    }

    // Fetch all categories
    const resCategories = await fetch(`${API_URL}/api/v1/categories`, {
      cache: 'no-store',
      next: { revalidate: 86400 } // Revalidate daily
    });
    if (resCategories.ok) {
      const data = await resCategories.json();
      categories = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    }

    // Fetch all shops
    const resShops = await fetch(`${API_URL}/api/v1/shops/public?take=1000`, {
      cache: 'no-store',
      next: { revalidate: 86400 } // Revalidate daily
    });
    if (resShops.ok) {
      const data = await resShops.json();
      shops = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    }

    // Fetch all blog posts
    const resBlog = await fetch(`${API_URL}/api/v1/blog?take=1000`, {
      cache: 'no-store',
      next: { revalidate: 86400 } // Revalidate daily
    });
    if (resBlog.ok) {
      const data = await resBlog.json();
      blogPosts = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    }
  } catch (error) {
    console.error('Error fetching sitemap data:', error);
  }

  // Product pages
  const productPages: MetadataRoute.Sitemap = products
    .filter(p => p.slug)
    .map(product => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  // Category pages (using products filtered by categoryId)
  const categoryPages: MetadataRoute.Sitemap = categories
    .filter(c => c.id)
    .map(category => ({
      url: `${baseUrl}/products?categoryId=${category.id}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

  // Shop pages
  const shopPages: MetadataRoute.Sitemap = shops
    .filter(s => s.slug)
    .map(shop => ({
      url: `${baseUrl}/shops/${shop.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  // Blog pages
  const blogPages: MetadataRoute.Sitemap = blogPosts
    .filter(b => b.slug)
    .map(post => ({
      url: `${baseUrl}/artisan-chronicles/${post.slug}`,
      lastModified: post.publishedAt
        ? new Date(post.publishedAt)
        : post.updatedAt
          ? new Date(post.updatedAt)
          : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

  return [
    ...staticPages,
    ...productPages,
    ...categoryPages,
    ...shopPages,
    ...blogPages,
  ];
}
