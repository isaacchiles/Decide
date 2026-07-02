import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { PostHogAnthropic } from '@posthog/ai/anthropic';
import { createClient } from '@/lib/supabase/server';
import { checkAndIncrementLimit } from '@/lib/ratelimit';
import { posthogServer } from '@/lib/posthog-server';

const client = posthogServer
  ? new PostHogAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, posthog: posthogServer })
  : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rateLimit = await checkAndIncrementLimit(user.id, 'suggest-options');
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'rate_limited', limit: rateLimit.limit, options: [] }, { status: 429 });
  }

  try {
    const { decision, constraints, preferences, existingOptions, decision_id, trace_id } = await req.json();

    const existing = (existingOptions as string[]).join(', ');

    const prompt = `You are a decision-making assistant. Suggest 2 additional options for this decision that are meaningfully different from the existing ones.

Decision: ${decision?.trim() || 'Not specified'}
Constraints: ${constraints?.length ? constraints.join(', ') : 'None'}
Preferences: ${preferences?.length ? preferences.join(', ') : 'None'}
Already considering: ${existing}

Rules:
- Suggest exactly 2 options
- Must be real, specific, named choices (not generic)
- Must not duplicate or be too similar to existing options
- Should genuinely fit the constraints and preferences

Return ONLY valid JSON, no other text:
{ "options": [{ "name": "string" }, { "name": "string" }] }`;

    const message = await (client.messages.create as Function)({
      model: 'claude-sonnet-5',
      max_tokens: 512,
      // Sonnet 5 defaults to adaptive thinking; disabled here for latency —
      // this is a short structured-JSON task on a live loading screen, and
      // thinking tokens add wait time without a clear quality payoff. See
      // CHANGELOG.md 2026-07-02. Revisit if we want to A/B quality later.
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: prompt }],
      ...(posthogServer ? {
        posthogDistinctId: user.id,
        posthogTraceId:    trace_id ?? decision_id,
        posthogProperties: { decision_id },
      } : {}),
    }) as Anthropic.Message;

    // Sonnet 5 has adaptive thinking on by default, so the text block is not
    // always content[0] — a thinking block can precede it. Find the first
    // text block instead of assuming position 0 (root cause of the
    // "Could not parse AI response" bug seen post-Sonnet-5-migration).
    const textBlock = message.content.find((b) => b.type === 'text');
    const text = textBlock && textBlock.type === 'text' ? textBlock.text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ options: [] });

    const data = JSON.parse(match[0]);
    const options = (data.options ?? []).map((o: { name: string }) => ({
      name: o.name,
      source: 'AI suggested',
    }));

    return NextResponse.json({ options });
  } catch (err: unknown) {
    console.error('suggest-options error:', err);
    if (err instanceof Error) posthogServer?.captureException(err, user.id);
    if (err instanceof Anthropic.APIError) {
      if (err.status === 402) return NextResponse.json({ error: 'credits_exhausted', options: [] }, { status: 402 });
      if (err.status === 429 || err.status === 529) return NextResponse.json({ error: 'overloaded', options: [] }, { status: 503 });
    }
    return NextResponse.json({ options: [] });
  }
}
