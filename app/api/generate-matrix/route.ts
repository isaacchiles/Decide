import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { checkAndIncrementLimit } from '@/lib/ratelimit';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rateLimit = await checkAndIncrementLimit(user.id, 'generate-matrix');
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'rate_limited', limit: rateLimit.limit }, { status: 429 });
  }

  try {
    const { decision, constraints, preferences } = await req.json();
    const model = 'claude-sonnet-4-6';

    const prompt = `You are a decision-making assistant helping someone make a clear, structured decision.

Decision: ${decision?.trim() || 'Not specified'}
Constraints (must-haves / deal-breakers): ${constraints?.length ? constraints.join(', ') : 'None specified'}
Preferences (nice-to-haves): ${preferences?.length ? preferences.join(', ') : 'None specified'}

Generate a decision matrix with:
1. Exactly 5 weighted criteria that capture what matters most for this specific decision. Weights must be whole numbers that sum to exactly 100.
2. 2-3 real, specific options the person should evaluate.
3. A vertical classification for the decision category.

Rules:
- Criteria names must be concise (1–3 words)
- Each rationale must be one sentence referencing the user's specific constraints or preferences
- Options must be real, named choices (not generic placeholders)
- Weights must be whole numbers summing to exactly 100
- vertical must be exactly one of: "product" (laptops, electronics, consumer goods), "auto" (cars, trucks, vehicles), "insurance", "credit_card", "loan", "mortgage", "mattress", or "unknown"

Return ONLY valid JSON with no other text, markdown, or explanation:
{
  "vertical": "string",
  "criteria": [
    { "name": "string", "weight": number, "rationale": "string" }
  ],
  "options": [
    { "name": "string" }
  ]
}`;

    const message = await client.messages.create({
      model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text =
      message.content[0]?.type === 'text' ? message.content[0].text : '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Could not parse AI response' },
        { status: 500 }
      );
    }

    const data = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(data.criteria) || !Array.isArray(data.options)) {
      return NextResponse.json(
        { error: 'Unexpected AI response structure' },
        { status: 500 }
      );
    }

    data.options = data.options.map((o: { name: string }) => ({
      ...o,
      source: 'AI suggested',
    }));

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('generate-matrix error:', err);
    // Use typed Anthropic SDK errors — branch on .status, not message strings
    if (err instanceof Anthropic.APIError) {
      if (err.status === 402) return NextResponse.json({ error: 'credits_exhausted' }, { status: 402 });
      if (err.status === 429) return NextResponse.json({ error: 'overloaded' }, { status: 503 });
      if (err.status === 529) return NextResponse.json({ error: 'overloaded' }, { status: 503 });
    }
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
