'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';
import { saveDecision } from '@/lib/decisions';
import { fetchWikipediaImage } from '@/lib/wikipedia';
import { TEMPLATES, type Template } from '@/lib/templates';

type Criterion = {
  name: string;
  weight: number;
  rationale: string;
};

type Option = {
  name: string;
  source: string;
};

type Scores = Record<number, Record<number, number>>;

const DEMO_CRITERIA: Criterion[] = [
  { name: 'Safety',       weight: 30, rationale: 'Based on your 3-car-seat constraint' },
  { name: 'Reliability',  weight: 25, rationale: 'Aligns with your Toyota preference' },
  { name: 'Total Cost',   weight: 20, rationale: 'Based on your $40,000 budget' },
  { name: 'Cargo Space',  weight: 15, rationale: 'Based on your 3-car-seat constraint' },
  { name: 'Fuel Economy', weight: 10, rationale: 'Based on your electric preference' },
];

const DEMO_OPTIONS: Option[] = [
  { name: 'Toyota 4Runner', source: 'AI suggested' },
  { name: 'Kia Telluride',  source: 'AI suggested' },
];

const DEMO_SCORES: Scores = {
  0: { 0: 4, 1: 4, 2: 3, 3: 3, 4: 2 },
  1: { 0: 5, 1: 3, 2: 4, 3: 5, 4: 3 },
};

