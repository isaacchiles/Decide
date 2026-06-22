'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignInModal() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const supabase = createClient();
  const router = useRouter();

  // Dismiss automatically when the magic link resolves in any tab
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.refresh(); // re-renders server component → modal unmounts
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(26,26,26,0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{
          background: 'white', borderRadius: '24px',
          padding: '44px 40px', maxWidth: '420px', width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          textAlign: 'center',
          animation: 'modalIn 0.22s ease both',
        }}>

          {/* decide wordmark */}
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', fontWeight: 800, color: '#2D6A4F', letterSpacing: '-0.02em' }}>
              decide
            </span>
          </div>

          {/* Free badge */}
          <div style={{ marginBottom: '28px' }}>
            <span style={{ display: 'inline-block', background: '#E8F5EE', color: '#2D6A4F', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '20px' }}>
              Free to use
            </span>
          </div>

          {sent ? (
            <div>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#E8F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 10px' }}>
                Check your email
              </h2>
              <p style={{ fontSize: '15px', color: '#6B6B6B', lineHeight: 1.65, margin: 0 }}>
                We sent a link to <strong style={{ color: '#1A1A1A' }}>{email}</strong>.<br />
                Click it to get started — no password needed.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                style={{ marginTop: '22px', background: 'none', border: 'none', color: '#52B788', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px', lineHeight: 1.2 }}>
                Make great decisions.
              </h1>
              <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 28px', lineHeight: 1.65 }}>
                Sign in to save your decisions, view history, and share results. It&apos;s completely free.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '12px', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.07em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 700, marginBottom: '8px' }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    style={{ width: '100%', padding: '12px 14px', fontSize: '15px', color: '#1A1A1A', background: 'white', border: '1.5px solid #E0DBD3', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}
                  />
                </div>
                {error && <p style={{ fontSize: '13px', color: '#C1121F', margin: '0 0 10px', textAlign: 'left' }}>{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !email}
                  style={{ width: '100%', padding: '14px 24px', background: loading || !email ? '#A8D5BE' : '#2D6A4F', color: 'white', border: 'none', borderRadius: '24px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 700, cursor: loading || !email ? 'not-allowed' : 'pointer', boxShadow: loading || !email ? 'none' : '0 4px 16px rgba(45,106,79,0.25)', transition: 'background 0.15s' }}
                >
                  {loading ? 'Sending…' : 'Send sign-in link'}
                </button>
              </form>

              <p style={{ fontSize: '12px', color: '#9B9B9B', margin: '18px 0 0', lineHeight: 1.5 }}>
                No password needed. We&apos;ll email you a secure link.
              </p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}
