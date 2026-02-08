import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL('https://handmadelovefilled.com'),

  title: {
    default: 'Handmade Love Filled - UAE Handmade Marketplace | Dubai Artisan Crafts',
    template: '%s | Handmade Love Filled'
  },

  description: 'Discover authentic handmade jewelry, crafts, and artisan products from UAE local makers in Dubai, Abu Dhabi, and Sharjah. Support small businesses with unique, handcrafted gifts made with love.',

  keywords: [
    'handmade UAE',
    'Dubai handmade marketplace',
    'UAE artisan crafts',
    'handmade jewelry Dubai',
    'local artisans UAE',
    'handcrafted gifts Dubai',
    'Abu Dhabi handmade',
    'Sharjah crafts',
    'UAE small business',
    'artisan marketplace Dubai',
    'handmade products UAE',
    'local makers Dubai',
    'craft marketplace UAE'
  ],

  authors: [{ name: 'Handmade Love Filled' }],

  openGraph: {
    type: 'website',
    locale: 'en_AE',
    url: 'https://handmadelovefilled.com',
    siteName: 'Handmade Love Filled',
    title: 'Handmade Love Filled - UAE Handmade Marketplace',
    description: 'Discover authentic handmade jewelry, crafts, and artisan products from UAE local makers. Support small businesses with unique handcrafted gifts.',
    images: [
      {
        url: '/logo-400.png',
        width: 400,
        height: 400,
        alt: 'Handmade Love Filled Logo',
      }
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Handmade Love Filled - UAE Handmade Marketplace',
    description: 'Discover authentic handmade jewelry, crafts, and artisan products from UAE local makers.',
    images: ['/logo-400.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: 'https://handmadelovefilled.com',
    languages: {
      'en-AE': 'https://handmadelovefilled.com',
    },
  },
};