export default function DecisionMaker() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [decision, setDecision] = useState('');
  const [constraints, setConstraints] = useState<string[]>([
    'Under $40,000', 'Must fit 3 car seats', 'Electric preferred',
  ]);
  const [preferences, setPreferences] = useState<string[]>([
    'I prefer Toyota', 'I like SUVs', 'Reliability over features',
  ]);
  const [constraintInput, setConstraintInput] = useState('');
  const [preferenceInput, setPreferenceInput] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [criteria, setCriteria] = useState<Criterion[]>(DEMO_CRITERIA);
  const [options, setOptions] = useState<Option[]>(DEMO_OPTIONS);
  const [newOptionInput, setNewOptionInput] = useState('');
  const [scores, setScores] = useState<Scores>(DEMO_SCORES);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [suggestMoreCount, setSuggestMoreCount] = useState(0);
  const [suggestMoreLoading, setSuggestMoreLoading] = useState(false);
  const SUGGEST_MORE_LIMIT = 3;
  const [aiError, setAiError] = useState<'credits_exhausted' | 'overloaded' | 'rate_limited' | 'server_error' | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  type MatrixResult = { criteria: Criterion[]; options: Option[]; _model: string };
  const [compareData, setCompareData] = useState<{ sonnet: MatrixResult; haiku: MatrixResult } | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [winnerImageUrl, setWinnerImageUrl] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // ── Derived values ──────────────────────────────────────────────────────────

  // Detect ?compare=1
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCompareMode(new URLSearchParams(window.location.search).get('compare') === '1');
    }
  }, []);

  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
  const weightValid = totalWeight === 100;
  const displayStep = ({ 1: 1, 3: 2, 4: 3, 5: 4 } as Record<number, number>)[step] || 0;

  // Normalize weights so scores always reflect a true /100 scale,
  // even if the user has adjusted sliders away from 100.
  // Formula: (score/5) × (weight / totalWeight) × 100
  function computeOptionScore(oi: number): number {
    const total = criteria.reduce((s, c) => s + c.weight, 0) || 1;
    return criteria.reduce((sum, c, ci) => {
      return sum + ((scores[oi] ?? {})[ci] ?? 0) / 5 * (c.weight / total) * 100;
    }, 0);
  }

  const optionScores = options.map((_, oi) => computeOptionScore(oi));
  const maxScore     = Math.max(...optionScores, 0);
  const winnerIdx    = optionScores.indexOf(maxScore);
  const winnerOption = options[winnerIdx] ?? options[0];

  const rankedOptions = options
    .map((opt, oi) => ({
      ...opt,
      score: optionScores[oi].toFixed(0),
      rawScore: optionScores[oi],
      isWinner: oi === winnerIdx,
    }))
    .sort((a, b) => b.rawScore - a.rawScore);

  const winnerScores    = scores[winnerIdx] ?? {};
  const contribs        = criteria
    .map((c, ci) => {
      const val = ((winnerScores[ci] ?? 0) / 5) * c.weight;
      return { name: c.name, value: val, label: val.toFixed(1) };
    })
    .sort((a, b) => b.value - a.value);
  const maxContrib      = Math.max(...contribs.map(c => c.value), 0.1);
  const contribsWithBars = contribs.map(c => ({
    ...c,
    barStyle: {
      height: '100%',
      background: 'linear-gradient(90deg, #2D6A4F, #52B788)',
      borderRadius: '4px',
      width: `${(c.value / maxContrib) * 100}%`,
      transition: 'width 0.5s ease',
    } as React.CSSProperties,
  }));

  // ── Handlers ────────────────────────────────────────────────────────────────

  function pickCompareResult(which: 'sonnet' | 'haiku') {
    if (!compareData) return;
    const picked = compareData[which];
    setCriteria(picked.criteria);
    setOptions(picked.options);
    setScores({});
    setCompareData(null);
    trackEvent('matrix_generation_succeeded', {
      criteria_count: picked.criteria.length,
      options_count: picked.options.length,
    });
  }

  async function suggestMoreOptions() {
    if (suggestMoreCount >= SUGGEST_MORE_LIMIT || suggestMoreLoading) return;
    setSuggestMoreLoading(true);
    trackEvent('ai_suggest_more_clicked', { count: suggestMoreCount + 1 });
    try {
      const res = await fetch('/api/suggest-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          constraints,
          preferences,
          existingOptions: options.map(o => o.name),
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.options) && data.options.length > 0) {
        setOptions(prev => [...prev, ...data.options]);
        setSuggestMoreCount(c => c + 1);
      }
    } catch { /* silent */ }
    setSuggestMoreLoading(false);
  }

  function applyTemplate(t: Template) {
    setDecision(t.decision);
    setConstraints(t.constraints);
    setPreferences(t.preferences);
    setActiveTemplate(t.id);
    trackEvent('template_applied', { template_id: t.id });
  }

  async function startLoading() {
    trackEvent('decision_started', {
      has_decision_text: decision.trim().length > 0,
      constraint_count: constraints.length,
      preference_count: preferences.length,
    });

    setStep(2);
    setLoadingStep(0);

    trackEvent('screen_viewed', { screen: 'loading' });
    trackEvent('matrix_generation_started');

    const startTime = Date.now();

    // Run the visual animation in parallel with the API call
    const animationDone = new Promise<void>(resolve =>
      setTimeout(resolve, 2500)
    );
    setTimeout(() => setLoadingStep(1), 500);
    setTimeout(() => setLoadingStep(2), 1050);
    setTimeout(() => setLoadingStep(3), 1650);

    const fetchModel = (model: 'sonnet' | 'haiku') =>
      fetch('/api/generate-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, constraints, preferences, model }),
      }).then(r => r.json());

    type FetchError = 'credits_exhausted' | 'overloaded' | 'server_error';
    let fetchError: FetchError | null = null;

    const apiFetch = compareMode
      ? Promise.all([fetchModel('sonnet'), fetchModel('haiku')])
          .then(([sonnetData, haikuData]) => {
            // If either model returned an error, surface it rather than crashing on .criteria access
            if (sonnetData.error || haikuData.error) {
              fetchError = (sonnetData.error ?? haikuData.error) as FetchError;
              return;
            }
            if (Array.isArray(sonnetData.criteria) && Array.isArray(haikuData.criteria)) {
              setCompareData({ sonnet: sonnetData, haiku: haikuData });
              setCriteria(sonnetData.criteria);
              if (Array.isArray(sonnetData.options)) { setOptions(sonnetData.options); setScores({}); }
            }
          })
          .catch(() => { fetchError = 'server_error'; })
      : fetchModel('sonnet')
          .then(data => {
            if (data.error) {
              fetchError = data.error as FetchError;
              trackEvent('matrix_generation_failed', { duration_ms: Date.now() - startTime, error: data.error });
              return;
            }
            if (Array.isArray(data.criteria)) setCriteria(data.criteria);
            if (Array.isArray(data.options)) { setOptions(data.options); setScores({}); }
            trackEvent('matrix_generation_succeeded', {
              duration_ms: Date.now() - startTime,
              criteria_count: data.criteria?.length ?? 0,
              options_count: data.options?.length ?? 0,
            });
          })
          .catch(() => {
            fetchError = 'server_error';
            trackEvent('matrix_generation_failed', { duration_ms: Date.now() - startTime });
          });

    // Wait for both animation and API, then either show error or advance to Screen 3
    await Promise.all([animationDone, apiFetch]);
    if (fetchError) {
      setAiError(fetchError);
      // Stay on step 2 so the error renders in the loading screen container
    } else {
      setStep(3);
      trackEvent('screen_viewed', { screen: compareMode ? 'matrix_compare' : 'matrix' });
    }
  }

  function goBack() {
    if (step === 3) setStep(1);
    else if (step > 1) setStep(step - 1);
  }

  function addConstraint() {
    const v = constraintInput.trim();
    if (v) {
      setConstraints(prev => [...prev, v]);
      setConstraintInput('');
      trackEvent('constraint_added', { total: constraints.length + 1 });
    }
  }

  function addPreference() {
    const v = preferenceInput.trim();
    if (v) {
      setPreferences(prev => [...prev, v]);
      setPreferenceInput('');
      trackEvent('preference_added', { total: preferences.length + 1 });
    }
  }

  function addOption() {
    const v = newOptionInput.trim();
    if (v) {
      setOptions(prev => [...prev, { name: v, source: 'You added' }]);
      setNewOptionInput('');
      trackEvent('option_added', { total: options.length + 1 });
    }
  }

  function updateCriterionWeight(i: number, value: number) {
    setCriteria(prev => {
      const next = [...prev];
      next[i] = { ...next[i], weight: value };
      return next;
    });
    // Track that weights were adjusted (criterion index only, not name)
    trackEvent('criteria_weight_adjusted', {
      criterion_index: i,
      new_weight: value,
      total_weight: criteria.reduce((s, c, idx) => s + (idx === i ? value : c.weight), 0),
    });
  }

  function updateScore(oi: number, ci: number, v: number) {
    // Read current value first so we can compute the toggle outside the updater
    setScores(prev => {
      const cur = (prev[oi] ?? {})[ci] ?? 0;
      const newVal = v === cur ? 0 : v;
      return {
        ...prev,
        [oi]: { ...(prev[oi] ?? {}), [ci]: newVal },
      };
    });
    // trackEvent must live outside the updater — updaters must be pure
    // (React may call them twice in StrictMode / concurrent rendering)
    const cur = (scores[oi] ?? {})[ci] ?? 0;
    trackEvent('score_set', {
      option_index: oi,
      criterion_index: ci,
      score: v === cur ? 0 : v,
    });
  }

  function restart() {
    trackEvent('decision_restarted');
    setStep(1);
    setLoadingStep(0);
    setCriteria(DEMO_CRITERIA);
    setOptions(DEMO_OPTIONS);
    setScores({});
    setDecision('');
    setConstraints([]);
    setPreferences([]);
    setActiveTemplate(null);
    setSuggestMoreCount(0);
    setCompareData(null);
    setAiError(null);
    setSavedId(null);
    setSaveError(false);
    setScoringLoading(false);
    setShareModalOpen(false);
    setWinnerImageUrl(null);
    setShareCopied(false);
  }

  async function handleSave() {
    if (saving || savedId) return;
    setSaving(true);
    setSaveError(false);

    const result = await saveDecision({
      title:       decision.trim() || 'Untitled decision',
      criteria,
      options,
      scores,
      winner_name:  winnerOption?.name ?? '',
      winner_score: maxScore,
    });

    setSaving(false);
    if (result) {
      setSavedId(result.id);
      trackEvent('decision_saved', { winner_score: Math.round(maxScore * 10) / 10 });
    } else {
      setSaveError(true);
    }
  }

  // Auto-save when reaching the results screen (only for real decisions, not demo)
  useEffect(() => {
    if (step === 5 && decision.trim()) {
      handleSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function startScoring() {
    trackEvent('scoring_started', { options_count: options.length, criteria_count: criteria.length, weight_valid: weightValid });
    setScoringLoading(true);

    try {
      const res = await fetch('/api/suggest-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, criteria, options }),
      });
      const data = await res.json();
      if (data.scores && Object.keys(data.scores).length > 0) {
        setScores(data.scores);
        trackEvent('ai_scores_applied', { options_count: options.length, criteria_count: criteria.length });
      }
    } catch {
      // Silently proceed — user can score manually
    }

    setScoringLoading(false);
    setStep(4);
  }

  async function openShareModal() {
    setShareModalOpen(true);
    setWinnerImageUrl(null);
    const img = await fetchWikipediaImage(winnerOption?.name ?? '');
    if (img) setWinnerImageUrl(img);
  }

  async function handleShareAction() {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    // Build the /share URL — OG meta tags on that page generate the rich card preview
    const shareParams = new URLSearchParams({
      winner:   winnerOption?.name ?? '',
      score:    maxScore.toFixed(0),
      decision: decision.trim(),
    });
    if (winnerImageUrl) shareParams.set('img', winnerImageUrl);
    const shareUrl  = `${origin}/share?${shareParams.toString()}`;
    const shareText = `I used Decide to help me ${decision.trim().toLowerCase()}. I went with ${winnerOption?.name} — scored ${maxScore.toFixed(0)} out of 100.`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: `I chose ${winnerOption?.name} — Decide`, text: shareText, url: shareUrl });
        trackEvent('decision_shared', { method: 'native' });
        setShareModalOpen(false);
        return;
      } catch {
        // Cancelled — stay in modal
      }
    }

    // Desktop clipboard fallback — include the full URL
    try {
      await navigator.clipboard.writeText(`${shareText} Try it free: ${shareUrl}`);
      setShareCopied(true);
      trackEvent('decision_shared', { method: 'clipboard' });
      setTimeout(() => setShareCopied(false), 2500);
    } catch { /* silent */ }
  }

  // ── Scoring table (React.createElement to mirror original approach) ─────────

  function buildScoringTable() {
    const e  = React.createElement;
    const tf: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

    const totals   = options.map((_, oi) => computeOptionScore(oi));
    const maxTotal = Math.max(...totals, 0);

    function DotRow(oi: number, ci: number) {
      const cur = (scores[oi] ?? {})[ci] ?? 0;
      return e(
        'div',
        { style: { display: 'flex', gap: '5px', justifyContent: 'center' } },
        [1, 2, 3, 4, 5].map(v =>
          e('button', {
            key: v,
            onClick: () => updateScore(oi, ci, v),
            title: `${v} of 5`,
            style: {
              width: '13px', height: '13px', borderRadius: '50%',
              border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0,
              background: v <= cur ? '#52B788' : '#E0DBD3',
              transition: 'background 0.12s',
            } as React.CSSProperties,
          }),
        ),
      );
    }

    const headerCells = [
      e('th', {
        key: 'label',
        style: {
          ...tf, textAlign: 'left', padding: '12px 16px', fontSize: '11px',
          letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B6B6B',
          fontWeight: 600, borderBottom: '2px solid #E0DBD3', background: '#F9F7F4',
          whiteSpace: 'nowrap',
        } as React.CSSProperties,
      }, 'Criteria'),
      ...options.map((opt, oi) =>
        e('th', {
          key: oi,
          style: {
            ...tf, textAlign: 'center', padding: '12px 16px', fontSize: '14px',
            color: '#1A1A1A', fontWeight: 700, borderBottom: '2px solid #E0DBD3',
            background: '#F9F7F4', whiteSpace: 'nowrap',
          } as React.CSSProperties,
        }, opt.name),
      ),
      e('th', {
        key: 'weight',
        style: {
          ...tf, textAlign: 'center', padding: '12px 16px', fontSize: '11px',
          letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B6B6B',
          fontWeight: 600, borderBottom: '2px solid #E0DBD3', background: '#F9F7F4',
          whiteSpace: 'nowrap',
        } as React.CSSProperties,
      }, 'Weight'),
    ];

    const bodyRows = criteria.map((c, ci) => {
      const cellScores = options.map((_, oi) => (scores[oi] ?? {})[ci] ?? 0);
      const maxCell    = Math.max(...cellScores, 0);

      return e('tr', { key: ci, style: { borderBottom: '1px solid #F2EFE9' } },
        e('td', { style: { ...tf, padding: '12px 16px', whiteSpace: 'nowrap', verticalAlign: 'middle' } as React.CSSProperties },
          e('div', { style: { fontWeight: 600, fontSize: '14px', color: '#1A1A1A' } }, c.name),
          e('div', { style: { fontSize: '11px', color: '#6B6B6B', marginTop: '2px' } }, `${c.weight}% weight`),
        ),
        ...options.map((_, oi) => {
          const cs    = (scores[oi] ?? {})[ci] ?? 0;
          const isTop = cs === maxCell && maxCell > 0;
          return e('td', {
            key: oi,
            style: {
              padding: '10px 16px', textAlign: 'center',
              background: isTop ? 'rgba(82,183,136,0.1)' : 'transparent',
              verticalAlign: 'middle', transition: 'background 0.2s',
            } as React.CSSProperties,
          }, DotRow(oi, ci));
        }),
        e('td', {
          style: { ...tf, padding: '10px 16px', textAlign: 'center', fontSize: '12px', color: '#6B6B6B', verticalAlign: 'middle' } as React.CSSProperties,
        }, `${c.weight}%`),
      );
    });

    const totalRow = e('tr', { style: { background: '#F9F7F4', borderTop: '2px solid #E0DBD3' } },
      e('td', { style: { ...tf, padding: '16px', fontWeight: 700, fontSize: '14px', color: '#1A1A1A' } as React.CSSProperties }, 'Total Score'),
      ...options.map((_, oi) => {
        const sc       = totals[oi];
        const isWinner = Math.abs(sc - maxTotal) < 0.001 && maxTotal > 0;
        return e('td', { key: oi, style: { padding: '14px 16px', textAlign: 'center' } as React.CSSProperties },
          e('div', { style: { display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '3px' } as React.CSSProperties },
            e('span', {
              style: {
                fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: 800,
                color: isWinner ? '#2D6A4F' : '#1A1A1A', lineHeight: 1,
              } as React.CSSProperties,
            }, sc.toFixed(1)),
            isWinner
              ? e('span', {
                  style: {
                    fontSize: '10px', background: '#E8F5EE', color: '#2D6A4F',
                    padding: '2px 7px', borderRadius: '10px', letterSpacing: '0.04em',
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 700, textTransform: 'uppercase',
                  } as React.CSSProperties,
                }, 'Winner')
              : null,
          ),
        );
      }),
      e('td', { key: 'empty' }),
    );

    return e(
      'div',
      { style: { overflowX: 'auto', borderRadius: '12px', border: '1px solid #E0DBD3', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } },
      e('table', { style: { width: '100%', borderCollapse: 'collapse', minWidth: '380px' } as React.CSSProperties },
        e('thead', null, e('tr', null, ...headerCells)),
        e('tbody', null, ...bodyRows, totalRow),
      ),
    );
  }

  // ── Shared style objects ────────────────────────────────────────────────────

  const weightBadgeStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center',
    padding: '5px 12px', borderRadius: '20px',
    fontSize: '12px', fontWeight: 700, letterSpacing: '0.02em',
    background: weightValid ? '#E8F5EE' : '#FDEAEA',
    color:      weightValid ? '#2D6A4F' : '#C1121F',
    flexShrink: 0, whiteSpace: 'nowrap',
  };

  const stepProgressStyle: React.CSSProperties = {
    height: '100%', background: '#2D6A4F',
    width: `${(displayStep / 4) * 100}%`,
    transition: 'width 0.4s ease', borderRadius: '0 2px 2px 0',
  };

  // ── Screen view tracking via React.useEffect ────────────────────────────────

  React.useEffect(() => {
    const screenMap: Record<number, string> = {
      1: 'input',
      3: 'matrix',
      4: 'scoring',
      5: 'recommendation',
    };
    const name = screenMap[step];
    if (name) trackEvent('screen_viewed', { screen: name });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#F9F7F4', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── STICKY HEADER (all screens except loading) ── */}
      {step !== 2 && (
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'white', borderBottom: '1px solid #E0DBD3' }}>
          <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '68px', flexShrink: 0 }}>
              {step > 1 && (
                <button onClick={goBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B6B', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500, padding: '6px 0' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back
                </button>
              )}
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <span style={{ fontSize: '13px', color: '#6B6B6B', fontWeight: 600, letterSpacing: '0.03em' }}>
                Step {displayStep} of 4
              </span>
            </div>
            <div style={{ width: '68px', textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => router.push('/history')}
                title="Your decision history"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B6B', padding: '4px', display: 'flex', alignItems: 'center' }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                </svg>
              </button>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: '17px', fontWeight: 700, color: '#2D6A4F', letterSpacing: '-0.02em' }}>decide</span>
            </div>
          </div>
          <div style={{ height: '3px', background: '#E0DBD3' }}>
            <div style={stepProgressStyle} />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* SCREEN 1 — What are we deciding?           */}
      {/* ══════════════════════════════════════════ */}
      {step === 1 && (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '56px 24px 88px' }}>
          <div style={{ marginBottom: '44px' }}>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '38px', fontWeight: 800, color: '#1A1A1A', lineHeight: 1.12, margin: '0 0 14px' }}>
              Let&apos;s make a great<br />decision together.
            </h1>
            <p style={{ fontSize: '15px', color: '#6B6B6B', lineHeight: 1.65, margin: 0 }}>
              Tell me what you&apos;re deciding. The more you share, the sharper your recommendation.
            </p>
          </div>

          {/* Template picker */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.07em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 700, marginBottom: '10px' }}>
              Start from a template
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t)}
                  title={t.description}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '7px 14px', borderRadius: '20px', border: '1.5px solid',
                    borderColor: activeTemplate === t.id ? '#2D6A4F' : '#E0DBD3',
                    background: activeTemplate === t.id ? '#E8F5EE' : 'white',
                    color: activeTemplate === t.id ? '#2D6A4F' : '#1A1A1A',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <span>{t.emoji}</span>
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Decision textarea */}
          <div style={{ marginBottom: '36px' }}>
            <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.07em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 700, marginBottom: '8px' }}>
              The Decision
            </label>
            <textarea
              value={decision}
              onChange={e => setDecision(e.target.value)}
              placeholder="e.g. I need to buy a family car"
              rows={3}
              style={{ width: '100%', padding: '14px 16px', fontSize: '15px', lineHeight: 1.65, color: '#1A1A1A', background: 'white', border: '1.5px solid #E0DBD3', borderRadius: '8px', resize: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            />
          </div>

          {/* Constraints */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', letterSpacing: '0.07em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 700 }}>Constraints</label>
              <span style={{ fontSize: '12px', color: '#6B6B6B', fontStyle: 'italic' }}>Deal-breakers &amp; must-haves</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', minHeight: '34px' }}>
              {constraints.map((text, i) => (
                <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#E8F5EE', border: '1px solid #A8D5BE', borderRadius: '20px', padding: '6px 8px 6px 14px', fontSize: '13px', color: '#2D6A4F', fontWeight: 500 }}>
                  <span>{text}</span>
                  <button
                    onClick={() => setConstraints(prev => prev.filter((_, j) => j !== i))}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(45,106,79,0.14)', border: 'none', cursor: 'pointer', color: '#2D6A4F', fontSize: '14px', lineHeight: 1, padding: 0, flexShrink: 0 }}
                  >×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={constraintInput}
                onChange={e => setConstraintInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addConstraint()}
                placeholder="Add a constraint..."
                style={{ flex: 1, padding: '10px 14px', fontSize: '14px', color: '#1A1A1A', background: 'white', border: '1.5px solid #E0DBD3', borderRadius: '8px' }}
              />
              <button onClick={addConstraint} style={{ padding: '10px 18px', background: '#2D6A4F', color: 'white', border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add
              </button>
            </div>
          </div>

          {/* Preferences */}
          <div style={{ marginBottom: '52px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', letterSpacing: '0.07em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 700 }}>Preferences</label>
              <span style={{ fontSize: '12px', color: '#6B6B6B', fontStyle: 'italic' }}>Nice-to-haves &amp; leanings</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', minHeight: '34px' }}>
              {preferences.map((text, i) => (
                <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FEF8E8', border: '1px solid #F0D98A', borderRadius: '20px', padding: '6px 8px 6px 14px', fontSize: '13px', color: '#8B6914', fontWeight: 500 }}>
                  <span>{text}</span>
                  <button
                    onClick={() => setPreferences(prev => prev.filter((_, j) => j !== i))}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(139,105,20,0.14)', border: 'none', cursor: 'pointer', color: '#8B6914', fontSize: '14px', lineHeight: 1, padding: 0, flexShrink: 0 }}
                  >×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={preferenceInput}
                onChange={e => setPreferenceInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addPreference()}
                placeholder="Add a preference..."
                style={{ flex: 1, padding: '10px 14px', fontSize: '14px', color: '#1A1A1A', background: 'white', border: '1.5px solid #E0DBD3', borderRadius: '8px' }}
              />
              <button onClick={addPreference} style={{ padding: '10px 18px', background: '#E9C46A', color: '#1A1A1A', border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add
              </button>
            </div>
          </div>

          <button onClick={startLoading} style={{ width: '100%', padding: '18px 24px', background: '#2D6A4F', color: 'white', border: 'none', borderRadius: '24px', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', letterSpacing: '0.01em', boxShadow: '0 4px 20px rgba(45,106,79,0.28)' }}>
            Build My Decision Matrix
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* SCREEN 2 — AI Building Matrix (loading)   */}
      {/* ══════════════════════════════════════════ */}
      {step === 2 && (
        <div style={{ minHeight: '100vh', background: '#F2EFE9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '52px 44px', maxWidth: '440px', width: '100%', boxShadow: '0 4px 28px rgba(0,0,0,0.07)', textAlign: 'center' }}>

            {aiError ? (
              /* ── Error state ── */
              <>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 10px' }}>
                  {aiError === 'credits_exhausted' ? 'Out of AI credits' :
                   aiError === 'overloaded'        ? 'AI is overloaded' :
                   aiError === 'rate_limited'      ? 'Daily limit reached' :
                                                     'Something went wrong'}
                </h2>
                <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 28px', lineHeight: 1.65 }}>
                  {aiError === 'credits_exhausted'
                    ? 'The app has run out of API credits. Try again in a bit.'
                    : aiError === 'overloaded'
                    ? 'Claude is experiencing high demand right now. Wait a moment and try again.'
                    : aiError === 'rate_limited'
                    ? 'You\'ve hit the daily limit for AI requests. Come back tomorrow to continue making decisions.'
                    : 'The AI couldn\'t generate your matrix. Please try again.'}
                </p>
                <button
                  onClick={() => { setAiError(null); setStep(1); }}
                  style={{ padding: '13px 32px', background: '#2D6A4F', color: 'white', border: 'none', borderRadius: '24px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Try again
                </button>
              </>
            ) : (
              /* ── Normal loading state ── */
              <>
                <div style={{ display: 'flex', gap: '7px', justifyContent: 'center', marginBottom: '32px' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#52B788', animation: `pulse 1.4s ease-in-out ${i * 0.22}s infinite` }} />
                  ))}
                </div>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 36px', lineHeight: 1.25 }}>
                  Thinking through your<br />decision...
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                  {[
                    'Understanding your constraints',
                    'Identifying what matters most',
                    'Designing your criteria weights',
                  ].map((text, i) =>
                    loadingStep >= i + 1 && (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', animation: 'fadeInUp 0.4s ease both' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#E8F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span style={{ fontSize: '15px', color: '#1A1A1A', fontWeight: 500 }}>{text}</span>
                      </div>
                    ),
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* SCREEN 3 — Decision Matrix                 */}
      {/* ══════════════════════════════════════════ */}
      {step === 3 && (
        <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '48px 24px 88px' }}>

          {/* ── Compare Mode Panel ── */}
          {compareData && (
            <div style={{ marginBottom: '40px' }}>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FFF8E1', color: '#B45309', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '20px', marginBottom: '12px' }}>
                  🧪 Compare Mode
                </span>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 6px', lineHeight: 1.2 }}>Sonnet vs Haiku</h2>
                <p style={{ fontSize: '14px', color: '#6B6B6B', margin: 0 }}>Both models ran on the same input. Pick the criteria you prefer to continue with.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '8px' }}>
                {(['sonnet', 'haiku'] as const).map(model => {
                  const result = compareData[model];
                  const label = model === 'sonnet' ? 'Claude Sonnet 4.6' : 'Claude Haiku 4.5';
                  const accent = model === 'sonnet' ? '#2D6A4F' : '#1D4ED8';
                  const accentLight = model === 'sonnet' ? '#E8F5EE' : '#EFF6FF';
                  return (
                    <div key={model} style={{ background: 'white', borderRadius: '14px', border: `2px solid ${accentLight}`, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: accent, marginBottom: '2px' }}>{label}</div>
                          <div style={{ fontSize: '13px', color: '#6B6B6B' }}>{result.criteria.length} criteria generated</div>
                        </div>
                        <button
                          onClick={() => pickCompareResult(model)}
                          style={{ padding: '9px 20px', background: accent, color: 'white', border: 'none', borderRadius: '20px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Use this →
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {result.criteria.map((c: Criterion, i: number) => (
                          <div key={i}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A' }}>{c.name}</span>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: accent }}>{c.weight}%</span>
                            </div>
                            <div style={{ height: '5px', background: '#F2EFE9', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: accent, borderRadius: '3px', width: `${c.weight}%`, opacity: 0.7 }} />
                            </div>
                            <p style={{ fontSize: '11px', color: '#6B6B6B', margin: '4px 0 0', fontStyle: 'italic', lineHeight: 1.4 }}>{c.rationale}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ borderBottom: '1.5px solid #E0DBD3', margin: '32px 0' }} />
              <p style={{ fontSize: '13px', color: '#9B9B9B', margin: 0 }}>Picking a model loads its criteria into the matrix below — you can still edit weights before scoring.</p>
            </div>
          )}

          <div style={{ marginBottom: '36px' }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '30px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px', lineHeight: 1.15 }}>Your Decision Matrix</h2>
            <p style={{ fontSize: '15px', color: '#6B6B6B', lineHeight: 1.6, margin: 0 }}>Adjust criteria weights to match your real priorities, then manage your options.</p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '36px' }}>
            {/* LEFT: Criteria & Weights */}
            <div style={{ flex: 1, minWidth: '300px', background: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #E0DBD3' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '19px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px' }}>Criteria &amp; Weights</h3>
                  <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0 }}>AI-suggested — adjust to your priorities</p>
                </div>
                <div style={weightBadgeStyle}>Total: {totalWeight}%</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {criteria.map((c, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>{c.name}</span>
                      <span style={{ fontFamily: "'Fraunces', serif", fontSize: '16px', fontWeight: 700, color: '#2D6A4F', minWidth: '44px', textAlign: 'right' }}>{c.weight}%</span>
                    </div>
                    <div style={{ height: '7px', background: '#F2EFE9', borderRadius: '4px', marginBottom: '9px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#52B788', borderRadius: '4px', width: `${c.weight}%`, transition: 'width 0.1s' }} />
                    </div>
                    <input
                      type="range" min="0" max="60" step="1"
                      value={c.weight}
                      onChange={e => updateCriterionWeight(i, Number(e.target.value))}
                    />
                    <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '6px 0 0', fontStyle: 'italic', lineHeight: 1.5 }}>{c.rationale}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Options */}
            <div style={{ flex: 1, minWidth: '300px', background: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #E0DBD3' }}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '19px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px' }}>Your Options</h3>
                <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0 }}>AI-suggested a starting point — add your own too</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {options.map((opt, i) => (
                  <div key={i} style={{ padding: '14px 16px', background: '#F9F7F4', borderRadius: '10px', border: '1.5px solid #E0DBD3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>{opt.name}</span>
                    <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '20px', background: '#E8F5EE', color: '#2D6A4F', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap', flexShrink: 0 }}>{opt.source}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  value={newOptionInput}
                  onChange={e => setNewOptionInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addOption()}
                  placeholder="Add your own option..."
                  style={{ flex: 1, padding: '10px 14px', fontSize: '14px', color: '#1A1A1A', background: 'white', border: '1.5px solid #E0DBD3', borderRadius: '8px' }}
                />
                <button onClick={addOption} style={{ padding: '10px 18px', background: '#2D6A4F', color: 'white', border: 'none', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>+ Add</button>
              </div>
              {suggestMoreCount < SUGGEST_MORE_LIMIT ? (
                <button
                  onClick={suggestMoreOptions}
                  disabled={suggestMoreLoading}
                  style={{ width: '100%', padding: '12px', background: 'none', border: '1.5px dashed #A8D5BE', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: suggestMoreLoading ? '#A8D5BE' : '#52B788', cursor: suggestMoreLoading ? 'default' : 'pointer', fontWeight: 500 }}
                >
                  {suggestMoreLoading ? 'Finding options…' : `✦ Let AI suggest more → (${SUGGEST_MORE_LIMIT - suggestMoreCount} left)`}
                </button>
              ) : (
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#9B9B9B', margin: '8px 0 0', fontStyle: 'italic' }}>
                  Max suggestions reached — add your own above.
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {scoringLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 32px', background: '#F9F7F4', borderRadius: '24px', border: '1.5px solid #E0DBD3' }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#52B788', animation: `pulse 1.4s ease-in-out ${i * 0.22}s infinite` }} />
                  ))}
                </div>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#2D6A4F', fontWeight: 600 }}>AI is scoring your options…</span>
              </div>
            ) : (
              <button onClick={startScoring} style={{ padding: '16px 44px', background: '#2D6A4F', color: 'white', border: 'none', borderRadius: '24px', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(45,106,79,0.28)', letterSpacing: '0.01em' }}>
                Score My Options
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* SCREEN 4 — Score Each Option               */}
      {/* ══════════════════════════════════════════ */}
      {step === 4 && (
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px 88px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '30px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px', lineHeight: 1.15 }}>Score Each Option</h2>
            <p style={{ fontSize: '15px', color: '#6B6B6B', lineHeight: 1.6, margin: 0 }}>Tap the dots to rate 1–5. The best score in each row highlights automatically.</p>
          </div>
          {buildScoringTable()}
          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => { trackEvent('recommendation_viewed', { winner_index: winnerIdx, max_score: parseFloat(maxScore.toFixed(1)) }); setStep(5); }} style={{ padding: '16px 44px', background: '#2D6A4F', color: 'white', border: 'none', borderRadius: '24px', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(45,106,79,0.28)', letterSpacing: '0.01em' }}>
              See My Recommendation
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* SCREEN 5 — Recommendation                  */}
      {/* ══════════════════════════════════════════ */}
      {step === 5 && (
        <div style={{ maxWidth: '660px', margin: '0 auto', padding: '48px 24px 88px' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#52B788', fontWeight: 700, margin: '0 0 10px' }}>Decision Complete</p>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '34px', fontWeight: 800, color: '#1A1A1A', margin: 0, lineHeight: 1.12 }}>Based on your priorities...</h2>
          </div>

          {/* Winner card */}
          <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #52B788', padding: '32px', marginBottom: '28px', boxShadow: '0 8px 36px rgba(82,183,136,0.16)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #2D6A4F 0%, #52B788 60%, #E9C46A 100%)' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#52B788', fontWeight: 700, marginBottom: '6px' }}>Our Recommendation</div>
                <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '30px', fontWeight: 800, color: '#1A1A1A', margin: 0, lineHeight: 1.1 }}>{winnerOption?.name}</h3>
              </div>
              <div style={{ textAlign: 'center', background: '#E8F5EE', borderRadius: '12px', padding: '14px 22px', flexShrink: 0 }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: '36px', fontWeight: 800, color: '#2D6A4F', lineHeight: 1 }}>{maxScore.toFixed(1)}</div>
                <div style={{ fontSize: '10px', letterSpacing: '0.07em', textTransform: 'uppercase', color: '#52B788', fontWeight: 700, marginTop: '3px' }}>Score</div>
              </div>
            </div>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#1A1A1A', margin: 0, padding: '16px 18px', background: '#F9F7F4', borderRadius: '8px', borderLeft: '3px solid #52B788' }}>
              <strong>{winnerOption?.name}</strong> scored highest based on your weighted priorities. Review the breakdown below to see exactly what drove the outcome.
            </p>
          </div>

          {/* Ranked comparison */}
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 700, margin: '0 0 14px' }}>All Options Ranked</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rankedOptions.map((opt, i) => (
                <div key={i} style={{ background: 'white', borderRadius: '10px', padding: '14px 18px', border: '1.5px solid #E0DBD3', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 800, color: '#2D6A4F', minWidth: '52px', lineHeight: 1 }}>{opt.score}</div>
                  <div style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>{opt.name}</div>
                  {opt.isWinner && (
                    <span style={{ fontSize: '10px', background: '#E8F5EE', color: '#2D6A4F', padding: '3px 10px', borderRadius: '20px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>Winner</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Criteria impact chart */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px 26px', border: '1px solid #E0DBD3', marginBottom: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h4 style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B', fontWeight: 700, margin: '0 0 20px' }}>How the Weights Shaped This</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {contribsWithBars.map((bar, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#1A1A1A', fontWeight: 500 }}>{bar.name}</span>
                    <span style={{ fontFamily: "'Fraunces', serif", fontSize: '14px', color: '#2D6A4F', fontWeight: 700 }}>{bar.label}</span>
                  </div>
                  <div style={{ height: '8px', background: '#F2EFE9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={bar.barStyle} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save error notice (only shown if auto-save failed) */}
          {saveError && (
            <div
              onClick={handleSave}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px', background: '#FDEAEA', border: '1.5px solid #F5A0A0', borderRadius: '10px', marginBottom: '16px', cursor: 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C1121F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#C1121F', fontWeight: 500 }}>
                Couldn&apos;t save — tap to retry
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Share button — primary CTA on results */}
            {decision.trim() && (
              <button
                onClick={openShareModal}
                style={{ padding: '16px', background: '#2D6A4F', color: 'white', border: 'none', borderRadius: '24px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 18px rgba(45,106,79,0.22)', letterSpacing: '0.01em' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Share My Decision
              </button>
            )}
            <button onClick={restart} style={{ padding: '14px', background: decision.trim() ? 'white' : '#2D6A4F', color: decision.trim() ? '#1A1A1A' : 'white', border: decision.trim() ? '1.5px solid #E0DBD3' : 'none', borderRadius: '24px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: decision.trim() ? 'none' : '0 4px 18px rgba(45,106,79,0.22)', letterSpacing: '0.01em' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" />
              </svg>
              Start a New Decision
            </button>
            <button
              onClick={() => router.push('/history')}
              style={{ padding: '14px', borderRadius: '24px', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'white', color: '#1A1A1A', border: '1.5px solid #E0DBD3', transition: 'all 0.2s' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              View My Decisions
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* SHARE MODAL                                */}
      {/* ══════════════════════════════════════════ */}
      {shareModalOpen && (
        <div
          onClick={() => setShareModalOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0' }}
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
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EEEBE6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6B6B', fontSize: '18px', fontWeight: 400, lineHeight: 1 }}
              >×</button>
            </div>

            {/* Share card preview */}
            <a
              href={typeof window !== 'undefined' ? window.location.origin : '/'}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', borderRadius: '16px', overflow: 'hidden', marginBottom: '18px', textDecoration: 'none' }}
            >
              {/* TOP HALF — photo or gradient */}
              <div style={{ position: 'relative', height: '170px', background: '#1A3C2A', overflow: 'hidden' }}>
                {winnerImageUrl ? (
                  <img
                    src={winnerImageUrl}
                    alt={winnerOption?.name ?? ''}
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
                    <span style={{ fontFamily: "'Fraunces', serif", fontSize: '17px', fontWeight: 800, color: '#1A1A1A', lineHeight: 1 }}>{maxScore.toFixed(1)}</span>
                    <span style={{ fontFamily: "'Fraunces', serif", fontSize: '11px', fontWeight: 700, color: '#1A1A1A' }}>pts</span>
                  </div>
                </div>
              </div>
              {/* BOTTOM HALF */}
              <div style={{ background: 'linear-gradient(160deg, #1E4D35 0%, #2D6A4F 100%)', padding: '14px 18px 20px' }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', fontWeight: 700, marginBottom: '4px', fontFamily: "'DM Sans', sans-serif" }}>MY CHOICE</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '14px' }}>{winnerOption?.name}</div>
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
