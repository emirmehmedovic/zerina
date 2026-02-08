import { Metadata } from 'next';
import { API_URL } from '@/lib/api';
import ProductDetailClient from './ProductDetailClient';

type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  priceCents: number;
  currency: string;
  stock: number;
  images?: { storageKey: string; altText?: string }[];
  shop?: { id: string; name: string; slug: string };
  categories?: { category: { id: string; name: string } }[];
  variants?: any[];
};

async function fetchProduct(identifier: string): Promise<Product | null> {
  try {
    let res = await fetch(`${API_URL}/api/v1/products/${identifier}?include=shop`, {
      cache: 'no-store',
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      res = await fetch(`${API_URL}/api/v1/products/id/${identifier}?include=shop`, {
        cache: 'no-store',
        next: { revalidate: 3600 }
      });
    }

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Error fetching product:', err);
  }
  return null;
}

export async function generateMetadata({ params }: { params: { identifier: string } }): Promise<Metadata> {
  const product = await fetchProduct(params.identifier);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const imageUrl = product.images?.[0]?.storageKey
    ? `${API_URL}/uploads/${product.images[0].storageKey.split('/').pop()}`
    : '/logo-400.png';

  const categories = product.categories?.map(pc => pc.category.name).join(', ') || '';

  return {
    title: product.title,
    description: product.description?.slice(0, 160) || `Handmade ${product.title} - Shop unique artisan products from UAE local makers.`,
    keywords: [
      'handmade',
      'UAE',
      'Dubai',
      product.title,
      product.shop?.name || '',
      ...categories.split(',').map(c => c.trim()),
    ].filter(Boolean),
    openGraph: {
      title: `${product.title} | Handmade Love Filled`,
      description: product.description?.slice(0, 160) || '',
      url: `https://handmadelovefilled.com/products/${product.slug}`,
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: product.title,
        }
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: product.description?.slice(0, 160) || '',
      images: [imageUrl],
    },
  };
}

function generateProductSchema(product: Product) {
  const imageUrl = product.images?.[0]?.storageKey
    ? `${API_URL}/uploads/${product.images[0].storageKey.split('/').pop()}`
    : 'https://handmadelovefilled.com/logo-400.png';

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: imageUrl,
    offers: {
      '@type': 'Offer',
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: product.currency || 'AED',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://handmadelovefilled.com/products/${product.slug}`,
    },
    brand: {
      '@type': 'Brand',
      name: product.shop?.name || 'Handmade Love Filled',
    },
  };
}

function generateBreadcrumbSchema(product: Product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://handmadelovefilled.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: 'https://handmadelovefilled.com/products',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.title,
        item: `https://handmadelovefilled.com/products/${product.slug}`,
      },
    ],
  };
}

export default async function ProductDetailPage({ params }: { params: { identifier: string } }) {
  const product = await fetchProduct(params.identifier);

  if (!product) {
    return (
      <main>
        <h1 className="text-3xl font-bold mb-6">Product</h1>
        <p className="text-light-muted dark:text-dark-muted">Product not found.</p>
      </main>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateProductSchema(product)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBreadcrumbSchema(product)),
        }}
      />
      <ProductDetailClient initialProduct={product} identifier={params.identifier} />
    </>
  );
}
