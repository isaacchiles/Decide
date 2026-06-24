'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AuthPage() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const supabase = createClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F9F7F4',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Font imports */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
      `}</style>

      <div style={{
        background: 'white', borderRadius: '20px', padding: '48px 44px',
        maxWidth: '420px', width: '100%',
        boxShadow: '0 4px 28px rgba(0,0,0,0.07)',
        textAlign: 'center',
      }}>
        {/* Wordmark */}
        <div style={{ marginBottom: '32px' }}>
          <span style={{
            fontFamily: "'Fraunces', serif", fontSize: '28px',
            fontWeight: 800, color: '#2D6A4F', letterSpacing: '-0.02em',
          }}>AskHoot</span>
        </div>

        {sent ? (
          /* ── Sent state ── */
          <div>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: '#E8F5EE', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h2 style={{
              fontFamily: "'Fraunces', serif", fontSize: '22px',
              fontWeight: 800, color: '#1A1A1A', margin: '0 0 10px',
            }}>Check your email</h2>
            <p style={{ fontSize: '15px', color: '#6B6B6B', lineHeight: 1.6, margin: 0 }}>
              We sent a sign-in link to <strong style={{ color: '#1A1A1A' }}>{email}</strong>.
              Click it to continue — no password needed.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              style={{
                marginTop: '24px', background: 'none', border: 'none',
                color: '#52B788', fontSize: '14px', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          /* ── Sign-in form ── */
          <div>
            <h1 style={{
              fontFamily: "'Fraunces', serif", fontSize: '26px',
              fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px', lineHeight: 1.2,
            }}>Make great decisions.</h1>
            <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 32px', lineHeight: 1.6 }}>
              Sign in to save your decisions and access them anytime.
            </p>

            <form onSubmit={handleMagicLink}>
              <div style={{ marginBottom: '12px', textAlign: 'left' }}>
                <label style={{
                  display: 'block', fontSize: '11px', letterSpacing: '0.07em',
                  textTransform: 'uppercase', color: '#6B6B6B',
                  fontWeight: 700, marginBottom: '8px',
                }}>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{
                    width: '100%', padding: '12px 14px', fontSize: '15px',
                    color: '#1A1A1A', background: 'white',
                    border: '1.5px solid #E0DBD3', borderRadius: '8px',
                    fontFamily: "'DM Sans', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {error && (
                <p style={{ fontSize: '13px', color: '#C1121F', margin: '0 0 12px', textAlign: 'left' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  width: '100%', padding: '14px 24px',
                  background: loading || !email ? '#A8D5BE' : '#2D6A4F',
                  color: 'white', border: 'none', borderRadius: '24px',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '15px',
                  fontWeight: 700, cursor: loading || !email ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                  boxShadow: loading || !email ? 'none' : '0 4px 16px rgba(45,106,79,0.25)',
                }}
              >
                {loading ? 'Sending…' : 'Send sign-in link'}
              </button>
            </form>

            <p style={{ fontSize: '12px', color: '#9B9B9B', margin: '20px 0 0', lineHeight: 1.5 }}>
              No password needed. We&apos;ll email you a secure link.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
