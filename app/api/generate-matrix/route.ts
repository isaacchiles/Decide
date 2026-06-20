import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { decision, constraints, preferences } = await req.json();

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
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response (handles edge cases where Claude adds a preamble)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Could not parse AI response' },
        { status: 500 }
      );
    }

    const data = JSON.parse(jsonMatch[0]);

    // Validate structure before returning
    if (!Array.isArray(data.criteria) || !Array.isArray(data.options)) {
      return NextResponse.json(
        { error: 'Unexpected AI response structure' },
        { status: 500 }
      );
    }

    // Tag options with source
    data.options = data.options.map((o: { name: string }) => ({
      ...o,
      source: 'AI suggested',
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error('generate-matrix error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
