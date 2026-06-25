import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about', '/share'],
        disallow: ['/history', '/api/', '/auth/'],
      },
    ],
    sitemap: 'https://askhoot.ai/sitemap.xml',
  };
}
