import { getDocuments } from 'outstatic/server';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog — AskHoot',
  description: 'Thinking clearly about decisions, choices, and how we choose.',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function BlogIndex() {
  const posts = getDocuments('posts', [
    'title', 'publishedAt', 'slug', 'description', 'coverImage', 'status',
  ]).filter(p => p.status === 'published')
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <div style={{ minHeight: '100vh', background: '#F9F7F4', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');`}</style>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E0DBD3', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 800, color: '#2D6A4F', letterSpacing: '-0.02em' }}>AskHoot</span>
          </Link>
          <Link
            href="/"
            style={{ padding: '8px 18px', background: '#2D6A4F', color: 'white', textDecoration: 'none', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}
          >
            Try it free →
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '56px 24px 88px' }}>
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '36px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            The AskHoot Blog
          </h1>
          <p style={{ fontSize: '16px', color: '#6B6B6B', margin: 0, lineHeight: 1.6 }}>
            Thinking clearly about decisions, choices, and how we choose.
          </p>
        </div>

        {posts.length === 0 ? (
          <p style={{ fontSize: '15px', color: '#9B9B9B' }}>Posts coming soon.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {posts.map(post => (
              <article key={post.slug}>
                <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {post.coverImage && (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '12px', marginBottom: '20px', display: 'block' }}
                    />
                  )}
                  <p style={{ fontSize: '12px', color: '#9B9B9B', margin: '0 0 8px', letterSpacing: '0.03em' }}>
                    {formatDate(post.publishedAt)}
                  </p>
                  <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 10px', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                    {post.title}
                  </h2>
                  {post.description && (
                    <p style={{ fontSize: '15px', color: '#6B6B6B', margin: '0 0 12px', lineHeight: 1.6 }}>
                      {post.description}
                    </p>
                  )}
                  <span style={{ fontSize: '14px', color: '#2D6A4F', fontWeight: 600 }}>Read more →</span>
                </Link>
                <div style={{ height: '1px', background: '#E0DBD3', marginTop: '32px' }} />
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
