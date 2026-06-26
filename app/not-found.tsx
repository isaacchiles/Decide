'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

export default function NotFound() {
  const pathname = usePathname();

  useEffect(() => {
    trackEvent('page_not_found', { path: pathname ?? 'unknown' });
  }, [pathname]);

  return (
    <div style={{ minHeight: '100vh', background: '#F9F7F4', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');`}</style>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E0DBD3' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 800, color: '#2D6A4F', letterSpacing: '-0.02em' }}>AskHoot</span>
          </Link>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <img
            src="/hoot.png"
            alt="Hoot"
            style={{ width: '88px', height: '88px', objectFit: 'contain', display: 'block', margin: '0 auto 24px' }}
          />
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Page not found
          </h1>
          <p style={{ fontSize: '15px', color: '#6B6B6B', margin: '0 0 32px', lineHeight: 1.6 }}>
            This link may be broken or the page may have moved. Let&apos;s get you back on track.
          </p>
          <Link
            href="/"
            style={{ display: 'inline-block', padding: '14px 32px', background: '#2D6A4F', color: 'white', textDecoration: 'none', borderRadius: '24px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 700, boxShadow: '0 4px 16px rgba(45,106,79,0.25)' }}
          >
            Start a new decision →
          </Link>
        </div>
      </div>
    </div>
  );
}
