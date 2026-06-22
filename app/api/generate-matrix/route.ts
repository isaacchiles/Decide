import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { decision, constraints, preferences, model: modelOverride } = await req.json();

    const ALLOWED_MODELS: Record<string, string> = {
      sonnet: 'claude-sonnet-4-6',
      haiku:  'claude-haiku-4-5-20251001',
    };
    const model = ALLOWED_MODELS[modelOverride as string] ?? 'claude-sonnet-4-6';

    const prompt = `You are a decision-making assistant helping someone make a clear, structured decision.

Decision: ${decision?.trim() || 'Not specified'}
Constraints (must-haves / deal-breakers): ${constraints?.length ? constraints.join(', ') : 'None specified'}
Preferences (nice-to-haves): ${preferences?.length ? preferences.join(', ') : 'None specified'}

Generate a decision matrix with:
1. Exactly 5 weighted criteria that capture what matters most for this specific decision. Weights must be whole numbers that sum to exactly 100.
2. 2-3 real, specific options the person should evaluate.

Rules:
- Criteria names must be concise (1–3 words)
- Each rationale must be one sentence referencing the user's specific constraints or preferences
- Options must be real, named choices (not generic placeholders)
- Weights must be whole numbers summing to exactly 100

Return ONLY valid JSON with no other text, markdown, or explanation:
{
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
      message.content[0].type === 'text' ? message.content[0].text : '';

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

    return NextResponse.json({ ...data, _model: model });
  } catch (err: unknown) {
    console.error('generate-matrix error:', err);
    // Classify Anthropic API errors so the client can show the right message
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('credit') || msg.includes('billing') || msg.includes('402')) {
      return NextResponse.json({ error: 'credits_exhausted' }, { status: 402 });
    }
    if (msg.includes('overloaded') || msg.includes('529') || msg.includes('rate')) {
      return NextResponse.json({ error: 'overloaded' }, { status: 503 });
    }
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
