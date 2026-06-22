import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { decision, criteria, options } = await request.json();

    const criteriaList = criteria
      .map((c: { name: string; weight: number }, i: number) => `${i}. ${c.name} (${c.weight}% weight)`)
      .join('\n');

    const optionList = options
      .map((o: { name: string }, i: number) => `${i}. ${o.name}`)
      .join('\n');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are helping someone make a decision. Score each option on each criterion from 1 (poor) to 5 (excellent) based on your real-world knowledge.

Decision: ${decision}

Criteria (indexed 0-based):
${criteriaList}

Options (indexed 0-based):
${optionList}

Return ONLY a JSON object. Outer keys are option indices, inner keys are criterion indices, values are integers 1-5.
Be honest and differentiated — avoid giving everything a 3. Use the full range.
Example format:
{"0":{"0":4,"1":2,"2":5},"1":{"0":3,"1":5,"2":2}}`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');

    const scores = JSON.parse(match[0]);

    const validated: Record<string, Record<string, number>> = {};
    for (const oi of Object.keys(scores)) {
      validated[oi] = {};
      for (const ci of Object.keys(scores[oi])) {
        const v = Number(scores[oi][ci]);
        validated[oi][ci] = Math.min(5, Math.max(1, isNaN(v) ? 3 : Math.round(v)));
      }
    }

    return NextResponse.json({ scores: validated });
  } catch (err: unknown) {
    console.error('suggest-scores error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('credit') || msg.includes('billing') || msg.includes('402')) {
      return NextResponse.json({ error: 'credits_exhausted', scores: {} }, { status: 402 });
    }
    if (msg.includes('overloaded') || msg.includes('529') || msg.includes('rate')) {
      return NextResponse.json({ error: 'overloaded', scores: {} }, { status: 503 });
    }
    return NextResponse.json({ error: 'server_error', scores: {} }, { status: 500 });
  }
}
