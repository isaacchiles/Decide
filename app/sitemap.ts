import type { MetadataRoute } from 'next';
import { getDocuments } from 'outstatic/server';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://askhoot.ai';

  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base,              lastModified: new Date(), changeFrequency: 'weekly',  priority: 1 },
    { url: `${base}/about`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${base}/blog`,    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
  ];

  // Blog posts — only published ones
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = getDocuments('posts', ['slug', 'publishedAt', 'status']);
    blogRoutes = posts
      .filter(p => p.status === 'published')
      .map(p => ({
        url: `${base}/blog/${p.slug}`,
        lastModified: new Date(p.publishedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));
  } catch {
    // No posts collection yet — safe to ignore during initial build
  }

  return [...staticRoutes, ...blogRoutes];
}
