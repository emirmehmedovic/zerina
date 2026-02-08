import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://handmadelovefilled.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/checkout/confirmation/',
          '/_next/',
          '/reset/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
