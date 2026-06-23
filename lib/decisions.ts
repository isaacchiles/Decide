import { createClient } from '@/lib/supabase/client';

export type DecisionStatus = 'draft' | 'complete';

export type DecisionRecord = {
  id: string;
  status: DecisionStatus;
  step: number;
  title: string;
  constraints: string[] | null;
  preferences: string[] | null;
  criteria: { name: string; weight: number; rationale: string }[];
  options: { name: string; source: string }[];
  scores: Record<string, Record<string, number>>;
  winner_name: string;
  winner_score: number;
  share_anonymously: boolean;
  created_at: string;
};

/**
 * Save a decision draft when the user clicks "Build My Decision Matrix".
 * Uses the pre-generated decision ID so the later complete-save can upsert
 * cleanly into the same row.
 */
export async function saveDraft(params: {
  id: string;
  title: string;
  constraints: string[];
  preferences: string[];
}): Promise<boolean> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('decisions')
    .upsert(
      {
        id:                params.id,
        user_id:           user.id,
        title:             params.title.trim() || 'Untitled decision',
        status:            'draft',
        step:              1,
        constraints:       params.constraints,
        preferences:       params.preferences,
        criteria:          [],
        options:           [],
        scores:            {},
        winner_name:       '',
        winner_score:      0,
        share_anonymously: false,
      },
      { onConflict: 'id' }
    );

  if (error) {
    console.error('saveDraft error:', error);
    return false;
  }
  return true;
}

/**
 * Save a completed decision. Takes the pre-generated draft ID and upserts
 * the full record — the draft row (if it exists) becomes the complete decision.
 */
export async function saveDecision(params: {
  id: string;
  title: string;
  criteria: DecisionRecord['criteria'];
  options: DecisionRecord['options'];
  scores: DecisionRecord['scores'];
  winner_name: string;
  winner_score: number;
  share_anonymously?: boolean;
}): Promise<boolean> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('decisions')
    .upsert(
      {
        id:                params.id,
        user_id:           user.id,
        title:             params.title,
        status:            'complete',
        step:              5,
        criteria:          params.criteria,
        options:           params.options,
        scores:            params.scores,
        winner_name:       params.winner_name,
        winner_score:      params.winner_score,
        share_anonymously: params.share_anonymously ?? false,
      },
      { onConflict: 'id' }
    );

  if (error) {
    console.error('saveDecision error:', error);
    return false;
  }
  return true;
}

/**
 * Load all decisions for the current user, newest first.
 * Belt-and-suspenders: .eq('user_id') in addition to RLS policy.
 */
export async function loadDecisions(): Promise<DecisionRecord[]> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('loadDecisions error:', error);
    return [];
  }

  return data ?? [];
}

/**
 * Load a single decision by ID for the current user.
 * Belt-and-suspenders: .eq('user_id') in addition to RLS policy.
 */
export async function getDecision(id: string): Promise<DecisionRecord | null> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('getDecision error:', error);
    return null;
  }

  return data ?? null;
}

/**
 * Delete a decision by ID.
 * Belt-and-suspenders: .eq('user_id') in addition to RLS policy.
 */
export async function deleteDecision(id: string): Promise<boolean> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('decisions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}
