'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getDecision, type DecisionRecord } from '@/lib/decisions';
import { fetchWikipediaImage } from '@/lib/wikipedia';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function DecisionDetailPage() {
  const [decision, setDecision] = useState<DecisionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [winnerImageUrl, setWinnerImageUrl] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    if (!id) return;
    getDecision(id).then(d => {
      setDecision(d);
      setLoading(false);
    });
  }, [id]);

  // ── Derived scoring values ──
  function computeOptionScore(oi: number): number {
    if (!decision) return 0;
    return decision.criteria.reduce((sum, c, ci) => {
      const s = (decision.scores[oi] ?? {})[ci] ?? 0;
      return sum + (s / 5) * c.weight;
    }, 0);
  }

  const optionScores = decision?.options.map((_, oi) => computeOptionScore(oi)) ?? [];
  const maxScore = Math.max(...optionScores, 0);

  const rankedOptions = (decision?.options ?? [])
    .map((opt, oi) => ({ ...opt, score: optionScores[oi] ?? 0, isWinner: Math.abs((optionScores[oi] ?? 0) - maxScore) < 0.001 && maxScore > 0 }))
    .sort((a, b) => b.score - a.score);

  // ── Share ──

  async function openShareModal() {
    setShareModalOpen(true);
    setWinnerImageUrl(null);

    const img = await fetchWikipediaImage(decision?.winner_name ?? '');
    if (img) setWinnerImageUrl(img);
  }

  async function handleShareAction() {
    if (!decision) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const shareParams = new URLSearchParams({
      winner:   decision.winner_name,
      score:    decision.winner_score?.toFixed(0) ?? '0',
      decision: decision.title,
    });
    if (winnerImageUrl) shareParams.set('img', winnerImageUrl);
    const shareUrl  = `${origin}/share?${shareParams.toString()}`;
    const shareText = `I used Decide to help me ${decision.title.toLowerCase()}. I went with ${decision.winner_name} — scored ${decision.winner_score?.toFixed(0)} out of 100.`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: `I chose ${decision.winner_name} — Decide`, text: shareText, url: shareUrl });
        setShareModalOpen(false);
        return;
      } catch {
        // Cancelled — stay in modal
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText} Try it free: ${shareUrl}`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch { /* silent */ }
  }

  // ── Loading / error states ──

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.8)} }`}</style>
        <div style={{ display: 'flex', gap: '7px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#52B788', animation: `pulse 1.4s ease-in-out ${i * 0.22}s infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!decision) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: '#6B6B6B', marginBottom: '20px' }}>Decision not found.</p>
          <button onClick={() => router.push('/history')} style={{ padding: '12px 28px', background: '#2D6A4F', color: 'white', border: 'none', borderRadius: '20px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            Back to History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9F7F4', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.8)} }
      `}</style>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E0DBD3', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => router.push('/history')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B6B', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500, padding: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            My Decisions
          </button>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 800, color: '#2D6A4F', letterSpacing: '-0.02em' }}>decide</span>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 88px' }}>

        {/* Title + date */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '11px', color: '#9B9B9B', margin: '0 0 6px', letterSpacing: '0.03em' }}>{formatDate(decision.created_at)}</p>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: 800, color: '#1A1A1A', margin: 0, lineHeight: 1.2 }}>{decision.title}</h1>
        </div>

        {/* Winner card */}
        <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #52B788', padding: '28px', marginBottom: '24px', boxShadow: '0 8px 36px rgba(82,183,136,0.12)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #2D6A4F 0%, #52B788 60%, #E9C46A 100%)' }} />
          <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#52B788', fontWeight: 700, marginBottom: '6px' }}>Winner</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', fontWeight: 800, color: '#1A1A1A', margin: 0 }}>{decision.winner_name}</h2>
            <div style={{ textAlign: 'center', background: '#E8F5EE', borderRadius: '10px', padding: '10px 18px', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: 800, color: '#2D6A4F', lineHeight: 1 }}>{decision.winner_score?.toFixed(1)}</div>
              <div style={{ fontSize: '10px', letterSpacing: '0.07em', textTransform: 'uppercase', color: '#52B788', fontWeight: 700, marginTop: '2px' }}>Score</div>
            </div>
          </div>
          {/* Share button */}
          <button
            onClick={openShareModal}
            style={{ width: '100%', padding: '13px', background: '#2D6A4F', color: 'white', border: 'none', borderRadius: '20px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', boxShadow: '0 3px 12px rgba(45,106,79,0.22)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Share This Decision
          </button>
        </div>

        {/* All options ranked */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 700, margin: '0 0 12px' }}>All Options</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rankedOptions.map((opt, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '10px', padding: '14px 18px', border: `1.5px solid ${opt.isWinner ? '#52B788' : '#E0DBD3'}`, display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 800, color: opt.isWinner ? '#2D6A4F' : '#9B9B9B', minWidth: '48px' }}>{opt.score.toFixed(1)}</div>
                <div style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>{opt.name}</div>
                {opt.isWinner && <span style={{ fontSize: '10px', background: '#E8F5EE', color: '#2D6A4F', padding: '3px 10px', borderRadius: '20px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Winner</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Full scoring matrix */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E0DBD3', overflow: 'hidden', marginBottom: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #F2EFE9' }}>
            <h3 style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 700, margin: 0 }}>Scoring Matrix</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif" }}>
              <thead>
                <tr style={{ background: '#F9F7F4' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600, borderBottom: '2px solid #E0DBD3', whiteSpace: 'nowrap' }}>Criteria</th>
                  {decision.options.map((opt, oi) => (
                    <th key={oi} style={{ textAlign: 'center', padding: '12px 16px', fontSize: '14px', color: '#1A1A1A', fontWeight: 700, borderBottom: '2px solid #E0DBD3', whiteSpace: 'nowrap' }}>{opt.name}</th>
                  ))}
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 600, borderBottom: '2px solid #E0DBD3', whiteSpace: 'nowrap' }}>Weight</th>
                </tr>
              </thead>
              <tbody>
                {decision.criteria.map((c, ci) => {
                  const cellScores = decision.options.map((_, oi) => (decision.scores[oi] ?? {})[ci] ?? 0);
                  const maxCell = Math.max(...cellScores, 0);
                  return (
                    <tr key={ci} style={{ borderBottom: '1px solid #F2EFE9' }}>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#1A1A1A' }}>{c.name}</div>
                        <div style={{ fontSize: '11px', color: '#6B6B6B', marginTop: '2px' }}>{c.weight}% weight</div>
                      </td>
                      {decision.options.map((_, oi) => {
                        const score = (decision.scores[oi] ?? {})[ci] ?? 0;
                        const isTop = score === maxCell && maxCell > 0;
                        return (
                          <td key={oi} style={{ padding: '10px 16px', textAlign: 'center', background: isTop ? 'rgba(82,183,136,0.1)' : 'transparent', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                              {[1, 2, 3, 4, 5].map(v => (
                                <div key={v} style={{ width: '12px', height: '12px', borderRadius: '50%', background: v <= score ? '#52B788' : '#E0DBD3', flexShrink: 0 }} />
                              ))}
                            </div>
                          </td>
                        );
                      })}
                      <td style={{ padding: '10px 16px', textAlign: 'center', fontSize: '12px', color: '#6B6B6B', verticalAlign: 'middle' }}>{c.weight}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Criteria rationales */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E0DBD3', padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 700, margin: '0 0 16px' }}>Why These Criteria</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {decision.criteria.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ minWidth: '36px', textAlign: 'right', fontFamily: "'Fraunces', serif", fontSize: '14px', fontWeight: 700, color: '#2D6A4F', paddingTop: '1px' }}>{c.weight}%</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', marginBottom: '2px' }}>{c.name}</div>
                  <div style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.5, fontStyle: 'italic' }}>{c.rationale}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SHARE MODAL ── */}
      {shareModalOpen && (
        <div
          onClick={() => setShareModalOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#F9F7F4', borderRadius: '24px 24px 0 0', padding: '12px 20px 36px', width: '100%', maxWidth: '480px', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
          >
            {/* Drag handle */}
            <div style={{ width: '36px', height: '4px', background: '#D5D0C8', borderRadius: '2px', margin: '0 auto 18px' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Share your decision</h2>
              <button
                onClick={() => setShareModalOpen(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EEEBE6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6B6B', fontSize: '18px', lineHeight: 1 }}
              >×</button>
            </div>

            {/* Share card */}
            <a
              href={typeof window !== 'undefined' ? window.location.origin : '/'}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', borderRadius: '16px', overflow: 'hidden', marginBottom: '18px', textDecoration: 'none' }}
            >
              {/* TOP HALF — photo area */}
              <div style={{ position: 'relative', height: '170px', background: '#1A3C2A', overflow: 'hidden' }}>
                {winnerImageUrl ? (
                  <img
                    src={winnerImageUrl}
                    alt={decision.winner_name}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                  />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1A3C2A 0%, #3A8463 100%)' }} />
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '56px', background: 'linear-gradient(to bottom, transparent, #1E4D35)' }} />
                <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ background: 'white', borderRadius: '20px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2D6A4F' }} />
                    <span style={{ fontFamily: "'Fraunces', serif", fontSize: '14px', fontWeight: 800, color: '#2D6A4F', letterSpacing: '-0.01em' }}>decide</span>
                  </div>
                  <div style={{ background: '#E9C46A', borderRadius: '20px', padding: '5px 12px', display: 'flex', alignItems: 'baseline', gap: '3px', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
                    <span style={{ fontFamily: "'Fraunces', serif", fontSize: '17px', fontWeight: 800, color: '#1A1A1A', lineHeight: 1 }}>{decision.winner_score?.toFixed(1)}</span>
                    <span style={{ fontFamily: "'Fraunces', serif", fontSize: '11px', fontWeight: 700, color: '#1A1A1A' }}>pts</span>
                  </div>
                </div>
              </div>

              {/* BOTTOM HALF */}
              <div style={{ background: 'linear-gradient(160deg, #1E4D35 0%, #2D6A4F 100%)', padding: '14px 18px 20px' }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', fontWeight: 700, marginBottom: '4px', fontFamily: "'DM Sans', sans-serif" }}>MY CHOICE</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '14px' }}>{decision.winner_name}</div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '12px' }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.55, margin: '0 0 10px' }}>
                    I weighed every option against what mattered most to me — and <span style={{ fontWeight: 700, color: 'white' }}>decide</span> helped me make the call with confidence.
                  </p>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>decide.app · weighted decision-making</span>
                </div>
              </div>
            </a>

            <div style={{ marginBottom: '20px' }} />

            {/* Share action */}
            <button
              onClick={handleShareAction}
              style={{ width: '100%', padding: '18px', background: shareCopied ? '#1A3C2A' : '#2D6A4F', color: 'white', border: 'none', borderRadius: '24px', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 18px rgba(45,106,79,0.25)', marginBottom: '12px', transition: 'background 0.15s' } as React.CSSProperties}
            >
              {shareCopied ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Copied to clipboard!
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Share via…
                </>
              )}
            </button>
            <p style={{ fontSize: '13px', color: '#9B9B9B', textAlign: 'center', margin: 0, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
              Uses your device&apos;s native share menu.<br />On desktop, copies text to clipboard.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
