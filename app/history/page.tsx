'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { loadDecisions, deleteDecision, type DecisionRecord } from '@/lib/decisions';
import { trackEvent } from '@/lib/analytics';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function HistoryPage() {
  const [decisions, setDecisions]         = useState<DecisionRecord[]>([]);
  const [loading, setLoading]             = useState(true);
  const [deleting, setDeleting]           = useState<string | null>(null);
  const [deleteAccountState, setDeleteAccountState] = useState<'idle' | 'confirm' | 'deleting'>('idle');
  const router = useRouter();

  useEffect(() => {
    loadDecisions().then(data => {
      setDecisions(data);
      setLoading(false);
    });
  }, []);

  async function handleDelete(id: string) {
    setDeleting(id);
    const ok = await deleteDecision(id);
    if (ok) setDecisions(prev => prev.filter(d => d.id !== id));
    setDeleting(null);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  async function handleDeleteAccount() {
    setDeleteAccountState('deleting');
    try {
      const res = await fetch('/api/delete-account', { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      trackEvent('account_deleted');
      // Auth session is now invalid — redirect to home
      router.push('/');
    } catch (err) {
      console.error('Account deletion error:', err);
      setDeleteAccountState('confirm'); // stay in confirm so user can retry
    }
  }

  const drafts    = decisions.filter(d => d.status === 'draft');
  const completed = decisions.filter(d => d.status !== 'draft');

  return (
    <div style={{ minHeight: '100vh', background: '#F9F7F4', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');`}</style>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E0DBD3', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 800, color: '#2D6A4F', letterSpacing: '-0.02em' }}>AskHoot</span>
          </Link>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => router.push('/')}
              style={{ padding: '8px 18px', background: '#2D6A4F', color: 'white', border: 'none', borderRadius: '20px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              + New Decision
            </button>
            <button
              onClick={handleSignOut}
              style={{ padding: '8px 14px', background: 'none', border: '1.5px solid #E0DBD3', borderRadius: '20px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B6B6B', cursor: 'pointer' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 88px' }}>
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '30px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 6px' }}>Your Decisions</h1>
          <p style={{ fontSize: '15px', color: '#6B6B6B', margin: 0 }}>Every decision you&apos;ve saved, in one place.</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', gap: '7px', justifyContent: 'center', padding: '60px 0' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#52B788', animation: `pulse 1.4s ease-in-out ${i * 0.22}s infinite` }} />
            ))}
          </div>
        ) : decisions.length === 0 ? (
          /* Empty state */
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <img src="/hoot.png" alt="Hoot" style={{ width: '88px', height: '88px', objectFit: 'contain', display: 'block', margin: '0 auto 20px' }} />
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px' }}>No decisions yet</h2>
            <p style={{ fontSize: '15px', color: '#6B6B6B', margin: '0 0 28px', lineHeight: 1.6 }}>Make your first decision and save it to see it here.</p>
            <button
              onClick={() => router.push('/')}
              style={{ padding: '14px 32px', background: '#2D6A4F', color: 'white', border: 'none', borderRadius: '24px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(45,106,79,0.25)' }}
            >
              Make your first decision
            </button>
          </div>
        ) : (
          <div>
            {/* ── In-progress drafts ── */}
            {drafts.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 700, margin: '0 0 14px' }}>In Progress</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {drafts.map(d => (
                    <div key={d.id} style={{ background: 'white', borderRadius: '12px', border: '1.5px solid #F0D98A', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                      <div style={{ padding: '18px 22px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '11px', color: '#9B9B9B', margin: '0 0 4px', letterSpacing: '0.03em' }}>{formatDate(d.created_at)}</p>
                            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '17px', fontWeight: 700, color: '#1A1A1A', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {d.title || 'Untitled decision'}
                            </h3>
                          </div>
                          <span style={{ fontSize: '11px', background: '#FEF8E8', color: '#8B6914', padding: '3px 10px', borderRadius: '20px', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap', flexShrink: 0, border: '1px solid #F0D98A' }}>
                            In Progress
                          </span>
                        </div>
                        {/* Constraints / preferences preview */}
                        {((d.constraints ?? []).length > 0 || (d.preferences ?? []).length > 0) && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                            {(d.constraints ?? []).slice(0, 3).map((c, i) => (
                              <span key={i} style={{ fontSize: '11px', background: '#E8F5EE', color: '#2D6A4F', padding: '2px 8px', borderRadius: '20px', fontWeight: 500 }}>{c}</span>
                            ))}
                            {(d.preferences ?? []).slice(0, 2).map((p, i) => (
                              <span key={i} style={{ fontSize: '11px', background: '#FEF8E8', color: '#8B6914', padding: '2px 8px', borderRadius: '20px', fontWeight: 500 }}>{p}</span>
                            ))}
                            {((d.constraints ?? []).length + (d.preferences ?? []).length) > 5 && (
                              <span style={{ fontSize: '11px', color: '#9B9B9B', padding: '2px 4px' }}>
                                +{(d.constraints ?? []).length + (d.preferences ?? []).length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <button
                            onClick={() => router.push(`/?resume=${d.id}`)}
                            style={{ padding: '9px 22px', background: '#E9C46A', color: '#1A1A1A', border: 'none', borderRadius: '20px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            Resume →
                          </button>
                          <button
                            onClick={() => handleDelete(d.id)}
                            disabled={deleting === d.id}
                            style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#C0B8B0', opacity: deleting === d.id ? 0.5 : 1 }}
                            title="Delete draft"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Completed decisions ── */}
            {completed.length > 0 && (
              <div>
                {drafts.length > 0 && (
                  <h2 style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 700, margin: '0 0 14px' }}>Completed</h2>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {completed.map(d => (
                    <div key={d.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #E0DBD3', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                      <Link href={`/history/${d.id}`} style={{ display: 'block', padding: '22px 24px 16px', textDecoration: 'none', color: 'inherit' }}>
                        <p style={{ fontSize: '11px', color: '#9B9B9B', margin: '0 0 4px', letterSpacing: '0.03em' }}>{formatDate(d.created_at)}</p>
                        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '18px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 10px', lineHeight: 1.3 }}>{d.title}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', background: '#E8F5EE', color: '#2D6A4F', padding: '3px 10px', borderRadius: '20px', fontWeight: 600 }}>
                            Winner: {d.winner_name}
                          </span>
                          <span style={{ fontSize: '13px', color: '#6B6B6B' }}>
                            Score {d.winner_score?.toFixed(1)}
                          </span>
                          <span style={{ fontSize: '13px', color: '#6B6B6B' }}>
                            {d.options?.length ?? 0} options · {d.criteria?.length ?? 0} criteria
                          </span>
                        </div>
                      </Link>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 16px 14px' }}>
                        <button
                          onClick={() => handleDelete(d.id)}
                          disabled={deleting === d.id}
                          style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#C0B8B0', opacity: deleting === d.id ? 0.5 : 1 }}
                          title="Delete decision"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Danger zone ── */}
        <div style={{ marginTop: '72px', paddingTop: '32px', borderTop: '1px solid #E0DBD3' }}>
          <h2 style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9B9B9B', fontWeight: 700, margin: '0 0 12px' }}>Account</h2>

          {deleteAccountState === 'idle' && (
            <button
              onClick={() => setDeleteAccountState('confirm')}
              style={{ padding: '9px 18px', background: 'none', border: '1.5px solid #E0DBD3', borderRadius: '20px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B6B6B', cursor: 'pointer' }}
            >
              Delete my account
            </button>
          )}

          {deleteAccountState === 'confirm' && (
            <div style={{ background: '#FFF5F5', border: '1.5px solid #FEC9C9', borderRadius: '12px', padding: '20px 22px' }}>
              <p style={{ fontSize: '14px', color: '#1A1A1A', margin: '0 0 6px', fontWeight: 600 }}>Are you sure?</p>
              <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '0 0 18px', lineHeight: 1.5 }}>
                This permanently deletes your account and all saved decisions. There&apos;s no undo.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleDeleteAccount}
                  style={{ padding: '9px 20px', background: '#C0392B', color: 'white', border: 'none', borderRadius: '20px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Yes, delete everything
                </button>
                <button
                  onClick={() => setDeleteAccountState('idle')}
                  style={{ padding: '9px 18px', background: 'none', border: '1.5px solid #E0DBD3', borderRadius: '20px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B6B6B', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {deleteAccountState === 'deleting' && (
            <div style={{ display: 'flex', gap: '7px', alignItems: 'center', padding: '10px 0' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C0392B', animation: `pulse 1.4s ease-in-out ${i * 0.22}s infinite` }} />
              ))}
              <span style={{ fontSize: '13px', color: '#6B6B6B', marginLeft: '6px' }}>Deleting your account…</span>
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
