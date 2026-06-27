import { getDocumentBySlug, getDocumentPaths } from 'outstatic/server';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Pre-render fully at build time — eliminates Next.js streaming ($RS script)
// which causes a known Safari null parentNode crash (React PR #34996 / Next.js 15.6+)
export const dynamic = 'force-static';

type Props = { params: { slug: string } };

export async function generateStaticParams() {
  // Outstatic v2 getDocumentPaths returns Pages-Router-style { params: { slug } }
  // but App Router generateStaticParams expects { slug } — unwrap manually.
  const paths = getDocumentPaths('posts') as Array<{ params: { slug: string } }>;
  return paths.map((p) => ({ slug: p.params.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  const post = getDocumentBySlug('posts', slug, ['title', 'description', 'coverImage']);
  if (!post) return {};
  return {
    title: `${post.title} — AskHoot Blog`,
    description: post.description ?? undefined,
    openGraph: {
      title: post.title,
      description: post.description ?? undefined,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default async function BlogPost({ params }: Props) {
  const { slug } = params;
  const post = getDocumentBySlug('posts', slug, [
    'title', 'publishedAt', 'description', 'coverImage', 'content', 'status',
  ]);

  if (!post || post.status !== 'published') notFound();

  return (
    <div style={{ minHeight: '100vh', background: '#F9F7F4', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .prose { color: #2A2A2A; font-size: 17px; line-height: 1.75; }
        .prose h2 { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 700; color: #1A1A1A; margin: 2em 0 0.75em; letter-spacing: -0.01em; }
        .prose h3 { font-family: 'Fraunces', serif; font-size: 19px; font-weight: 700; color: #1A1A1A; margin: 1.75em 0 0.5em; }
        .prose p  { margin: 0 0 1.25em; }
        .prose ul, .prose ol { padding-left: 1.5em; margin: 0 0 1.25em; }
        .prose li { margin-bottom: 0.4em; }
        .prose a  { color: #2D6A4F; text-decoration: underline; text-underline-offset: 3px; }
        .prose strong { font-weight: 700; color: #1A1A1A; }
        .prose blockquote { border-left: 3px solid #52B788; padding-left: 1.25em; margin: 1.5em 0; color: #555; font-style: italic; }
        .prose code { background: #F0EDE8; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
        .prose hr { border: none; border-top: 1px solid #E0DBD3; margin: 2.5em 0; }
        .prose table { width: 100%; border-collapse: collapse; margin: 1.5em 0; font-size: 15px; }
        .prose th { background: #F0EDE8; font-weight: 600; text-align: left; padding: 10px 14px; border: 1px solid #E0DBD3; }
        .prose td { padding: 10px 14px; border: 1px solid #E0DBD3; vertical-align: top; }
        .prose tr:nth-child(even) td { background: #FDFCFA; }
      `}</style>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E0DBD3', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 800, color: '#2D6A4F', letterSpacing: '-0.02em' }}>AskHoot</span>
          </Link>
          <Link href="/blog" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none', fontWeight: 500 }}>
            ← All posts
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '56px 24px 88px' }}>
        {/* Meta */}
        <p style={{ fontSize: '13px', color: '#9B9B9B', margin: '0 0 16px', letterSpacing: '0.03em' }}>
          {formatDate(post.publishedAt)}
        </p>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '36px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 20px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          {post.title}
        </h1>
        {post.description && (
          <p style={{ fontSize: '18px', color: '#555', margin: '0 0 36px', lineHeight: 1.6, borderBottom: '1px solid #E0DBD3', paddingBottom: '36px' }}>
            {post.description}
          </p>
        )}
        {post.coverImage && (
          <img
            src={post.coverImage}
            alt={post.title}
            style={{ width: '100%', borderRadius: '12px', marginBottom: '40px', display: 'block' }}
          />
        )}

        {/* Body */}
        <div className="prose">
          <MDXRemote source={post.content ?? ''} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
        </div>

        {/* CTA */}
        <div style={{ marginTop: '64px', padding: '32px', background: 'white', borderRadius: '16px', border: '1px solid #E0DBD3', textAlign: 'center' }}>
          <img src="/hoot.png" alt="AskHoot" style={{ width: '52px', height: '52px', objectFit: 'contain', display: 'block', margin: '0 auto 16px' }} />
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px' }}>
            Ready to make a better decision?
          </h3>
          <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 20px', lineHeight: 1.6 }}>
            AskHoot builds a weighted decision matrix from your priorities — so you can choose with confidence.
          </p>
          <Link
            href="/"
            style={{ display: 'inline-block', padding: '13px 28px', background: '#2D6A4F', color: 'white', textDecoration: 'none', borderRadius: '24px', fontSize: '14px', fontWeight: 700, boxShadow: '0 4px 16px rgba(45,106,79,0.25)' }}
          >
            Try AskHoot free →
          </Link>
        </div>
      </div>
    </div>
  );
}
