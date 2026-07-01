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
      messages: [{ role: 'user', content: prompt }],
      ...(posthogServer ? {
        posthogDistinctId: user.id,
        posthogTraceId:    trace_id ?? decision_id,
        posthogProperties: { decision_id },
      } : {}),
    }) as Anthropic.Message;

    const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
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
