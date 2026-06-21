import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { decision, constraints, preferences, existingOptions } = await req.json();

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

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ options: [] });

    const data = JSON.parse(match[0]);
    const options = (data.options ?? []).map((o: { name: string }) => ({
      name: o.name,
      source: 'AI suggested',
    }));

    return NextResponse.json({ options });
  } catch (err) {
    console.error('suggest-options error:', err);
    return NextResponse.json({ options: [] });
  }
}
