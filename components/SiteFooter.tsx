import Link from 'next/link';

/**
 * Minimal site-wide footer — Privacy + Blog links.
 * Lives in app/layout.tsx so it renders on every page.
 * Replace with a richer nav component when ready.
 */
export default function SiteFooter() {
  return (
    <footer style={{
      borderTop: '1px solid #E0DBD3',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '13px',
    }}>
      <Link href="/blog"    style={{ color: '#6B6B6B', textDecoration: 'none' }}>Blog</Link>
      <Link href="/about"   style={{ color: '#6B6B6B', textDecoration: 'none' }}>About</Link>
      <Link href="/privacy" style={{ color: '#6B6B6B', textDecoration: 'none' }}>Privacy</Link>
      <span style={{ color: '#C0B8B0' }} suppressHydrationWarning>© {new Date().getFullYear()} AskHoot</span>
    </footer>
  );
}
